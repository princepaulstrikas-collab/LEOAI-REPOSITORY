import React, { useState, useRef, useEffect } from "react";
import { Mic, Play, Pause, Square, Volume2, RefreshCw, AudioLines, Download, Share2, Check } from "lucide-react";

const VOICES = [
  { id: "Kore", name: "Kore (Luminous)", desc: "Clear, intelligent female voice" },
  { id: "Aoede", name: "Aoede (Bright Core)", desc: "Bright, energetic female tone" },
  { id: "Puck", name: "Puck (Sprite Light)", desc: "Crisp, energetic male voice" },
  { id: "Fenrir", name: "Fenrir (Vanguard Deep)", desc: "Warm, resonant story-teller" },
  { id: "Charon", name: "Charon (Cosmic Astral)", desc: "Deep, narrative mystical voice" }
];

function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint8(0, 82);  // R
  view.setUint8(1, 73);  // I
  view.setUint8(2, 70);  // F
  view.setUint8(3, 70);  // F
  
  // File length
  view.setUint32(4, 36 + pcmData.length, true);
  
  // WAVE
  view.setUint8(8, 87);  // W
  view.setUint8(9, 65);  // A
  view.setUint8(10, 86); // V
  view.setUint8(11, 69); // E
  
  // fmt chunk
  view.setUint8(12, 102); // f
  view.setUint8(13, 109); // m
  view.setUint8(14, 116); // t
  view.setUint8(15, 32);  // ' '
  
  // Chunk length (16)
  view.setUint32(16, 16, true);
  
  // Sample format (1 = PCM)
  view.setUint16(20, 1, true);
  
  // Channel count (1 = Mono)
  view.setUint16(22, 1, true);
  
  // Sample rate
  view.setUint32(24, sampleRate, true);
  
  // Byte rate (sampleRate * blockAlign = sampleRate * 2)
  view.setUint32(28, sampleRate * 2, true);
  
  // Block align (channels * bytes per sample = 1 * 2 = 2)
  view.setUint16(32, 2, true);
  
  // Bits per sample (16)
  view.setUint16(34, 16, true);
  
  // data chunk
  view.setUint8(36, 100); // d
  view.setUint8(37, 97);  // a
  view.setUint8(38, 116); // t
  view.setUint8(39, 97);  // a
  
  // Data chunk length
  view.setUint32(40, pcmData.length, true);

  const output = new Uint8Array(buffer);
  output.set(pcmData, 44);

  return new Blob([output], { type: "audio/wav" });
}

