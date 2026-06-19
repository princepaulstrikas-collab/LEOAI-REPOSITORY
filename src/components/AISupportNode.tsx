import React, { useState, useEffect, useRef } from "react";
import { UserSession, Message } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { 
  HelpCircle, MessageSquare, Send, Loader2, RefreshCw, Sparkles, 
  ChevronRight, AlertTriangle, CheckCircle, Mail, ShieldAlert, Cpu 
} from "lucide-react";

interface AISupportNodeProps {
  userSession: UserSession;
  onLogEvent: (txt: string) => void;
  isDarkMode: boolean;
}

export default function AISupportNode({ userSession, onLogEvent, isDarkMode }: AISupportNodeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Complaints form state
  const [fullName, setFullName] = useState(userSession.username || "");
  const [emailAddress, setEmailAddress] = useState(userSession.email || "");
  const [issueCategory, setIssueCategory] = useState("Setup & Node Configuration");
  const [complaintText, setComplaintText] = useState("");
  const [priority, setPriority] = useState("High");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSubmittedSuccess, setComplaintSubmittedSuccess] = useState(false);
  const [pastComplaints, setPastComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const SUPPORT_SYSTEM_INSTRUCTION = `You are the LEOREX Advanced Systems AI Helpdesk Engineer. Your primary directive is to provide deep technical assistance, address setup/configuration questions, resolve billing/subscription inquiries, and support creative tool usage.
If they are facing Google Sign-In issues: Explain that embedded browser IFrames often block cookies or Google authorization popups. Advise them to click the "Open Standalone App" button to launch the application outside the nested preview window where popups trigger instantly.
If they are asking about Payment/Premium upgrades: Tell them they can pay using standard card authorization or direct bank transfer to LEOREX's OPAY Bank Account 8165638800 (EZE CHIOMA CHRISTIANA) in Nigeria. Advise them to submit their transfer receipt from the billing modal to link it instantly.
Keep responses concise, elegant, authoritative, and extremely clear.`;

  // Fetch past complaints lodged by the current authenticated user email
  const fetchComplaintsHistory = async () => {
    if (!userSession.email) return;
    setLoadingComplaints(true);
    try {
      const q = query(
        collection(db, "leorex_complaints"),
        where("userEmail", "==", userSession.email)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      // Sort newest first
      setPastComplaints(list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch (err) {
      console.warn("Could not retrieve complaints ledger:", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaintsHistory();
  }, [userSession.email]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle message dispatch to AI
  const handleSendSupportMessage = async () => {
    if (!inputValue.trim()) return;
    setErrorStatus(null);
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: inputValue
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue("");

    try {
      // Map history to simple shape
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      // Post queries to general API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg.text,
          systemInstruction: SUPPORT_SYSTEM_INSTRUCTION,
          history: historyPayload
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Support channel returned connection malfunction.");
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: data.text || "Support node completed empty response."
        }
      ]);

      onLogEvent(`AI Support addressed inquiry regarding: "${userMsg.text.substring(0, 18)}..."`);
    } catch (e: any) {
      console.error(e);
      setErrorStatus(e.message || "Failed to contact systems helpdesk.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit formal complaint ticket directly to Firestore leorex_complaints
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setSubmittingComplaint(true);
    try {
      await addDoc(collection(db, "leorex_complaints"), {
        fullName: fullName.trim() || userSession.username || "Anonymous Client",
        userEmail: emailAddress.trim() || userSession.email || "anonymous_complaint@leorex.com",
        username: userSession.username || "anonymous",
        category: issueCategory,
        complaintText: complaintText.trim(),
        priority: priority,
        status: "open", // Opened status for Prince Paul Strikas admin dashboard
        createdAt: serverTimestamp(),
        dateString: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setComplaintText("");
      setComplaintSubmittedSuccess(true);
      onLogEvent(`Technical Complaint escalated: "[${priority}] ${issueCategory}" logged to Owner Hub.`);
      fetchComplaintsHistory(); // reload logs
      
      setTimeout(() => {
        setComplaintSubmittedSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Complaint lodgement failed:", err);
      alert("Error logging ticket. Please check connection.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scaleUp font-sans">
      
      {/* LEFT COLUMN: INTERACTIVE AI HELPDESK (Line 1 to 8 of grid) */}
      <div className={`lg:col-span-7 flex flex-col h-[520px] rounded-2xl border overflow-hidden ${
        isDarkMode ? "bg-black/40 border-white/10" : "bg-white border-slate-200"
      }`}>
        
        {/* Header Support Title */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 select-none ${
          isDarkMode ? "bg-[#0b0c10]/40 border-white/5" : "bg-slate-50 border-slate-150"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isDarkMode ? "bg-indigo-950/20 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
            }`}>
              <HelpCircle size={16} />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Interactive Systems Consulter</p>
              <p className="text-[9.5px] text-gray-500">Address node problems, upgrade billing, and explore error remedies.</p>
            </div>
          </div>
          <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-mono font-bold">HELP_NODE</span>
        </div>

        {/* Chat log messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-11 h-11 rounded-full bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Cpu size={18} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold">Ask AI Technical Support Companion</p>
                <p className="text-[11px] text-gray-500 max-w-sm leading-relaxed">
                  Describe any performance lags, Naira transfer doubts, Google auth difficulties, or media configuration questions. Our system engineer is ready.
                </p>
              </div>

              {/* Sample troubleshooting seeds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2 select-none text-[11px] font-medium">
                {[
                  "I cannot sign in using my Google account",
                  "How to pay using OPAY bank transfer?",
                  "Where do I set up visual rendering tools?",
                  "Address slow track narration synthesis"
                ].map((txt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(txt);
                    }}
                    className={`p-2 rounded-lg text-left border text-gray-400 hover:text-white transition-all cursor-pointer ${
                      isDarkMode ? "bg-white/2 border-white/5 hover:border-white/15" : "bg-slate-100 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {txt} ↗
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs shrink-0 select-none ${
                    m.role === "user" ? "bg-indigo-600 text-white" : "bg-[#111] border border-white/15 text-indigo-400"
                  }`}>
                    {m.role === "user" ? "U" : "⚙️"}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-100"
                      : isDarkMode ? "bg-black/40 border border-white/5 text-gray-300" : "bg-slate-100 border-slate-150 text-slate-800"
                  }`}>
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-6.5 h-6.5 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-xs text-indigo-400">
                    ⚙️
                  </div>
                  <div className="bg-black/20 border border-white/5 p-2 px-3.5 rounded-xl flex items-center gap-2 text-[10.5px] text-gray-500">
                    <Loader2 size={11} className="animate-spin text-indigo-400" />
                    <span>Analyzing setup logs...</span>
                  </div>
                </div>
              )}

              {errorStatus && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-[10.5px]">
                  ⚠️ Error contacting support node: {errorStatus}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className={`p-3 border-t shrink-0 ${isDarkMode ? "bg-[#0b0c10]/20 border-white/5" : "bg-slate-50 border-slate-150"}`}>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendSupportMessage();
              }}
              placeholder="State technical, credential or billing incident..."
              className={`w-full text-xs h-10 pl-3 pr-10 rounded-xl focus:outline-none focus:border-indigo-500/60 border ${
                isDarkMode 
                  ? "bg-black/60 border-white/10 text-white placeholder:text-gray-600" 
                  : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <button
              onClick={handleSendSupportMessage}
              className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Send size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: ESCALATIONS & TICKETING GATE (Line 9 to 12 of grid) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Lodgement Card */}
        <form onSubmit={handleSubmitComplaint} className={`p-5 rounded-2xl border space-y-4 ${
          isDarkMode ? "bg-black/45 border-white/10" : "bg-white border-slate-200"
        }`}>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-500" /> Lodge Technical Complaint
            </h4>
            <p className="text-[10px] text-gray-500 mt-1 leading-normal">
              If the AI cannot resolve or bypass your setup constraint, lodge a ticket here. All complaints are forwarded instantly to owner <span className="font-bold underline text-indigo-400 font-mono select-all">princepaulstrikas@gmail.com</span>.
            </p>
          </div>

          {complaintSubmittedSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-xs flex items-center gap-1.5 animate-scaleUp leading-relaxed">
              <CheckCircle size={14} className="shrink-0" />
              <span>Incidental parameter submitted directly to technical team inbox!</span>
            </div>
          )}

          <div className="space-y-3 font-sans">
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-gray-500 font-bold pl-0.5">Your Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full text-xs h-8.5 px-3 rounded-lg focus:outline-none focus:border-amber-500/60 border ${
                  isDarkMode ? "bg-black/60 border-white/15 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase text-gray-500 font-bold pl-0.5">Your Registered Email</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="to get reply solutions"
                className={`w-full text-xs h-8.5 px-3 rounded-lg focus:outline-none focus:border-amber-500/60 border ${
                  isDarkMode ? "bg-black/60 border-white/15 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold pl-0.5">Incident Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className={`w-full text-xs h-8.5 px-2 rounded-lg focus:outline-none border ${
                    isDarkMode ? "bg-[#111] border-white/15 text-gray-200" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option>Google Sign-In Failure</option>
                  <option>Naira / OPAY Payment Pending</option>
                  <option>Audio Synthesis Latency</option>
                  <option>Strategic Blueprint Error</option>
                  <option>General System Lag</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold pl-0.5">Urgency Index</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`w-full text-xs h-8.5 px-2 rounded-lg focus:outline-none border ${
                    isDarkMode ? "bg-[#111] border-white/15 text-amber-400" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option>Low</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase text-gray-500 font-bold pl-0.5">Describe issue constraints explicitly</label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                rows={3.5}
                placeholder="Be clear: State exact steps you performed, card details or NGN OPAY transfer receipts so we activate you manual Premium instantly."
                className={`w-full text-xs p-2 rounded-lg focus:outline-none focus:border-amber-500/60 border ${
                  isDarkMode ? "bg-black/60 border-white/15 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingComplaint || !complaintText.trim()}
            className="w-full bg-amber-500 hover:bg-amber-450 hover:scale-101 text-black font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5 select-none disabled:opacity-50"
          >
            {submittingComplaint ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Forwarding parameters...
              </>
            ) : (
              <>
                <Mail size={12} /> Escalate Ticket to Owner
              </>
            )}
          </button>
        </form>

        {/* Complaints History List */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDarkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-gray-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Escalation Lodgements ({pastComplaints.length})</h5>
          </div>

          {loadingComplaints ? (
            <div className="text-center py-4 text-[10px] text-gray-500 italic flex items-center justify-center gap-1.5">
              <RefreshCw size={10} className="animate-spin" /> Retrieving ticket histories...
            </div>
          ) : pastComplaints.length === 0 ? (
            <p className="text-[10px] text-gray-500 italic text-center p-4">No logged complaints under your current handle.</p>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {pastComplaints.map(item => (
                <div key={item.id} className="bg-black/30 border border-white/5 p-2 rounded text-[10px] font-sans space-y-1">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-slate-300 font-bold truncate max-w-[120px] font-mono">{item.category}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                      item.priority === "Critical" 
                        ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-gray-400 line-clamp-2 leading-relaxed text-[11px] break-words">{item.complaintText}</p>
                  <div className="flex justify-between items-center text-[8px] font-mono text-gray-650 pt-0.5 border-t border-white/2">
                    <span>{item.dateString}</span>
                    <span className={`font-bold uppercase ${item.status === "resolved" ? "text-green-400" : "text-amber-400"}`}>
                      ● STATUS: {item.status || "open"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
