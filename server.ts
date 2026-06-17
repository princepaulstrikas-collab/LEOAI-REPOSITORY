import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with limits for handling base64 images/attachments
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Lazy initializer for the Gemini SDK to prevent startup crashes if key is omitted
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Robust fallback and retry runner to heal 553, 503 (Overloaded) and 429 (Quota) errors dynamically!
async function generateContentWithHeal(
  ai: GoogleGenAI,
  model: string,
  contents: any,
  config: any,
  backupModels: string[] = ["gemini-1.5-flash", "gemini-2.5-flash"]
) {
  const modelsToTry = [model, ...backupModels];
  let finalError: any = null;

  for (const currentModel of modelsToTry) {
    let retries = 2; // For each model, try up to 3 times (initial + 2 retries)
    while (retries >= 0) {
      try {
        console.log(`[AI-Healer] Attempting generation with ${currentModel} (retries left: ${retries})...`);
        const result = await ai.models.generateContent({
          model: currentModel,
          contents,
          config
        });
        return { response: result, modelUsed: currentModel };
      } catch (err: any) {
        finalError = err;
        const errMsg = String(err.message || "").toLowerCase();
        const errString = typeof err === "object" ? JSON.stringify(err) : String(err);
        
        console.warn(`[AI-Healer Failed] Model ${currentModel} error:`, err.message || err);

        const isTransient = errMsg.includes("553") || 
                            errMsg.includes("503") || 
                            errMsg.includes("429") || 
                            errMsg.includes("limit") ||
                            errMsg.includes("exhausted") || 
                            errMsg.includes("unavailable") || 
                            errMsg.includes("overloaded") || 
                            errMsg.includes("demand") ||
                            errMsg.includes("temporary") ||
                            errString.includes("503") ||
                            errString.includes("429") ||
                            errString.includes("RESOURCE_EXHAUSTED") ||
                            errString.includes("UNAVAILABLE");
        
        if (!isTransient && !errMsg.includes("api key")) {
          // If it is a structural validation or API key error, proceed to next model immediately to avoid waiting
          break;
        }

        retries--;
        if (retries >= 0) {
          // Linear retry delay multiplier
          const waitMs = 1200 * (3 - retries);
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
    }
  }
  throw finalError || new Error("All fallback generative model layers exhausted during auto-healing.");
}

// -------------------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------------------

// Health & Config endpoint
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    environment: process.env.NODE_ENV || "development"
  });
});

// MULTIMODAL CHAT / VISION PROXY
app.post("/api/chat", async (req: express.Request, res: express.Response) => {
  try {
    const { prompt, systemInstruction, history, attachment, useSearch, useMaps, useHighThinking, useLowLatency } = req.body;
    const ai = getAI();

    // Prepare contents
    let contents: any[] = [];

    // Append history if provided
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }]
        });
      });
    }

    // Prepare parts for the current message
    const currentParts: any[] = [];
    if (attachment && attachment.data && attachment.mimeType) {
      // Remove data URL prefix if found
      let base64Data = attachment.data;
      if (base64Data.includes(";base64,")) {
        base64Data = base64Data.split(";base64,")[1];
      }
      currentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: attachment.mimeType
        }
      });
    }

    currentParts.push({ text: prompt || "Hello! Who are you?" });

    contents.push({
      role: "user",
      parts: currentParts
    });

    let tools: any[] = [];
    if (useSearch) tools.push({ googleSearch: {} });
    if (useMaps) tools.push({ googleMaps: {} });

    let modelToUse = "gemini-3.5-flash";
    if (useLowLatency) modelToUse = "gemini-3.1-flash-lite";
    // For video analysis or high thinking, we use pro
    if (useHighThinking || (attachment && attachment.mimeType.startsWith("video/"))) {
      modelToUse = "gemini-3.1-pro-preview";
    }

    const config: any = {
      systemInstruction: systemInstruction || "You are an all-in-one AI Companion ready to assist with any request.",
    };

    if (tools.length > 0) config.tools = tools;
    if (useHighThinking) {
      // Do not set maxOutputTokens, set thinkingLevel to HIGH
      config.thinkingConfig = { thinkingLevel: "HIGH" };
    } else {
      config.temperature = 0.7;
    }

    const { response, modelUsed } = await generateContentWithHeal(
      ai,
      modelToUse,
      contents,
      config
    );

    res.json({ text: response.text, modelUsed: modelUsed });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong during generation." });
  }
});