export default function OmniSpeaker() {
  const [text, setText] = useState("We are all voyagers entering a digital cosmos, weaving code and imagination into beautiful systems.");
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [useWebSpeechFallback, setUseWebSpeechFallback] = useState(false);
  const [isSharingAudio, setIsSharingAudio] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `LEO-Voice-${selectedVoice}-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } else if (useWebSpeechFallback) {
      const element = document.createElement("a");
      const file = new Blob([text], {type: "text/plain"});
      element.href = URL.createObjectURL(file);
      element.download = `LEO-Script-${selectedVoice}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    }
  };

  const handleShareAudio = () => {
    const shareableLink = `${window.location.origin}/narration/voice-${selectedVoice}`;
    navigator.clipboard.writeText(`Audit this synthesized transcription from LEO AI:\n\n"${text.substring(0, 100)}..."\n\nRendered using native acoustic voice frequency signature: ${selectedVoice}.\nJoin the signal: ${shareableLink}`);
    setIsSharingAudio(true);
    setTimeout(() => setIsSharingAudio(false), 2500);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop sound on unmount/route shifts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWithWebSpeech = (textToSpeak: string, voiceId: string) => {
    if (!window.speechSynthesis) {
      setErrorStatus("Web Speech API is not supported in this browser.");
      setIsLoading(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      synthUtteranceRef.current = utterance;

      // Select voices that closely match the signature intent (female voice vs male narrator)
      const voicesList = window.speechSynthesis.getVoices();
      let matchedVoice: SpeechSynthesisVoice | null = null;

      if (voiceId === "Kore" || voiceId === "Aoede") {
        matchedVoice = voicesList.find(v => 
          (v.name.toLowerCase().includes("female") || 
           v.name.toLowerCase().includes("samantha") || 
           v.name.toLowerCase().includes("zira") || 
           v.name.toLowerCase().includes("google us english") || 
           v.name.toLowerCase().includes("hazel") ||
           v.name.toLowerCase().includes("karen")) && 
           v.lang.startsWith("en")
        ) || voicesList.find(v => v.lang.startsWith("en")) || null;
      } else {
        matchedVoice = voicesList.find(v => 
          (v.name.toLowerCase().includes("male") || 
           v.name.toLowerCase().includes("daniel") || 
           v.name.toLowerCase().includes("david") || 
           v.name.toLowerCase().includes("google uk english male") || 
           v.name.toLowerCase().includes("microsoft david")) && 
           v.lang.startsWith("en")
        ) || voicesList.find(v => v.lang.startsWith("en")) || null;
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (evt) => {
        console.error("Speech Synthesis Utterance Error:", evt);
        setIsPlaying(false);
        setIsLoading(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.error("Local speech synthesis error:", err);
      setErrorStatus("Failed to voice via browser speech engine.");
      setIsLoading(false);
    }
  };

  const handleSynthesize = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setErrorStatus(null);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (useWebSpeechFallback) {
      setAudioUrl(null);
      speakWithWebSpeech(text.trim(), selectedVoice);
      return;
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errText = data.error || "Speech synthesis failed.";
        const isQuotaExceeded = !!data.isQuotaExceeded || 
                                errText.toLowerCase().includes("quota") || 
                                errText.includes("429") || 
                                errText.toLowerCase().includes("limit") || 
                                errText.includes("RESOURCE_EXHAUSTED");
        
        if (isQuotaExceeded) {
          setErrorStatus("Cloud Quota Exceeded. Safely auto-switched to high-fidelity Device Narration engine!");
          setUseWebSpeechFallback(true);
          setAudioUrl(null);
          speakWithWebSpeech(text.trim(), selectedVoice);
          return;
        }
        throw new Error(errText);
      }

      if (!data.audio) {
        throw new Error("No payload audio data returned.");
      }

      const binaryAudio = atob(data.audio);
      const arrayBuffer = new ArrayBuffer(binaryAudio.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryAudio.length; i++) {
        view[i] = binaryAudio.charCodeAt(i);
      }
      
      const blob = pcmToWav(view, 24000);
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);

      // Play instantly
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.error("Autoplay premium block:", err);
          });
        }
      }, 100);

    } catch (e: any) {
      console.warn("Switching to SpeechSynthesis fallback due to:", e.message);
      setErrorStatus("Cloud Synthesis engine unavailable. Auto-switched to Device Narration engine.");
      setUseWebSpeechFallback(true);
      setAudioUrl(null);
      speakWithWebSpeech(text.trim(), selectedVoice);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlayback = () => {
    if (useWebSpeechFallback) {
      if (!window.speechSynthesis) return;
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPlaying(true);
        } else {
          speakWithWebSpeech(text, selectedVoice);
        }
      }
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Autoplay error on user toggle:", err);
      });
    }
  };

  const handleStop = () => {
    if (useWebSpeechFallback) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  return (
    <div id="omnispeaker-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Voice Selection Panel */}
      <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-5 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-serif italic text-white text-lg tracking-wide flex items-center gap-2">
            <Mic className="text-indigo-400" size={18} />
            Voice Synthesis Studio
          </h3>
          <p className="text-xs text-gray-500">
            Render pristine spoken acoustics using our server-side conversational narration models.
          </p>
        </div>

        {/* Narrator options with Sophisticated Dark aesthetics */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Narrator Voice Signatures
          </label>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {VOICES.map((v) => {
              const active = selectedVoice === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer border ${
                    active
                      ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                      : "bg-[#0c0c0c]/50 border-white/5 hover:bg-white/5 hover:border-white/10 text-gray-400"
                  }`}
                >
                  <div>
                    <p className={`font-semibold text-xs ${active ? "text-indigo-300" : "text-gray-300"}`}>
                      {v.name}
                    </p>
                    <p className="text-[10px] text-gray-550 opacity-80 mt-0.5">{v.desc}</p>
                  </div>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Narration source */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Script to Speak
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            maxLength={350}
            className="w-full h-24 text-xs bg-[#121212] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl p-3 text-gray-200 placeholder-gray-600 resize-none font-sans disabled:opacity-50"
            placeholder="Type script coordinates here..."
          />
          <p className="text-[9px] text-right text-gray-500 select-none">
            {text.length}/350 characters
          </p>
        </div>

        {/* Speech Engine Mode Toggle */}
        <div className="p-3 bg-[#111111]/80 rounded-xl border border-white/5 flex items-center justify-between select-none">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
              Speech Synthesis Engine
            </span>
            <span className="text-[9px] text-gray-550 block leading-snug">
              {useWebSpeechFallback 
                ? "Device Browser Engine (Unlimited)" 
                : "Cloud AI Engine (Gemini 24kHz Mono)"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setUseWebSpeechFallback(!useWebSpeechFallback);
              setErrorStatus(null);
              setAudioUrl(null);
              setIsPlaying(false);
              if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-3 py-1.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded-lg border transition-all cursor-pointer select-none ${
              useWebSpeechFallback
                ? "bg-amber-600/15 border-amber-500/30 text-amber-400 hover:bg-amber-600/25"
                : "bg-indigo-600/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/25"
            }`}
          >
            {useWebSpeechFallback ? "Local Match" : "Cloud AI"}
          </button>
        </div>

        <button
          onClick={handleSynthesize}
          disabled={isLoading || !text.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-11 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:bg-white/10 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Synthesizing Speech...
            </>
          ) : (
            <>
              <AudioLines size={14} />
              Render Speech
            </>
          )}
        </button>

        {errorStatus && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-[11px] text-red-300 font-mono">
            FAIL // {errorStatus}
          </div>
        )}
      </div>

      {/* Speaker Render Outputs (Right) */}
      <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[350px] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.04),transparent_75%)] pointer-events-none" />

        {audioUrl && !useWebSpeechFallback && (
          <audio
            ref={(el) => {
              audioRef.current = el;
            }}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {(audioUrl || useWebSpeechFallback) ? (
          <div className="text-center space-y-6 w-full max-w-sm">
            
            {/* Elegant Circular Waveform Simulator */}
            <div className={`w-32 h-32 rounded-full border border-white/10 mx-auto flex items-center justify-center relative bg-[#050505] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]`}>
              {isPlaying && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-ping opacity-70" />
                  <div className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-pulse" />
                </>
              )}
              <Volume2 size={40} className={isPlaying ? "text-indigo-400 scale-110 transition-transform" : "text-gray-600"} />
            </div>

            <div className="space-y-2">
              <h4 className="font-serif italic text-white text-md"> Narration Waveform Active</h4>
              <p className="text-xs text-gray-500">
                Rendered with <span className="text-indigo-300 font-semibold">{selectedVoice}</span> signature acoustics ({useWebSpeechFallback ? "Device Local Speech" : "Cloud AI Speech"}).
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-col gap-3 items-center w-full">
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={handleTogglePlayback}
                  className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-md select-none"
                  title={isPlaying ? "Pause audio narration" : "Play audio narration"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                </button>
                <button
                  onClick={handleStop}
                  className="w-10 h-10 rounded-full bg-[#121212] border border-white/15 hover:bg-white/5 text-gray-400 flex items-center justify-center transition-all cursor-pointer select-none"
                  title="Stop and reset speech narration"
                >
                  <Square size={14} />
                </button>
              </div>

              {/* Download and Share audio narration action panel */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleDownloadAudio}
                  className={`px-4 py-2 text-[10px] font-mono uppercase font-bold tracking-wider rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
                    downloadSuccess
                      ? "bg-green-600/20 border-green-500/30 text-green-400"
                      : "bg-[#111111] border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
                  }`}
                  title={useWebSpeechFallback ? "Download script as text file" : "Download speech audio as raw .wav file"}
                >
                  {downloadSuccess ? (
                    <>
                      <Check size={13} className="text-green-400 animate-pulse" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      <span>{useWebSpeechFallback ? "Download Script" : "Download Audio"}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareAudio}
                  className={`px-4 py-2 text-[10px] font-mono uppercase font-bold tracking-wider rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
                    isSharingAudio
                      ? "bg-amber-600/20 border-amber-500/30 text-amber-400"
                      : "bg-[#111111] border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
                  }`}
                  title="Copy a shareable secure coordinate link to clipboard"
                >
                  {isSharingAudio ? (
                    <>
                      <Check size={13} className="text-amber-400 animate-pulse" />
                      <span>Secure Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={13} />
                      <span>Share stream</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center p-6 space-y-4 max-w-xs">
            <div className="w-16 h-16 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center mx-auto text-gray-500">
              <Volume2 size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-gray-300 text-sm">Narration Empty</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Compose your written coordinates inside the studio on the left, then click Render Speech to generate deep acoustic feedback.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
