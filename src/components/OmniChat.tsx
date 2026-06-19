import React, { useState, useRef, useEffect } from "react";
import { Message, Persona } from "../types";
import { Send, Upload, Trash2, MessageSquare, Loader2, Image as ImageIcon, X, Copy, Check, Share2, ThumbsUp, ThumbsDown, FileText, Download, Mic, Square, Search, MapPin, Zap, Brain } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const PERSONAS: Persona[] = [
  {
    id: "guide",
    name: "General Guide",
    role: "Multipurpose Companion",
    avatar: "👁️‍🗨️",
    instruction: "You are an all-knowing, creative, and highly adaptive AI Guide. Answer questions accurately, clearly, and engagingly.",
    placeholder: "Ask me anything, describe a concept, or request help...",
    suggestedPrompts: [
      "Explain quantum computing simply",
      "Draft a professional reply to an email request",
      "Write a short, engaging sci-fi hook about gravity"
    ]
  },
  {
    id: "architect",
    name: "Code Architect",
    role: "Engineering Consultant",
    avatar: "💻",
    instruction: "You are an expert Senior Full-Stack Engineer and Software Architect. Provide highly efficient, modular, clean code using modern standards. Always point out potential optimizations.",
    placeholder: "Describe a script to write, a bug to fix, or an architectural choice...",
    suggestedPrompts: [
      "Write a TypeScript debounce function with generic types",
      "How should I structure a real-time chat with Express?",
      "Optimize this database query conceptually"
    ]
  },
  {
    id: "muse",
    name: "Creative Muse",
    role: "Ideation & Writer",
    avatar: "🔮",
    instruction: "You are the Creative Muse. You specialize in poetic writing, engaging hook design, scripts, lyrical outlines, and brainstorming original artistic concepts.",
    placeholder: "Draft a story plot, write lyrics, or brainstorm a design name...",
    suggestedPrompts: [
      "Write lyrics for a synthwave track about starlight",
      "Brainstorm name ideas for a quiet mindfulness workspace",
      "Provide a mystery plot outline involving an ancient timepiece"
    ]
  },
  {
    id: "polyglot",
    name: "Linguistic Oracle",
    role: "Language & Culture Expert",
    avatar: "🌍",
    instruction: "You are the Linguistic Oracle. You excel in fluent contextual translations, cultural idiomatic suggestions, and grammar polishing for multiple languages.",
    placeholder: "Type text to translate, polish, or learn cultural contexts for...",
    suggestedPrompts: [
      "Translate 'Let's catch up soon' to colloquial Japanese",
      "Polish this translation to sound highly professional in French",
      "Explain the cultural nuance of the word 'Gemütlichkeit'"
    ]
  },
  {
    id: "tutor",
    name: "Math & Logic Tutor",
    role: "STEM Specialist",
    avatar: "📐",
    instruction: "You are the Math and Logic Tutor. Break complex challenges, mathematical proofs, logic questions, or equations down into intuitive, beautifully illustrated analogies.",
    placeholder: "Paste an equation, crop a logic puzzle, or ask a STEM concept...",
    suggestedPrompts: [
      "Explain Euler's identity in an intuitive way",
      "Solve this recurrences relation: T(n) = 2T(n/2) + O(n)",
      "What is the physical meaning of entropy in thermodynamics?"
    ]
  }
];