// IMAGE GENERATION PROXY
app.post("/api/image", async (req: express.Request, res: express.Response) => {
  try {
    const { prompt, aspectRatio = "1:1", size = "1K" } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required for image generation." });
      return;
    }

    const ai = getAI();
    
    // We call generateContent with gemini-3-pro-image-preview
    const { response } = await generateContentWithHeal(
      ai,
      "gemini-3-pro-image-preview",
      {
        parts: [
          {
            text: `[Target resolution: ${size}]. ${prompt}`,
          },
        ],
      },
      {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
      [] // No backup models to ensure we hit the pro image model
    );

    let base64Image = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("No image was returned by the generative model.");
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (error: any) {
    console.error("Image API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image." });
  }
});

// AUDIO TRANSCRIPTION PROXY
app.post("/api/transcribe", async (req: express.Request, res: express.Response) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Audio data is required." });
    }
    
    let base64Data = audioData;
    if (base64Data.includes(";base64,")) {
      base64Data = base64Data.split(";base64,")[1];
    }

    const ai = getAI();
    const { response } = await generateContentWithHeal(
      ai,
      "gemini-3.5-flash",
      [{
        inlineData: {
          data: base64Data,
          mimeType: mimeType || "audio/webm"
        }
      }, { text: "Provide a highly accurate transcription of this audio. Output only the transcribed text." }],
      {}
    );

    res.json({ text: response.text });
  } catch (e: any) {
    console.error("Transcription error:", e);
    res.status(500).json({ error: e.message || "Failed to transcribe." });
  }
});

