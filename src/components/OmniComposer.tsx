import React, { useState, useRef, useEffect } from "react";
import { ProceduralMusic } from "../types";
import { Music, Play, Square, Loader2, Sparkles, Wand2, Volume2, Info, Headphones } from "lucide-react";

export default function OmniComposer() {
  const [prompt, setPrompt] = useState("Ambient meditation pad with cosmic echoes and a slow, grounding lofi beat");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [compositionState, setCompositionState] = useState<{
    mode: "synthesized" | "real-clip";
    lyrics?: string;
    description?: string;
    procedural?: ProceduralMusic;
    audioUrl?: string;
  } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Web Audio Context reference for live synthesizer fallback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillators = useRef<any[]>([]);
  const synthTimer = useRef<any>(null);

  // Stop synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopSynthPlayback();
    };
  }, []);

  const handleCompose = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorStatus(null);
    stopSynthPlayback();
    setCompositionState(null);

    try {
      const response = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.error || "Synthesis orchestrator failure.");
      }

      if (resData.mode === "real-clip" && resData.audio) {
        // High-fidelity binary audio returned (Lyria preview clip)
        const rawBin = atob(resData.audio);
        const arrayBuf = new ArrayBuffer(rawBin.length);
        const view = new Uint8Array(arrayBuf);
        for (let i = 0; i < rawBin.length; i++) {
          view[i] = rawBin.charCodeAt(i);
        }
        const blob = new Blob([arrayBuf], { type: resData.mimeType || "audio/wav" });
        const audUrl = URL.createObjectURL(blob);

        setCompositionState({
          mode: "real-clip",
          lyrics: resData.lyrics,
          description: "Generative high-fidelity digital clip drafted using elite neural rendering models.",
          audioUrl: audUrl
        });

      } else {
        // Fallback procedural blueprint to play using browser Web Audio API synth
        setCompositionState({
          mode: "synthesized",
          lyrics: resData.lyrics,
          description: resData.description || "Interactive procedural blueprint drafted.",
          procedural: resData.procedural
        });
      }

    } catch (e: any) {
      setErrorStatus(e.message || "Synthesis network error.");
    } finally {
      setIsLoading(false);
    }
  };

  // Browser-based procedural audio player representing generated chords/vibe
  const startSynthPlayback = () => {
    if (!compositionState || !compositionState.procedural) return;

    try {
      const { tempo, chords } = compositionState.procedural;
      // Initialize Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      setIsPlaying(true);
      let step = 0;

      const playStep = () => {
        if (!chords || chords.length === 0) return;
        const currentChord = chords[step % chords.length];

        // Highlight active step
        setCurrentStep(step % chords.length);

        // Schedule oscillator synthesizers for this chord
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        // Soft envelope fade-out to prevent clicks
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        gainNode.connect(ctx.destination);

        const chordOscillators = currentChord.notes.map((freq: number) => {
          const osc = ctx.createOscillator();
          // Use pleasant triangle wave for lofi sound
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(gainNode);
          osc.start();
          return osc;
        });

        // Add a subtle metallic high-hat or bleep
        if (step % 2 === 0) {
          const beatGain = ctx.createGain();
          beatGain.gain.setValueAtTime(0.03, ctx.currentTime);
          beatGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          beatGain.connect(ctx.destination);
          
          const sharpOsc = ctx.createOscillator();
          sharpOsc.type = "sine";
          sharpOsc.frequency.setValueAtTime(880, ctx.currentTime);
          sharpOsc.connect(beatGain);
          sharpOsc.start();
          setTimeout(() => {
            try { sharpOsc.stop(); } catch(e){}
          }, 200);
        }

        // Keep oscillator references so we can stop them
        activeOscillators.current.push(...chordOscillators);

        // Schedule next chord in sequence based on tempo BPM
        const durationSec = 60 / (tempo || 100) * 2; // Keep chords slow & meditative
        synthTimer.current = setTimeout(() => {
          step++;
          playStep();
        }, durationSec * 1000);
      };

      playStep();

    } catch (e) {
      console.error("Web Audio initialize failed:", e);
    }
  };

  const stopSynthPlayback = () => {
    setIsPlaying(false);
    if (synthTimer.current) {
      clearTimeout(synthTimer.current);
    }
    // Stop oscillators
    activeOscillators.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    activeOscillators.current = [];

    // Close AudioCtx
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSynthPlayback();
    } else {
      if (compositionState?.audioUrl) {
        // Standard playback for live clip
        const audio = new Audio(compositionState.audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.play().then(() => setIsPlaying(true));
        // Simple hook to stop clip
        (window as any)._activeGeneratedAudioClip = audio;
      } else {
        startSynthPlayback();
      }
    }
  };

  return (
    <div id="omnicomposer-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Settings inputs (Left) */}
      <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-5 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-serif italic text-white text-lg tracking-wide flex items-center gap-2">
            <Music className="text-indigo-400" size={18} />
            Interactive Composer
          </h3>
          <p className="text-xs text-gray-500">
            Design professional melodies, chords, or ambient soundscapes from raw written coordinates.
          </p>
        </div>

        {/* Dynamic Vibe controller input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Melody Vibe Coordinates
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            className="w-full h-28 text-xs bg-[#121212] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl p-3 text-gray-200 placeholder-gray-600 resize-none font-sans disabled:opacity-50"
            placeholder="e.g., retro lofi cyberpunk beats with analog synths..."
          />
        </div>

        <button
          onClick={handleCompose}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-11 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:bg-white/10 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Arranging Channels...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Harmonize Track
            </>
          )}
        </button>

        {errorStatus && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-[11px] text-red-300 font-mono">
            FAIL // {errorStatus}
          </div>
        )}

        <div className="bg-white/2 bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-xl space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            Workspace Synth Engine
          </p>
          <p className="text-[10.5px] leading-relaxed text-gray-400">
            If neural audio limits are met on your project environment, the workspace gracefully fallbacks to program a custom synth chord blueprint instantly, synthesized on-the-fly straight into your speakers!
          </p>
        </div>
      </div>

      {/* Track Player & Visualizer (Right) */}
      <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[380px] relative overflow-hidden">
        
        {compositionState ? (
          <div className="space-y-6 z-10">
            
            {/* Header / Vibe summary */}
            <div>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full select-none">
                {compositionState.mode === "real-clip" ? "High-Fi Digital Draft" : "Generative Procedural Synth"}
              </span>
              <h4 className="text-white font-serif italic text-lg mt-3">
                &ldquo;{prompt.substring(0, 48)}&rdquo;...
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {compositionState.description}
              </p>
            </div>

            {/* Synthesizer Track Blueprint (Visual columns that pulse) */}
            <div className={`p-4 bg-[#111] border border-white/5 rounded-xl space-y-3`}>
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Key Signature: {compositionState.procedural?.key || "Standard Am"}</span>
                <span>Tempo Vibe: {compositionState.procedural?.tempo || 100} BPM</span>
              </div>

              {/* Grid of chords */}
              <div className="grid grid-cols-4 gap-2">
                {compositionState.procedural?.chords ? (
                  compositionState.procedural.chords.map((ch, idx) => {
                    const isStepActive = isPlaying && currentStep === idx;
                    return (
                      <div
                        key={idx}
                        className={`text-center p-2.5 rounded-lg border transition-all duration-300 ${
                          isStepActive
                            ? "bg-indigo-600/30 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                            : "bg-[#0b0b0b] border-white/5 text-gray-500"
                        }`}
                      >
                        <p className="text-xs font-bold leading-none">{ch.chord}</p>
                        <p className="text-[9px] font-mono opacity-60 mt-1">
                          {ch.notes.map(n => Math.round(n)).join(", ")}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-4 text-center text-xs text-gray-500 py-2">
                    Waveform stream synced successfully.
                  </div>
                )}
              </div>
            </div>

            {/* Lyrics or Poetry panel */}
            {compositionState.lyrics && (
              <div className="p-3.5 bg-[#0e0e0e] border-l-2 border-indigo-500 text-gray-300 rounded-r-xl">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 select-none">
                  Syllable Harmony & Lyrics
                </p>
                <p className="text-xs leading-relaxed italic text-gray-300 font-serif whitespace-pre-line">
                  {compositionState.lyrics}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleTogglePlay}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 h-11 rounded-xl flex items-center gap-2 transition-all cursor-pointer font-semibold text-xs shadow-md select-none"
              >
                {isPlaying ? <Square size={14} /> : <Play size={14} className="fill-current" />}
                {isPlaying ? "Deactivate Synth" : "Listen Composition"}
              </button>
              {isPlaying && (
                <div className="flex gap-1 items-end h-5">
                  <div className="w-1 bg-indigo-400 h-full animate-pulse rounded-full" />
                  <div className="w-1 bg-indigo-500 h-[60%] animate-pulse rounded-full" />
                  <div className="w-1 bg-indigo-600 h-[80%] animate-pulse rounded-full" />
                  <div className="w-1 bg-indigo-400 h-[30%] animate-pulse rounded-full" />
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center p-6 space-y-4 max-w-sm mx-auto my-auto self-center">
            <div className="w-16 h-16 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center mx-auto text-gray-500">
              <Headphones size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-gray-300 text-sm">Harmonics Master Offline</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Describe the melodic coordinates inside the studio input on the left to program customized synthesizers and poetry layers seamlessly.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
