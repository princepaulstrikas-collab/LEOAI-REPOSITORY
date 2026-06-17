import React, { useState, useRef } from "react";
import { AspectRatioType } from "../types";
import { Video, RefreshCw, Download, Image as ImageIcon, X } from "lucide-react";

export default function OmniVideo() {
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState<"16:9" | "9:16">("16:9");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [startImage, setStartImage] = useState<{ data: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Upload error: Only image attachments are supported for image-to-video.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setStartImage({
          data: reader.result,
          mimeType: file.type
        });
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSynthesize = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStatusText("Initiating Veo 3.1 Fast Generate Preview...");

    try {
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          aspectRatio: selectedRatio,
          firstFrame: startImage ? startImage.data : undefined
        })
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.error || "Failed to initialize video generation.");
      }

      if (resData.warning) {
        setErrorMessage(`Server Warning: ${resData.warning}`);
      }

      // Check for operation completion logic if needed, but here we can just display the proxy stream if simulated or pending
      if (resData.operationName) {
         setStatusText(`Operation started: ${resData.operationName}. Polling for completion...`);
         pollOperation(resData.operationName);
      } else {
         throw new Error("No operationName returned.");
      }

    } catch (e: any) {
      setErrorMessage(e.message || "An expected video model timeout occurred.");
      setIsLoading(false);
    }
  };

  const pollOperation = async (opName: string) => {
      try {
        const statusRes = await fetch("/api/video-status", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ operationName: opName })
        });
        const statusData = await statusRes.json();
        if (statusData.done) {
           if (statusData.status === "completed") {
             if (statusData.simulated) {
                // Procedural fallback not fully handled here because Veo requires real video
                setErrorMessage("Simulated fallback activated due to API limits.");
             } else {
                setGeneratedUrl(`/api/video-play?operationName=${encodeURIComponent(opName)}`);
             }
             setIsLoading(false);
           } else {
             setErrorMessage("Video generation failed on the server.");
             setIsLoading(false);
           }
        } else {
           setTimeout(() => pollOperation(opName), 5000); // Poll every 5 seconds
        }
      } catch (err) {
        setErrorMessage("Lost connection to polling server.");
        setIsLoading(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-14rem)] min-h-[500px]">
      
      {/* Settings */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm overflow-y-auto max-h-[80vh]">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Video className="text-slate-800" size={18} />
            Veo Director
          </h3>
          <p className="text-xs text-slate-500">
            Generate stunning video from text or animate an image with Veo 3.1 Fast Generate Preview.
          </p>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Prompt Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the motion, lighting, and camera angle..."
            disabled={isLoading}
            className="w-full h-32 text-sm bg-slate-50 border border-slate-200 hover:border-slate-350 focus:outline-none focus:border-slate-800 focus:bg-white rounded-xl p-3 text-slate-800 focus:ring-1 focus:ring-slate-800 resize-none disabled:opacity-50"
          />
        </div>

        {/* Source Image */}
        <div className="space-y-2">
           <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
             Start Frame (Optional Image-to-Video)
           </label>
           <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
           {startImage ? (
              <div className="relative inline-block w-full max-w-[200px] border border-slate-300 rounded overflow-hidden">
                <img src={startImage.data} alt="Start Frame" className="w-full" referrerPolicy="no-referrer" />
                <button onClick={() => { setStartImage(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X size={12} /></button>
              </div>
           ) : (
              <button disabled={isLoading} onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 rounded p-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                 <ImageIcon size={16} /> Choose Image
              </button>
           )}
        </div>

        {/* Aspect Ratio Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {["16:9", "9:16"].map((opt) => {
              const isActive = selectedRatio === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedRatio(opt as any)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl flex items-center justify-center gap-2.5 transition-all text-xs font-medium border-2 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700 disabled:opacity-50"
                  }`}
                >
                  {opt === "16:9" ? "Landscape (16:9)" : "Portrait (9:16)"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => handleSynthesize()}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-12 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Rendering...
            </>
          ) : (
             "Generate Video"
          )}
        </button>

        {isLoading && statusText && <p className="text-xs text-slate-500 animate-pulse">{statusText}</p>}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650 font-medium">
            🚩 Video Compiler Error: {errorMessage}
          </div>
        )}
      </div>

      {/* Output */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center min-h-[460px] h-full relative">
        {generatedUrl ? (
          <div className="w-full flex flex-col items-center space-y-4">
            <video src={generatedUrl} controls autoPlay loop className="w-full max-w-lg rounded-xl border border-slate-300 shadow-md" crossOrigin="anonymous"></video>
          </div>
        ) : (
          <div className="text-center p-6 space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Video size={25} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-md">Video Render Stage Empty</p>
              <p className="text-xs text-slate-400">Input prompt details and optionally an image to generate stunning visuals.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