// TEXT TO SPEECH (TTS) PROXY
app.post("/api/tts", async (req: express.Request, res: express.Response) => {
  try {
    let { text, voice = "Kore" } = req.body;
    if (!text) {
      res.status(400).json({ error: "Text is required for Speech synthesis." });
      return;
    }

    // Default to Kore if Zephyr or invalid voice is passed
    const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"];
    if (!validVoices.includes(voice)) {
      voice = "Kore";
    }

    const ai = getAI();
    
    const { response } = await generateContentWithHeal(
      ai,
      "gemini-3.1-flash-tts-preview",
      [{ parts: [{ text: text }] }],
      {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
      [] // No backup models for TTS yet, but enables auto-retry
    );

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || "audio/pcm";
    if (!base64Audio) {
      throw new Error("Audio synthesis did not return a valid audio part.");
    }

    res.json({ audio: base64Audio, mimeType });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    const errString = typeof error === "object" ? JSON.stringify(error) : String(error);
    const isQuota = errString.toLowerCase().includes("quota") || 
                    errString.includes("429") || 
                    errString.toLowerCase().includes("exhausted") ||
                    (error.message && (
                      error.message.toLowerCase().includes("quota") || 
                      error.message.includes("429") || 
                      error.message.toLowerCase().includes("exhausted")
                    ));
    
    res.status(500).json({ 
      error: error.message || "Failed to synthesize speech.",
      isQuotaExceeded: isQuota
    });
  }
});

// MUSIC GENERATION PROXY (Lyria) OR fallback creative desc generator
app.post("/api/music", async (req: express.Request, res: express.Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required for track drafting." });
      return;
    }

    const ai = getAI();
    
    // We will attempt to run lyria-3-clip-preview. In many preview instances,
    // we want a highly robust experience: if lyria throws, we catch it 
    // and instead use gemini-3.5-flash to write a gorgeous bespoke lyric list, chords,
    // and synth descriptions so the UI can play a procedural custom track as a delightful fallback!
    try {
      const responseStream = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt,
        config: {
          responseModalities: [Modality.AUDIO],
        }
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            audioBase64 += part.inlineData.data;
            if (part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (audioBase64) {
        res.json({
          audio: audioBase64,
          mimeType: mimeType,
          lyrics: lyrics || "Instrumental composition in progress...",
          mode: "real-clip"
        });
        return;
      }
    } catch (innerError: any) {
      console.warn("Lyria clip generation failed; using fallback procedural blueprint: ", innerError.message);
    }

    // FALLBACK: Generate procedural structured metadata to synthesize a beautiful rhythm
    // directly on the browser using Web Audio API synth! This is mindblowing because it works instantly!
    // Use healed generator to bypass quota/demand peaks
    const { response: promptRefiner } = await generateContentWithHeal(
      ai,
      "gemini-3.5-flash",
      `Design a procedural music plan for prompt: "${prompt}". Return purely a JSON block containing:
      {
        "tempo": number (e.g., 60 to 140),
        "key": "C major", "A minor" etc,
        "notes": Array of string frequencies or notes to play on our synthesizer,
        "chords": Array of objects { "chord": "Cmaj", "notes": [261.63, 329.63, 392.00] },
        "visualizerStyle": "ambient" | "techno" | "retro" | "cosmic",
        "description": "Short poetic guide of this song vibe",
        "lyrics": " Poetic verses matching the vibe"
      }
      Do not include markdown or other text, just valid JSON.`,
      {
        responseMimeType: "application/json"
      }
    );

    let refinedData = {
      tempo: 100,
      key: "A Minor",
      notes: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00],
      chords: [
        { chord: "Am", notes: [220, 261.63, 329.63] },
        { chord: "F", notes: [174.61, 220, 261.63] },
        { chord: "C", notes: [261.63, 329.63, 392] },
        { chord: "G", notes: [196, 246.94, 293.66] }
      ],
      visualizerStyle: "cosmic",
      description: "Generative acoustic-ambient waves synthesized on-the-fly.",
      lyrics: "Procedural sound design enabled in workspace."
    };

    try {
      if (promptRefiner.text) {
        refinedData = JSON.parse(promptRefiner.text.trim());
      }
    } catch (e) {
      // Keep default
    }

    res.json({
      procedural: refinedData,
      mode: "synthesized",
      lyrics: refinedData.lyrics,
      description: refinedData.description
    });

  } catch (error: any) {
    console.error("Music API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate music piece." });
  }
});

