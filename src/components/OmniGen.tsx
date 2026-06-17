import React, { useState } from "react";
import { AspectRatioType } from "../types";
import { Sparkles, Download, RefreshCw, Layers, Check, Copy } from "lucide-react";

interface AspectOption {
  value: AspectRatioType;
  label: string;
  iconStyle: string;
}

const ASPECT_OPTIONS: AspectOption[] = [
  { value: "1:1", label: "Square (1:1)", iconStyle: "w-5 h-5 border-2 rounded-md" },
  { value: "16:9", label: "Widescreen (16:9)", iconStyle: "w-7 h-4 border-2 rounded" },
  { value: "9:16", label: "Portrait (9:16)", iconStyle: "w-4 h-7 border-2 rounded" },
  { value: "4:3", label: "Standard (4:3)", iconStyle: "w-6 h-4.5 border-2 rounded" }
];

const SUGGESTED_PROMPTS = [
  "A quiet, minimalist studio during rainfall, with moss terrariums, large circular window, cinematic photorealistic.",
  "An isometric 3D render of a futuristic cybersecurity command center, neon cyan and violet highlights, high-tech gadgetry.",
  "Watercolour painting of a cute red panda reading codex manuscripts inside a cozy library treehouse, soft sunbeams.",
  "A majestic astronaut riding a cybernetic horse through a field of glowing lavender flowers under cosmic nebula stars, surreal art."
];

export default function OmniGen() {
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioType>("1:1");
  const [selectedSize, setSelectedSize] = useState<"1K" | "2K" | "4K">("2K");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<boolean>(false);

  const handleSynthesize = async (overridePrompt?: string) => {
    const activePrompt = overridePrompt || prompt;
    if (!activePrompt.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          aspectRatio: selectedRatio,
          size: selectedSize
        })
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.error || "Failed to compile image asset.");
      }

      setGeneratedUrl(resData.imageUrl);
    } catch (e: any) {
      setErrorMessage(e.message || "An expected imaging model timeout occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedUrl) return;
    const link = document.createElement("a");
    link.href = generatedUrl;
    link.download = `omni-asset-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopiedStates(true);
    setTimeout(() => setCopiedStates(false), 2000);
  };

  return (
    <div id="omnigen-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Configuration Column (Left) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Layers className="text-slate-800" size={18} />
            Studio Artist Config
          </h3>
          <p className="text-xs text-slate-500">
            Synthesize bespoke concepts leveraging the server-side Imagen and nano-image models.
          </p>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Detailed Master Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your visual masterpiece. Be extremely specific about lights, colors, artistic style, lens depth, and subject details..."
            disabled={isLoading}
            className="w-full h-32 text-sm bg-slate-50 border border-slate-200 hover:border-slate-350 focus:outline-none focus:border-slate-800 focus:bg-white rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-800 resize-none disabled:opacity-50"
          />
        </div>

        {/* Aspect Ratio Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Canvas Proportions
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {ASPECT_OPTIONS.map((opt) => {
              const isActive = selectedRatio === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedRatio(opt.value)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl flex items-center gap-2.5 transition-all text-left text-xs font-medium border-2 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700 disabled:opacity-50"
                  }`}
                >
                  <div className={`shrink-0 ${opt.iconStyle} ${isActive ? "border-white" : "border-slate-400"}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolution Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Quality & Resolution
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {["1K", "2K", "4K"].map((s) => {
              const isActive = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s as any)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all text-center text-xs font-bold border-2 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700 disabled:opacity-50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Generator button */}
        <button
          onClick={() => handleSynthesize()}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-12 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Rendering Photons...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Synthesize Canvas
            </>
          )}
        </button>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650 font-medium">
            🚩 Image Compiler Error: {errorMessage}
          </div>
        )}

        {/* Suggested prompts library */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
            Creative Inspiration Presets
          </h4>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {SUGGESTED_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sp);
                  handleSynthesize(sp);
                }}
                disabled={isLoading}
                className="w-full text-left p-2 hover:bg-slate-50 border border-slate-150 rounded-lg text-slate-600 hover:text-slate-900 text-[11px] leading-relaxed transition-colors cursor-pointer block select-none"
              >
                ✨ &nbsp; {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Output Column (Right) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center min-h-[460px] h-full overflow-hidden relative">
        
        {generatedUrl ? (
          <div className="w-full flex flex-col items-center space-y-4">
            
            {/* Aspect container wrapper */}
            <div className={`w-full max-w-lg bg-slate-950 rounded-xl overflow-hidden border border-slate-200/50 shadow-md relative group flex items-center justify-center
              ${selectedRatio === "1:1" ? "aspect-square" : ""}
              ${selectedRatio === "16:9" ? "aspect-video" : ""}
              ${selectedRatio === "9:16" ? "aspect-[9/16] max-h-[460px]" : ""}
              ${selectedRatio === "4:3" ? "aspect-[4/3]" : ""}
            `}>
              <img
                src={generatedUrl}
                alt="Synthesis outcome"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="bg-white hover:bg-slate-100 text-slate-900 p-2.5 rounded-full shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold hover:scale-105"
                  title="Download Asset to disk"
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="bg-white hover:bg-slate-100 text-slate-900 p-2.5 rounded-full shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold hover:scale-105"
                  title="Copy base64 vector to clipboard"
                >
                  {copiedStates ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                  Copy URL
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-2.5 w-full justify-center">
              <button
                onClick={handleDownload}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download size={14} /> Download Image
              </button>
              <button
                onClick={() => handleSynthesize()}
                disabled={isLoading}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Regenerate Vibe
              </button>
            </div>
            
          </div>
        ) : (
          <div className="text-center p-6 space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Sparkles size={25} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-md">Canvas Matrix Empty</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Render coordinates are queued. Choose a prompt or describe a master vision on the left, then click &ldquo;Synthesize Canvas&rdquo; to project.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