export default function OmniChat({ userSession, onLogEvent }: { userSession?: any, onLogEvent?: (txt: string) => void }) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [attachment, setAttachment] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Advanced interactivity states
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useHighThinking, setUseHighThinking] = useState(false);
  const [useLowLatency, setUseLowLatency] = useState(false);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [feedbackStates, setFeedbackStates] = useState<Record<string, "like" | "dislike" | null>>({});
  const [pdfStates, setPdfStates] = useState<Record<string, "prompt" | "generating" | "done">>({});
  const [sharedStates, setSharedStates] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Export algorithm using premium styling guidelines
  const handleConvertToPDF = (messageText: string, messageId: string) => {
    setPdfStates(prev => ({ ...prev, [messageId]: 'generating' }));
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - (margin * 2);

      // Title & Branding
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("LION-CORE AI WORKSPACE REPORT", margin, 25);

      // Subtitle metadata details
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const personaLabel = `Persona Role: ${selectedPersona.name} — ${selectedPersona.role}`;
      const timestamp = `Timestamp: ${new Date().toLocaleString()}`;
      doc.text(personaLabel, margin, 31);
      doc.text(timestamp, margin, 36);

      // Draw premium grid accent divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, 41, pageWidth - margin, 41);

      // Document Content settings
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85); // slate-700

      // Auto wraps lines safely to fit A4 page margins
      const splitText = doc.splitTextToSize(messageText, maxLineWidth);
      
      let yPosition = 49;
      const pageHeight = doc.internal.pageSize.getHeight();
      const bottomMargin = 22;

      for (let i = 0; i < splitText.length; i++) {
        if (yPosition > pageHeight - bottomMargin) {
          doc.addPage();
          yPosition = 22; // reset height for new A4 page
        }
        doc.text(splitText[i], margin, yPosition);
        yPosition += 6.5; // proportional line spacing
      }

      // Render footers on all generated pages
      const totalPages = doc.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175); // gray-400
        doc.text("LEO AI secure cloud export transcript.", margin, pageHeight - 11);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 11);
      }

      doc.save(`LEO_AI_Report_${messageId}.pdf`);
      setPdfStates(prev => ({ ...prev, [messageId]: 'done' }));

      // Prompt resets after 4 seconds
      setTimeout(() => {
        setPdfStates(prev => ({ ...prev, [messageId]: 'prompt' }));
      }, 4000);

    } catch (err) {
      console.error("PDF engine crash detail:", err);
      setPdfStates(prev => ({ ...prev, [messageId]: 'prompt' }));
    }
  };

  const handleCopyText = (messageText: string, messageId: string) => {
    navigator.clipboard.writeText(messageText);
    setCopiedStates(prev => ({ ...prev, [messageId]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [messageId]: false }));
    }, 2000);
  };

  const handleShareResponse = (messageText: string, messageId: string) => {
    // Generate a beautiful mock layout link or directly copy shared clip
    const shareableLink = `${window.location.origin}/shared-message/${messageId}`;
    navigator.clipboard.writeText(`Check out my LEO AI response:\n\n"${messageText.substring(0, 150)}..."\n\nFull link: ${shareableLink}`);
    setSharedStates(prev => ({ ...prev, [messageId]: true }));
    setTimeout(() => {
      setSharedStates(prev => ({ ...prev, [messageId]: false }));
    }, 2500);
  };

  const handleLikeDislike = (messageId: string, rating: "like" | "dislike") => {
    setFeedbackStates(prev => {
      const current = prev[messageId];
      return {
        ...prev,
        [messageId]: current === rating ? null : rating
      };
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(`omnichat_history_${selectedPersona.id}`);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [selectedPersona]);

  const saveHistory = (newMsgs: Message[]) => {
    setMessages(newMsgs);
    localStorage.setItem(`omnichat_history_${selectedPersona.id}`, JSON.stringify(newMsgs));
  };

  const handleClear = () => {
    saveHistory([]);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setErrorStatus("Upload error: Only image or video attachments are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachment({
          data: reader.result,
          mimeType: file.type,
          name: file.name
        });
        setErrorStatus(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      setAudioError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsLoading(true);
          try {
            const response = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioData: base64Audio, mimeType: 'audio/webm' })
            });
            const data = await response.json();
            if (data.text) {
              setInputValue(prev => prev + " " + data.text);
            } else {
              setAudioError(data.error || "Failed to transcribe.");
            }
          } catch (e: any) {
             setAudioError(e.message || "Failed to contact transcription service.");
          } finally {
             setIsLoading(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      setAudioError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const activePrompt = customPrompt || inputValue;
    if (!activePrompt.trim() && !attachment) return;

    setErrorStatus(null);
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: activePrompt,
      ...(attachment ? { attachment } : {})
    };

    const currentHistory = [...messages, userMsg];
    saveHistory(currentHistory);
    setInputValue("");
    setAttachment(null);

    // Detect if user wishes to dream, paint or generate images
    const isImageGenerationRequest = 
      /imagine|create image|generate image|draw a|paint a|sketch a|render an artwork/i.test(activePrompt);

    try {
      // Save data usage to Firestore
      try {
        await addDoc(collection(db, "leorex_data_usage"), {
          category: isImageGenerationRequest ? "Artwork Synthesis" : "Conversational AI",
          prompt: activePrompt,
          email: userSession?.email || "anonymous_user",
          username: userSession?.username || "client_guest",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn("Could not save telemetry to Firestore", e);
      }

      if (onLogEvent) {
        onLogEvent(`Dispatched prompts payload: "${activePrompt.substring(0, 30)}..." to Leorex Hub.`);
      }

      let modelMsg: Message;

      if (isImageGenerationRequest) {
        // Direct inline Image Synthesizer
        const response = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: activePrompt,
            aspectRatio: "1:1"
          })
        });

        const imgData = await response.json();
        if (!response.ok || imgData.error) {
          throw new Error(imgData.error || "Image server synthesis failed.");
        }

        modelMsg = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: `🎨 **LEOREX AI Artwork Dreamer core online!**\n\nI have successfully synthesized a custom 1K resolution image according to your instruction: *"${activePrompt}"*\n\nFeel free to download the high-fidelity output as an asset.`,
          attachment: {
            data: imgData.imageUrl,
            mimeType: "image/png",
            name: "leorex_dream_art.png"
          }
        };
      } else {
        // Map history to server spec
        const apiHistory = messages.map(m => ({
          role: m.role,
          text: m.text
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMsg.text,
            systemInstruction: selectedPersona.instruction,
            history: apiHistory,
            attachment: userMsg.attachment ? {
              data: userMsg.attachment.data,
              mimeType: userMsg.attachment.mimeType
            } : undefined,
            useSearch,
            useMaps,
            useHighThinking,
            useLowLatency
          })
        });

        const resData = await response.json();

        if (!response.ok || resData.error) {
          throw new Error(resData.error || "Generation error on server.");
        }

        modelMsg = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: resData.text || "I was unable to understand that request."
        };
      }

      saveHistory([...currentHistory, modelMsg]);
    } catch (e: any) {
      setErrorStatus(e.message || "An expected server connector error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="omnichat-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
      
      {/* LEFT COLUMN: Persona Picker */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm h-full overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
          Workspace Personas
        </h3>
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
          {PERSONAS.map((p) => {
            const isSelected = selectedPersona.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p)}
                className={`w-full text-left p-3 rounded-xl flex items-center lg:items-start gap-3 transition-all duration-200 cursor-pointer min-w-[200px] shrink-0 border-2 ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="text-2xl">{p.avatar}</span>
                <div className="overflow-hidden">
                  <p className={`font-semibold text-sm ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {p.name}
                  </p>
                  <p className={`text-xs truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {p.role}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Chat Area */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm h-full overflow-hidden">
        
        {/* Chat area Header */}
        <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedPersona.avatar}</span>
            <div>
              <h4 className="font-semibold text-slate-900">{selectedPersona.name}</h4>
              <p className="text-xs text-slate-500">{selectedPersona.role}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Clear active chat history"
            >
              <Trash2 size={15} />
              Clear Chat
            </button>
          )}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-400 max-w-lg mx-auto space-y-6">
              <div className="bg-slate-100 p-4 rounded-full text-slate-600">
                <MessageSquare size={32} />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-slate-800 text-lg">
                  Greeting! I am the {selectedPersona.name}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {selectedPersona.instruction} Choose a quick-starter prompt below or type coordinates to launch.
                </p>
              </div>

              {/* Suggestions */}
              <div className="w-full grid grid-cols-1 gap-2.5">
                {selectedPersona.suggestedPrompts.map((sPrompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(sPrompt)}
                    className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-800 hover:bg-slate-900 hover:text-white transition-all duration-200 text-xs font-medium text-slate-700 rounded-xl cursor-pointer"
                  >
                    💡 &nbsp; {sPrompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                        isUser
                          ? "bg-slate-900 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none"
                      }`}
                    >
                      { m.attachment && (
                        <div className="mb-3 max-w-xs overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                          <img
                            src={m.attachment.data}
                            alt={m.attachment.name}
                            className="aspect-video w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <p className="px-2 py-1 select-none font-mono text-[9px] truncate opacity-60 bg-black/40 text-white">
                            Attachment: {m.attachment.name}
                          </p>
                        </div>
                      )}
                      
                      {/* Message Rich Text representation */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {m.text}
                      </p>

                      {/* Interactive Actions for Model (AI) response */}
                      {!isUser && (
                        <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-col gap-3">
                          {/* Copy, share, feedback buttons toolbar */}
                          <div className="flex items-center justify-between gap-4 text-slate-500">
                            <div className="flex items-center gap-2">
                              {/* Copy */}
                              <button
                                onClick={() => handleCopyText(m.text, m.id)}
                                className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-850 transition-colors cursor-pointer flex items-center gap-1.5 text-[10px]"
                                title="Copy response to clipboard"
                              >
                                {copiedStates[m.id] ? (
                                  <>
                                    <Check size={12} className="text-green-600" />
                                    <span className="text-green-600 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              {/* Share */}
                              <button
                                onClick={() => handleShareResponse(m.text, m.id)}
                                className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-850 transition-colors cursor-pointer flex items-center gap-1.5 text-[10px]"
                                title="Share response"
                              >
                                {sharedStates[m.id] ? (
                                  <>
                                    <Check size={12} className="text-green-600" />
                                    <span className="text-green-600 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 size={12} />
                                    <span>Share</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Like */}
                              <button
                                onClick={() => handleLikeDislike(m.id, "like")}
                                className={`p-1.5 rounded hover:bg-slate-250 transition-colors cursor-pointer ${
                                  feedbackStates[m.id] === "like"
                                    ? "text-indigo-600 bg-indigo-50/80 border border-indigo-200/40"
                                    : "text-slate-400 hover:text-slate-700"
                                }`}
                                title="Like response"
                              >
                                <ThumbsUp size={12} />
                              </button>

                              {/* Dislike */}
                              <button
                                onClick={() => handleLikeDislike(m.id, "dislike")}
                                className={`p-1.5 rounded hover:bg-slate-250 transition-colors cursor-pointer ${
                                  feedbackStates[m.id] === "dislike"
                                    ? "text-red-500 bg-red-50/80 border border-red-200/40"
                                    : "text-slate-400 hover:text-slate-700"
                                }`}
                                title="Dislike response"
                              >
                                <ThumbsDown size={12} />
                              </button>
                            </div>
                          </div>

                          {/* PDF conversion visual offer */}
                          <div className="bg-slate-200/50 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-300/30 gap-2">
                            <div className="flex items-center gap-2">
                              <FileText size={13} className="text-indigo-500" />
                              <span className="text-[10px] font-bold text-slate-700">
                                Convert this response to PDF?
                              </span>
                            </div>
                            <button
                              onClick={() => handleConvertToPDF(m.text, m.id)}
                              disabled={pdfStates[m.id] === "generating"}
                              className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                                pdfStates[m.id] === "generating"
                                  ? "bg-slate-200 border-slate-350 text-slate-500"
                                  : pdfStates[m.id] === "done"
                                  ? "bg-green-100 border-green-300 text-green-700 font-mono"
                                  : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500 hover:scale-102"
                              }`}
                            >
                              {pdfStates[m.id] === "generating" ? (
                                <>
                                  <Loader2 size={11} className="animate-spin" />
                                  <span>Compiling</span>
                                </>
                              ) : pdfStates[m.id] === "done" ? (
                                <>
                                  <Check size={11} />
                                  <span>Success</span>
                                </>
                              ) : (
                                <>
                                  <Download size={11} />
                                  <span>Yes, Convert & Download</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load State Animation */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-150 border border-slate-200 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin text-slate-700" />
                    <span>Processing vectors & thinking...</span>
                  </div>
                </div>
              )}

              {/* Error Status Indicator */}
              {errorStatus && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <span className="font-semibold select-none font-mono">CRITICAL ERROR:</span>
                  <span>{errorStatus}</span>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col gap-3">
          
          {/* Active Image Attachment Thumbnail */}
          {attachment && (
            <div className="flex items-center gap-2.5 bg-slate-200/60 p-2 rounded-xl border border-slate-300 self-start max-w-md">
              <div className="relative w-12 h-12 rounded overflow-hidden shadow">
                <img
                  src={attachment.data}
                  alt="analysis thumbnail"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-700 truncate">{attachment.name}</p>
                <p className="text-[9px] text-slate-500">Vision payload ready to send</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="text-slate-400 hover:text-slate-700 ml-auto cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {audioError && (
            <div className="text-xs text-red-500 mb-1 font-medium">{audioError}</div>
          )}

          {/* Settings Toggles */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs">
            <button
              onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${useSearch ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              <Search size={13} /> Google Search
            </button>
            <button
              onClick={() => setUseMaps(!useMaps)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${useMaps ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              <MapPin size={13} /> Maps Grounding
            </button>
            <button
              onClick={() => { setUseHighThinking(!useHighThinking); if(!useHighThinking) setUseLowLatency(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${useHighThinking ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              <Brain size={13} /> Deep Thinking
            </button>
            <button
              onClick={() => { setUseLowLatency(!useLowLatency); if(!useLowLatency) setUseHighThinking(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${useLowLatency ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              <Zap size={13} /> Flash Lite (Fast)
            </button>
          </div>

          <div className="flex gap-2.5 items-center">
            {/* Upload media for Vision analysis */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              onClick={handleFileUploadClick}
              disabled={isLoading}
              className="bg-white hover:bg-slate-200 border border-slate-300 text-slate-600 p-3 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm relative group"
              title="Add Image Attachment (OCR / Vision Analysis)"
            >
              <ImageIcon size={19} />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Inspect Image (Vision)
              </span>
            </button>

            {/* Mic Upload */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`border p-3 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm relative group ${isRecording ? "bg-red-50 text-red-600 border-red-300 animate-pulse" : "bg-white hover:bg-slate-200 border-slate-300 text-slate-600"}`}
              title="Record Voice Note"
            >
              {isRecording ? <Square size={19} /> : <Mic size={19} />}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {isRecording ? "Stop Recording" : "Speak (Transcribe)"}
              </span>
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              placeholder={selectedPersona.placeholder}
              className="flex-1 bg-white border border-slate-300 text-slate-800 px-4 h-12 rounded-xl text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 disabled:opacity-50"
            />

            {/* Submit button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputValue.trim() && !attachment)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 h-12 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-medium text-sm shadow-md disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