// VEO 3 VIDEO GENERATION PROXY & DYNAMIC PIXELS ENGINE
app.post("/api/video", async (req: express.Request, res: express.Response) => {
  try {
    const { 
      prompt, 
      quality = "480p", 
      aspectRatio = "16:9", 
      frameRate = "30fps",
      firstFrame = null,
      lastFrame = null,
      referenceImages = []
    } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required for Veo 3 Video synthesis." });
      return;
    }

    // Standard helper variables for base64 conversions
    const cleanBase64 = (dataUrl: string) => {
      if (dataUrl.includes(";base64,")) {
        return dataUrl.split(";base64,").pop() || "";
      }
      return dataUrl;
    };

    const getMimeType = (dataUrl: string, defaultType = "image/png") => {
      if (dataUrl.includes("data:")) {
        const match = dataUrl.match(/data:([^;]+);/);
        if (match) return match[1];
      }
      return defaultType;
    };

    const ai = getAI();

    // Refinement: leverage auto-healing generator to build a custom rendering setup block for our canvas fallback
    const { response: promptRefiner } = await generateContentWithHeal(
      ai,
      "gemini-3.5-flash",
      `You are Veo 3.1 AI Render Core. Cleanly parse the following video prompt and write a custom 3D drawing, motion, and particle instructions block so our HTML5 Canvas can draw a beautiful, fluid, continuous cinematic simulation while loading.
      Prompt: "${prompt}"
      
      Respond with a single valid JSON block containing:
      {
        "primaryColor": "hex string",
        "secondaryColor": "hex string",
        "backgroundColor": "hex string (very dark or black)",
        "particleType": "sparkles" | "plasma" | "grid" | "matrix" | "bubbles" | "snow" | "fireflies" | "nebula" | "digital-rain",
        "movementType": "vortex" | "drift" | "waves" | "expand" | "oscillation" | "jitter" | "hyperdrive",
        "speed": number (0.5 to 3.5),
        "complexity": number (8 to 40),
        "titleStamp": "Short elegant uppercase watermark string (maximum 20 characters)",
        "captionStamp": "Poetic descriptive caption matching the scene (maximum 60 characters)",
        "elements": Array of objects { "type": "circle" | "ring" | "line" | "star" | "rect" | "arc", "count": number, "pulse": boolean, "glow": boolean }
      }
      Do not include any markdown, backticks, or other text. Return ONLY pure JSON.`,
      {
        responseMimeType: "application/json"
      }
    );

    let refinedData = {
      primaryColor: "#f59e0b",
      secondaryColor: "#3b82f6",
      backgroundColor: "#070709",
      particleType: "sparkles",
      movementType: "vortex",
      speed: 1.2,
      complexity: 25,
      titleStamp: "VEO 3 AI RENDER",
      captionStamp: "Establishing Temporal coordinates...",
      elements: [
        { type: "ring", count: 3, pulse: true, glow: true },
        { type: "star", count: 8, pulse: false, glow: true }
      ]
    };

    try {
      if (promptRefiner.text) {
        refinedData = JSON.parse(promptRefiner.text.trim());
      }
    } catch (e) {
      console.warn("Could not parse Veo response JSON, using defaults:", e);
    }

    // Check if real generation should proceed
    let operationName = `models/veo-3.1-lite-generate-preview/operations/op_${Math.random().toString(36).substr(2, 9)}`;
    let status = "COMPLETED";

    // Detect ideal model and dimensions based on features
    const hasRefImages = Array.isArray(referenceImages) && referenceImages.length > 0;
    const is4K = quality === "4K-UHD" || quality === "4K" || quality === "4k";
    
    // Always use fast generate preview as requested
    const modelToUse = 'veo-3.1-fast-generate-preview';

    // Map resolutions: lowest Veo resolution is 720p, upgrade 480p to 720p dynamically!
    let resolutionToUse = "720p";
    if (quality === "1080p-HD" || quality === "1080p-hd" || quality === "1080p") {
      resolutionToUse = "1080p";
    } else if (is4K) {
      resolutionToUse = "4k";
    }

    // Coerce unsupported ratios: Veo supports 16:9 and 9:16 natively
    let aspectToUse = aspectRatio === "9:16" ? "9:16" : "16:9";
    let apiWarning: string | null = null;

    try {
      console.log(`Routing to Google Veo 3 SDK client (${modelToUse}):`, { resolutionToUse, aspectToUse });
      
      const veoConfig: any = {
        numberOfVideos: 1,
        resolution: resolutionToUse,
        aspectRatio: aspectToUse
      };

      // Handle Reference Images (up to 3)
      if (hasRefImages) {
        veoConfig.referenceImages = referenceImages.slice(0, 3).map((b: string) => ({
          image: {
            imageBytes: cleanBase64(b),
            mimeType: getMimeType(b)
          },
          referenceType: "ASSET"
        }));
      }

      // Handle First Frame Start Image (Image-to-Video)
      const imagePayload = firstFrame ? {
        imageBytes: cleanBase64(firstFrame),
        mimeType: getMimeType(firstFrame)
      } : undefined;

      // Handle Last Frame End Image (Morphing)
      if (lastFrame) {
        veoConfig.lastFrame = {
          imageBytes: cleanBase64(lastFrame),
          mimeType: getMimeType(lastFrame)
        };
      }

      // Trigger standard long-running video generate operation
      const generationResult = await ai.models.generateVideos({
        model: modelToUse,
        prompt: prompt,
        image: imagePayload,
        config: veoConfig
      });

      if (generationResult && generationResult.name) {
        operationName = generationResult.name;
        status = "PENDING";
        console.log("Veo 3 synthesis success. Operation created:", operationName);
      }

    } catch (veoErr: any) {
      console.warn("Failed to complete real Veo API generation (falling back to procedurally rendered preview mode):", veoErr.message || veoErr);
      const errStr = typeof veoErr === 'object' ? JSON.stringify(veoErr) : String(veoErr);
      if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
        apiWarning = "QUOTA_EXHAUSTED";
      } else {
        apiWarning = veoErr.message || String(veoErr);
      }
    }

    res.json({
      operationName: operationName,
      procedural: refinedData,
      status: status,
      engine: modelToUse,
      resolution: resolutionToUse,
      aspectRatio: aspectRatio,
      frameRate: frameRate,
      warning: apiWarning
    });

  } catch (error: any) {
    console.error("Video API Error:", error);
    res.status(500).json({ error: error.message || "Failed to initiate Veo video pipeline." });
  }
});

// VEO 3 VIDEO DEEPLY OPTIMIZED STATUS POLLING ENDPOINT
app.post("/api/video-status", async (req: express.Request, res: express.Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      res.status(400).json({ error: "Operation name is required to fetch status coordinates." });
      return;
    }

    // Check if it was generated inside simulated/procedural mode
    if (operationName.includes("op_")) {
      res.json({
        done: true,
        status: "completed",
        simulated: true
      });
      return;
    }

    const ai = getAI();
    console.log("Polling Veo operation state for:", operationName);
    
    const updated = await ai.operations.getVideosOperation({
      operation: { name: operationName } as any
    });

    const hasVideoUri = !!updated.response?.generatedVideos?.[0]?.video?.uri;

    res.json({
      done: updated.done,
      status: updated.done ? (hasVideoUri ? "completed" : "failed") : "rendering",
      response: updated.response,
      error: updated.error
    });

  } catch (error: any) {
    console.error("Polling error on operation:", error);
    res.status(500).json({ error: error.message || "Failed to poll Veo background task progress." });
  }
});

// SECURE SERVER-SIDE PROXY PLAYBACK STREAM WITH DYNAMIC RANGE SUPPORT
app.get("/api/video-play", async (req: express.Request, res: express.Response) => {
  try {
    const operationName = req.query.operationName as string;
    if (!operationName) {
      res.status(400).send("operationName query parameter is required.");
      return;
    }

    const ai = getAI();
    const updated = await ai.operations.getVideosOperation({
      operation: { name: operationName } as any
    });

    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      res.status(404).send("Synthesized video URI could not be located in operation.");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const videoResponse = await globalThis.fetch(videoUri, {
      headers: { 'x-goog-api-key': apiKey || "" }
    });

    if (!videoResponse.ok) {
      res.status(videoResponse.status).send(`Unable to fetch target stream. Source returned status: ${videoResponse.status}`);
      return;
    }

    // Buffer the entire small video payload to enable length measurement and range request routing
    const arrayBuffer = await videoResponse.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const totalLength = videoBuffer.length;

    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
      
      if (start >= totalLength || end >= totalLength || start > end) {
        res.writeHead(416, { "Content-Range": `bytes */${totalLength}` });
        res.end();
        return;
      }

      const chunksize = (end - start) + 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${totalLength}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
        "Content-Disposition": 'inline; filename="video_stream.mp4"'
      });
      res.end(videoBuffer.subarray(start, end + 1));
    } else {
      res.writeHead(200, {
        "Content-Length": totalLength,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Disposition": 'inline; filename="video_stream.mp4"'
      });
      res.end(videoBuffer);
    }

  } catch (err: any) {
    console.error("Proxy video stream failed:", err);
    res.status(500).send(err.message || "Internal streaming proxy pipeline failure.");
  }
});

// SECURE SERVER-SIDE PROXY DOWNLOAD ATTACHMENT WITH EXPLICIT CONTENT-LENGTH
app.get("/api/video-download", async (req: express.Request, res: express.Response) => {
  try {
    const operationName = req.query.operationName as string;
    if (!operationName) {
      res.status(400).send("operationName query parameter is required.");
      return;
    }

    const ai = getAI();
    const updated = await ai.operations.getVideosOperation({
      operation: { name: operationName } as any
    });

    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      res.status(404).send("Synthesized video URI not found.");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const videoResponse = await globalThis.fetch(videoUri, {
      headers: { 'x-goog-api-key': apiKey || "" }
    });

    if (!videoResponse.ok) {
      res.status(videoResponse.status).send("Failed to download video payload from storage servers.");
      return;
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    res.writeHead(200, {
      "Content-Length": videoBuffer.length,
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="veo3_export_${Date.now()}.mp4"`
    });
    res.end(videoBuffer);

  } catch (err: any) {
    console.error("Proxy video download failed:", err);
    res.status(500).send(err.message);
  }
});

// STRUCTURED STRATEGIC BLUEPRINT GENERATOR (All-in-one planner/brainstormer)
app.post("/api/blueprint", async (req: express.Request, res: express.Response) => {
  try {
    const { goal, difficultyPref = "Adaptive" } = req.body;
    if (!goal) {
      res.status(400).json({ error: "Goal or vision description is required for blueprint planning." });
      return;
    }

    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a comprehensive, actionable project blueprint/schedule to achieve this goal: "${goal}". Target Difficulty: ${difficultyPref}. Include detailed, high-impact tasks and breakdown.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Elegant short title of the project blueprint.",
            },
            summary: {
              type: Type.STRING,
              description: "A summary explaining the design approach, motivation, and strategic advice.",
            },
            difficulty: {
              type: Type.STRING,
              description: "Assessed level of difficulty (e.g. 'Beginner', 'Intermediate', 'Advanced', 'Specialist').",
            },
            estimatedTotalTime: {
              type: Type.STRING,
              description: "Estimated cumulative time needed (e.g. '12 hours', '3 weeks', '4 months').",
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of highly specific practical tricks or common pitfalls to stand out or save time."
            },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: "Phase title (e.g. Phase 1: Research, Phase 2: Implementation)" },
                  description: { type: Type.STRING, description: "Short purpose of this phase." },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Underlying task name." },
                        actionableInstruction: { type: Type.STRING, description: "Exactly what to do in 1 sentence." },
                        estimatedDuration: { type: Type.STRING, description: "Duration (e.g. 30m, 2h, 1d)" },
                        milestoneImportance: { type: Type.STRING, description: "Critical, Recommended, or Sandbox" }
                      },
                      required: ["name", "actionableInstruction"]
                    }
                  }
                },
                required: ["phaseNumber", "title", "description", "tasks"]
              },
              description: "Phased logical breakdown of the route to execution."
            }
          },
          required: ["title", "summary", "difficulty", "estimatedTotalTime", "tips", "phases"]
        }
      }
    });

    let blueprintObj = {};
    if (response.text) {
      blueprintObj = JSON.parse(response.text.trim());
    } else {
      throw new Error("Empty plan body returned.");
    }

    res.json(blueprintObj);
  } catch (error: any) {
    console.error("Blueprint API Error:", error);
    res.status(500).json({ error: error.message || "Failed to organize actionable plan." });
  }
});


// -------------------------------------------------------------------------
// VITE OR STATIC PUBLIC DIRECTORY
// -------------------------------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind strictly on port 3000 and broadcast localhost for compatibility
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Omni Workspace] Server boot. Listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
