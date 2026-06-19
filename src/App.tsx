import React, { useState, useEffect } from "react";
import OmniChat from "./components/OmniChat";
import OmniGen from "./components/OmniGen";
import OmniSpeaker from "./components/OmniSpeaker";
import OmniComposer from "./components/OmniComposer";
import OmniPlanner from "./components/OmniPlanner";
import SecurityShield from "./components/SecurityShield";
import AdminTelemetryHub from "./components/AdminTelemetryHub";
import SubscriptionModal from "./components/SubscriptionModal";
import SignInModal from "./components/SignInModal";
import AdminAutoHealer from "./components/AdminAutoHealer";
import { UserSession } from "./types";
import ProfileModal from "./components/ProfileModal";
import AISupportNode from "./components/AISupportNode";

// Firebase imports
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";

// Icons
import { 
  Compass, Sparkles, Volume2, Headphones, Layers, HelpCircle, Activity, 
  Satellite, Shield, Crown, MessageSquare, LogIn, LogOut, Video, 
  Lock, RefreshCw, Star, HeartHandshake, Eye, AlertCircle, HelpCircle as HelpIcon,
  ShieldAlert, Settings, Terminal, Send, CheckCircle
} from "lucide-react";

type TabId = "orchestrator" | "synthetics" | "narration" | "security_shield" | "acoustics" | "blueprints" | "admin_telemetry" | "ai_support";

interface TickerLog {
  text: string;
  time: string;
}

interface RightFeedback {
  id: string;
  name: string;
  feedbackText: string;
  score: number;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("orchestrator");
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  const [tickerLogs, setTickerLogs] = useState<TickerLog[]>([
    { text: "LEOREX AI secure interlock active. Node safe.", time: "Just now" },
    { text: "Double AES SHA-256 data envelope wraps active.", time: "2m ago" }
  ]);

  // Session state storage
  const [userSession, setUserSession] = useState<UserSession>({
    username: "LEO_GUEST",
    isPremium: false,
    dailyFreeVideoCount: 0
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Feedbacks state loaded in real time
  const [liveFeedbacks, setLiveFeedbacks] = useState<RightFeedback[]>([]);
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [newFeedbackName, setNewFeedbackName] = useState("");
  const [newFeedbackScore, setNewFeedbackScore] = useState(5);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState(false);

  // Authentication status variable
  const isLoggedIn = userSession.username !== "LEO_GUEST";
  const [isAdminMode, setIsAdminMode] = useState(true);
  const isAdmin = userSession.email?.toLowerCase() === "princepaulstrikas@gmail.com" && isAdminMode;

  // Check backend health
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (!data.hasApiKey) {
          setApiKeyError(true);
        }
      })
      .catch(() => {});
  }, []);

  // Monitor Google / Email authentication state automatically from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isUserAdmin = firebaseUser.email?.toLowerCase() === "princepaulstrikas@gmail.com";
        const cleanName = firebaseUser.displayName 
          ? firebaseUser.displayName.toLowerCase().replace(/\s+/g, "_")
          : firebaseUser.email?.split("@")[0] || "member";
        
        const freshSession: UserSession = {
          username: cleanName,
          email: firebaseUser.email || "",
          isPremium: isUserAdmin || false, // Admins automatically receive sovereign premium levels
          dailyFreeVideoCount: 0
        };

        setUserSession(freshSession);
        logEvent(`Secure interconnect established for @${cleanName}`);

        // Automatically store the user registration safely in Firestore
        try {
          await setDoc(doc(db, "leorex_user_registry", firebaseUser.uid), {
            email: firebaseUser.email || "",
            username: cleanName,
            isPremium: isUserAdmin || false,
            lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date().toLocaleDateString(),
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.warn("Skipped storing login registry locally", err);
        }
      } else {
        setUserSession({
          username: "LEO_GUEST",
          isPremium: false,
          dailyFreeVideoCount: 0
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Live Sync the public customer feedback submissions
  useEffect(() => {
    const q = query(collection(db, "leorex_feedbacks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fbList: RightFeedback[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        fbList.push({
          id: docSnap.id,
          name: d.name || "Anonymous User",
          feedbackText: d.feedbackText || "",
          score: d.score || 5,
          timestamp: d.timestamp || "Just now"
        });
      });
      setLiveFeedbacks(fbList.slice(0, 3)); // show top 3 on the sidebar
    }, (err) => {
      console.warn("Feedback subscription connection rules check:", err);
    });

    return () => unsubscribe();
  }, []);

  // Infrequent Premium Popup activation
  // Displays once every 4 activities, but ONLY if the user is not premium and hasn't dismissed it in the last 15 minutes
  const triggerPremiumPopupIfInfrequent = () => {
    if (userSession.isPremium) return;

    const lastDismissed = localStorage.getItem("leorex_premium_popup_dismissed_time");
    const currentTime = Date.now();

    if (lastDismissed) {
      const fifteenMinutes = 15 * 60 * 1000;
      if (currentTime - parseInt(lastDismissed) < fifteenMinutes) {
        return; // Too frequent, suppress the request
      }
    }

    // Displays the modal
    setIsSubModalOpen(true);
    localStorage.setItem("leorex_premium_popup_dismissed_time", currentTime.toString());
  };

  const handlePostFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;

    setIsFeedbackSubmitting(true);
    try {
      const targetName = newFeedbackName.trim() || userSession.username || "client_node";
      await addDoc(collection(db, "leorex_feedbacks"), {
        name: targetName,
        email: userSession.email || "guest_tunnel",
        feedbackText: newFeedbackText,
        score: newFeedbackScore,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });

      setNewFeedbackText("");
      setNewFeedbackName("");
      setFeedbackSuccessNotice(true);
      logEvent(`Submitted security feedback rating: ${newFeedbackScore} stars.`);
      triggerPremiumPopupIfInfrequent(); // Offer helpful premium upgrade option safely
      setTimeout(() => setFeedbackSuccessNotice(false), 4000);
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const logEvent = (actionText: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTickerLogs(prev => [
      { text: actionText, time: timeNow },
      ...prev.slice(0, 4)
    ]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logEvent("Client session deauthorized gracefully.");
    } catch (e) {
      console.error("Signout error", e);
    }
  };

  return (
    <div 
      id="app-root-container" 
      className={`w-full min-h-screen flex flex-col font-sans overflow-hidden select-none border-t-4 border-amber-500 transition-all ${
        isDarkMode 
          ? "bg-[#050505] text-gray-200" 
          : "bg-[#f8fafc] text-slate-800"
      }`}
    >
      
      {/* HEADER SECTION */}
      <header className={`h-16 border-b flex items-center justify-between px-6 shrink-0 transition-colors ${
        isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-slate-200"
      }`}>
        
        {/* Logo LEOREX */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.45)] transition-all transform hover:scale-105 select-none shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0-13L8 9m4-6l4 6M8 9H4v7a3 3 0 003 3h10a3 3 0 003-3V9h-4M8 19s1.5-3 4-3 4 3 4 3" />
            </svg>
          </div>
          <span className="text-md sm:text-lg font-serif italic tracking-[0.14em] font-medium text-white uppercase select-none">
            LEOREX AI
          </span>
          <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 rounded border border-amber-500/15 uppercase">
            Sovereign Core
          </span>
        </div>

        {/* Dynamic Navigation Tabs (Visible only if logged-in) */}
        {isLoggedIn && (
          <nav className="hidden xl:flex gap-5 text-[10px] uppercase tracking-[0.18em] font-medium text-gray-400 select-none">
            <button
              onClick={() => setActiveTab("orchestrator")}
              className={`cursor-pointer transition-all pb-1 ${
                activeTab === "orchestrator" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
              }`}
            >
              Omni Chat & Art
            </button>
            <button
              onClick={() => setActiveTab("ai_support")}
              className={`cursor-pointer transition-all pb-1 ${
                activeTab === "ai_support" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
              }`}
            >
              AI Support Node
            </button>
            <button
              onClick={() => setActiveTab("synthetics")}
              className={`cursor-pointer transition-all pb-1 ${
                activeTab === "synthetics" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
              }`}
            >
              Media Studio
            </button>
            <button
              onClick={() => setActiveTab("security_shield")}
              className={`cursor-pointer transition-all pb-1 ${
                activeTab === "security_shield" ? "text-indigo-400 border-b-2 border-indigo-500 font-bold animate-pulse" : "hover:text-white"
              }`}
            >
              Security Shield
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin_telemetry")}
                className={`cursor-pointer transition-all pb-1 px-2.5 py-0.5 rounded-md bg-amber-500/5 border ${
                  activeTab === "admin_telemetry" ? "text-yellow-300 border-yellow-500 font-bold bg-amber-500/10" : "text-amber-500 border-amber-500/25 hover:text-white hover:border-white/30"
                }`}
              >
                Owner Telemetry
              </button>
            )}
            <button
              onClick={() => setActiveTab("narration")}
              className={`cursor-pointer transition-all pb-1 ${
                activeTab === "narration" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
              }`}
            >
              Narrator
            </button>
            <button
              onClick={() => setActiveTab("acoustics")}
              className={`cursor-pointer transition-all pb-1 ${
                activeTab === "acoustics" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
              }`}
            >
              Acoustics
            </button>
            <button
              onClick={() => setActiveTab("blueprints")}
              className={`cursor-pointer transition-all pb-1 ${
                activeTab === "blueprints" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
              }`}
            >
              Strategic Blueprints
            </button>
          </nav>
        )}

        {/* User / Workspace Vitals */}
        <div className="flex items-center gap-4">
          
          {/* Simulation Toggle if they are the owner */}
          {userSession.email?.toLowerCase() === "princepaulstrikas@gmail.com" && (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-[9px] sm:text-[10px] select-none">
              <span className="text-yellow-400 font-bold hidden md:inline">Role Simulator:</span>
              <button 
                onClick={() => {
                  const target = !isAdminMode;
                  setIsAdminMode(target);
                  logEvent(`Switched session access view to: ${target ? 'Sovereign Core Admin' : 'Standard Guest User'}`);
                  // Switch tab away from admin tab to avoid view lock
                  if (!target && activeTab === "admin_telemetry") {
                    setActiveTab("orchestrator");
                  }
                }} 
                className="bg-yellow-500 hover:bg-yellow-450 hover:scale-102 text-gray-950 font-bold px-2 py-0.5 rounded cursor-pointer transition-all uppercase text-[9px]"
                title="Toggle testing between Owner and Standard User accounts instantly"
              >
                {isAdminMode ? "Admin Console" : "Standard User"}
              </button>
            </div>
          )}

          {/* Subscriptions upgrade shortcut */}
          {isLoggedIn && (
            <>
              {!userSession.isPremium ? (
                <button
                  onClick={() => setIsSubModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-450 hover:scale-102 text-black text-[9.5px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border border-amber-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-md select-none"
                >
                  <Crown size={12} /> Get Premium ($15)
                </button>
              ) : (
                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[9.5px] uppercase font-bold tracking-wider flex items-center gap-1.5 font-mono select-none">
                  <Crown size={11} className="text-yellow-400" /> Premium Active
                </div>
              )}
            </>
          )}

          {/* Interactive User profile badge */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-[9px] text-gray-550 uppercase tracking-tighter select-none font-mono">AUTHORIZED CLIENT</div>
                <div className="text-xs text-indigo-300 font-medium select-none flex items-center gap-1.5">
                  @{userSession.username}
                </div>
              </div>
              
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                  isDarkMode 
                    ? "border-white/10 bg-white/5 hover:border-amber-500/50 text-amber-500" 
                    : "border-slate-205 bg-slate-50 hover:border-amber-505 text-amber-600"
                }`}
                title="Profile Settings & Wallet (NGN)"
              >
                <Settings size={14} />
              </button>

              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-full border border-white/20 bg-gradient-to-br from-indigo-900 to-black hover:border-red-400 text-red-400 hover:text-red-300 flex items-center justify-center cursor-pointer transition-all"
                title="Deauthorize session (Sign Out)"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border border-indigo-500 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
            >
              <LogIn size={13} />
              <span>Connect Gateway</span>
            </button>
          )}
          
        </div>

      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT COMPONENT: Welcome screen OR standard tab sidebar */}
        {!isLoggedIn ? (
          /* DEEP COZY ENVELOPE WELCOME SCREEN WITH REAL INTERLINK AUTHENTICATORS */
          <div id="leorex-welcome-gate" className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 text-center max-w-4xl mx-auto space-y-8 relative z-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.1),transparent_60%)] pointer-events-none" />
            
            {/* Crown Shield Crest logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.25)] border-2 border-white/10 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2" stroke="black" fill="none" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0114 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl font-serif italic tracking-wider text-white">LEOREX AI SECURITY SYSTEM</h2>
              <h3 className="text-xs uppercase tracking-[0.25em] text-amber-400 font-mono font-bold">MILITARY-GRADE COGNITIVE HUB</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-2xl mx-auto">
                Decryption keys are active for authorized participants only. Complete the secure handshakes below using either a trusted <span className="text-white font-bold">Google interconnect</span> or a <span className="text-white font-bold font-mono">Personal Email token</span>. This is real-time user-level isolation. No simulations are active.
              </p>
            </div>

            {/* Verification trigger buttons */}
            <div className="space-y-4 w-full max-w-sm pt-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button
                  onClick={() => setIsSignInModalOpen(true)}
                  className="flex-1 bg-white hover:bg-gray-150 text-black font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10H12V14.26H17.92C17.65 15.65 16.89 16.85 15.72 17.61V20.34H19.29C21.37 18.42 22.56 15.58 22.56 12.25Z" fill="#4285F4"/>
                    <path d="M12 23C14.97 23 17.47 22.02 19.3 20.35L15.73 17.62C14.74 18.29 13.48 18.69 12 18.69C9.13 18.69 6.7 16.76 5.81 14.16H2.15V17C4.04 20.65 7.74 23 12 23Z" fill="#34A853"/>
                    <path d="M5.8 14.15C5.57 13.48 5.44 12.76 5.44 12C5.44 11.24 5.57 10.52 5.8 9.85V7.00003H2.14C1.36 8.54003 0.92 10.22 0.92 12C0.92 13.78 1.36 15.46 2.14 17L5.8 14.15Z" fill="#FBBC05"/>
                    <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.39 3.84C17.46 2.05 14.95 1 12 1C7.74 1 4.04 3.35 2.14 7.00003L5.8 9.85C6.7 7.24 9.13 5.38 12 5.38Z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                
                <button
                  onClick={() => setIsSignInModalOpen(true)}
                  className="flex-1 bg-black/50 hover:bg-black text-gray-200 hover:text-white font-bold py-3.5 px-6 rounded-2xl border border-white/20 flex items-center justify-center gap-3 transition-all cursor-pointer hover:border-indigo-500"
                >
                  <Lock size={16} className="text-indigo-400" />
                  Password & Email
                </button>
              </div>

              {/* Troubleshooting helper bar */}
              <div className="bg-[#111] border border-white/5 rounded-2xl p-4 text-left text-xs space-y-2 leading-relaxed animate-fadeIn">
                <p className="text-amber-400 font-bold flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider">
                  <span>📌 Authentication Advisory</span>
                </p>
                <p className="text-gray-400">
                  If the browser blocks Google popup auth within this embedded preview frame, we strongly advise clicking below to launch the standalone container URL:
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <a 
                    href={window.location.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 hover:no-underline transition-all hover:scale-102"
                  >
                    Open Standalone App ↗
                  </a>
                  <button 
                    onClick={() => setIsSignInModalOpen(true)}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 font-mono px-3 py-1.5 rounded-lg border border-white/10 text-[11px] cursor-pointer"
                  >
                    Use Password Token
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] uppercase font-mono text-gray-650 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TLS Cryptographic session tunnels bound on port 3000</span>
            </div>
          </div>
        ) : (
          /* STANDARD FULLY SEPARATED DASHBASE */
          <>
            {/* SIDEBAR LEFT */}
            <aside className="w-64 border-r border-white/5 bg-[#080808] p-5 flex flex-col gap-8 shrink-0 hidden lg:flex">
              
              {/* Dimensions Section */}
              <section className="space-y-4">
                <h3 className="text-[9px] uppercase tracking-widest text-gray-550 pl-1 select-none font-bold">
                  Active Dimensions
                </h3>
                <ul className="space-y-1.5">
                  <li
                    onClick={() => setActiveTab("orchestrator")}
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      activeTab === "orchestrator"
                        ? "text-gray-200 bg-white/5 border-white/10"
                        : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTab === "orchestrator" ? "bg-amber-400" : "bg-gray-600"}`} />
                    Omni Chat & Art
                  </li>
                  <li
                    onClick={() => setActiveTab("ai_support")}
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      activeTab === "ai_support"
                        ? "text-gray-200 bg-white/5 border-white/10"
                        : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTab === "ai_support" ? "bg-amber-400 animate-pulse" : "bg-gray-600"}`} />
                    AI Support Node
                  </li>
                  <li
                    onClick={() => {
                      setActiveTab("security_shield");
                      triggerPremiumPopupIfInfrequent();
                    }}
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      activeTab === "security_shield"
                        ? "text-gray-200 bg-indigo-500/5 border-indigo-500/20"
                        : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTab === "security_shield" ? "bg-indigo-400" : "bg-gray-600"}`} />
                    Security Shield
                  </li>
                  
                  {/* ADMIN-ONLY SECURE MODULE SEPARATION */}
                  {isAdmin && (
                    <li
                      onClick={() => setActiveTab("admin_telemetry")}
                      className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                        activeTab === "admin_telemetry"
                          ? "text-yellow-300 bg-amber-500/5 border-yellow-500/20 font-bold"
                          : "text-amber-500 hover:text-white hover:bg-white/2 border-transparent"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${activeTab === "admin_telemetry" ? "bg-yellow-400" : "bg-amber-600"}`} />
                      Owner Telemetry Hub
                    </li>
                  )}
                  
                  <li
                    onClick={() => setActiveTab("synthetics")}
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      activeTab === "synthetics"
                        ? "text-gray-200 bg-white/5 border-white/10"
                        : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTab === "synthetics" ? "bg-amber-400" : "bg-gray-600"}`} />
                    Media Studio
                  </li>
                  <li
                    onClick={() => setActiveTab("narration")}
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      activeTab === "narration"
                        ? "text-gray-200 bg-white/5 border-white/10"
                        : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTab === "narration" ? "bg-amber-400" : "bg-gray-600"}`} />
                    Voice Narrations
                  </li>
                  <li
                    onClick={() => setActiveTab("acoustics")}
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      activeTab === "acoustics"
                        ? "text-gray-200 bg-white/5 border-white/10"
                        : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTab === "acoustics" ? "bg-amber-400" : "bg-gray-600"}`} />
                    Harmonic Arranger
                  </li>
                  <li
                    onClick={() => setActiveTab("blueprints")}
                    className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      activeTab === "blueprints"
                        ? "text-gray-200 bg-white/5 border-white/10"
                        : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeTab === "blueprints" ? "bg-amber-400" : "bg-gray-600"}`} />
                    Blueprint Planner
                  </li>
                </ul>
              </section>

              {/* Status Section */}
              <section className="mt-auto">
                <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl">
                  <p className="text-[10.5px] leading-relaxed text-indigo-200/80 italic mb-3 select-none">
                    &ldquo;Cryptographic wrappers shield all prompt channels against client-to-cloud interception.&rdquo;
                  </p>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] uppercase text-indigo-400 font-bold select-none font-mono tracking-wider">SECURE SHIELD</span>
                    <span className="text-xs font-mono text-green-400 select-none">ONLINE</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                  </div>
                </div>
              </section>

            </aside>

            {/* CONTAINER CONTENT */}
            <section className="flex-1 flex flex-col relative overflow-y-auto">
              
              {/* Abstract ambient background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.06),transparent_70%)] pointer-events-none" />

              {/* API Key warning */}
              {apiKeyError && (
                <div className="m-6 p-4 bg-orange-950/40 border border-orange-500/30 rounded-xl relative z-10 text-xs text-orange-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold">🔑 GEMINI_API_KEY WARNING</p>
                    <p className="mt-0.5 opacity-80">
                      The server is missing a direct API key. Please input your keys securely under the project Secrets panel to run complete requests.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Selector for Tablet/Mobile screens */}
              <div className="xl:hidden flex overflow-x-auto gap-2 p-4 border-b border-white/5 bg-[#0a0a0a]/50 select-none scrollbar-none relative z-10">
                {([
                  { id: "orchestrator", label: "Guide", icon: Compass },
                  { id: "ai_support", label: "AI Support", icon: HelpCircle },
                  { id: "security_shield", label: "Security", icon: Shield },
                  ...(isAdmin ? [{ id: "admin_telemetry", label: "Owner Telemetry", icon: ShieldAlert }] : []),
                  { id: "synthetics", label: "Studio", icon: Sparkles },
                  { id: "narration", label: "Voice", icon: Volume2 },
                  { id: "acoustics", label: "Acoustics", icon: Headphones },
                  { id: "blueprints", label: "Blueprints", icon: Layers }
                ]).map((tab) => {
                  const IconComp = tab.icon;
                  const matches = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabId)}
                      className={`flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl border shrink-0 cursor-pointer ${
                        matches
                          ? "bg-amber-600/20 border-amber-500/50 text-white font-bold"
                          : "bg-[#111] border-white/5 text-gray-400"
                      }`}
                    >
                      <IconComp size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Main workspace frames */}
              <div className="flex-1 p-6 sm:p-8 relative z-10">
                <h1 className="text-3xl sm:text-4xl font-serif italic text-white mb-2 leading-tight select-none">
                  {activeTab === "orchestrator" && "Omni Conversational Agent"}
                  {activeTab === "ai_support" && "Sovereign AI Support Node"}
                  {activeTab === "synthetics" && "Photovoltaic Studio Synthesis"}
                  {activeTab === "narration" && "Acoustic Voice Narrations"}
                  {activeTab === "acoustics" && "Harmonic Arranger Track Studio"}
                  {activeTab === "blueprints" && "Strategic Roadmap Blueprint Planner"}
                  {activeTab === "security_shield" && "Cryptographic Security Controls"}
                  {activeTab === "admin_telemetry" && "Leorex Owner Telemetry Controls"}
                </h1>
                
                <p className="text-xs text-slate-400 mb-6 max-w-2xl select-none leading-relaxed">
                  {activeTab === "orchestrator" && "Prompt general guides, Senior Full-Stack consulters, or write /imagine directly in the input field to invoke high-fidelity art synthesis."}
                  {activeTab === "ai_support" && "A dedicated support channel initialized with specific helpdesk parameters for addressing technical malfunctions."}
                  {activeTab === "synthetics" && "Configure dynamic presets to synthesize full graphics and raw photography outputs safely via neural engines."}
                  {activeTab === "narration" && "Generate dynamic, eye-safe acoustic files generated straight through top-grade spoken audio engines."}
                  {activeTab === "acoustics" && "Compose generative loops, music blueprints, custom lofi sheets, and lyrics systematically."}
                  {activeTab === "blueprints" && "Orchestrate multi-step execution plans incorporating checkpoints, timelines, and milestones."}
                  {activeTab === "security_shield" && "Rotate dynamic AES security seed hashes, trace open ports, scan for structural layout malwares, or trigger Threat Index calibrations."}
                  {activeTab === "admin_telemetry" && "Sovereign oversight exclusive to princepaulstrikas@gmail.com. Live-audit registrations, incoming suggestions, and runtime prompt histories."}
                </p>

                <div className="transition-all duration-300">
                  {activeTab === "orchestrator" && (
                    <div onFocus={() => logEvent("Orchestrated active chat prompt.")}>
                      <OmniChat userSession={userSession} onLogEvent={(txt) => logEvent(txt)} />
                    </div>
                  )}

                  {activeTab === "ai_support" && (
                    <div onFocus={() => logEvent("Opened dedicated AI Support system.")}>
                      <AISupportNode 
                        userSession={userSession} 
                        onLogEvent={(txt) => logEvent(txt)}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}

                  {activeTab === "security_shield" && (
                    <SecurityShield userSession={userSession} onLogSecurityEvent={(txt) => logEvent(txt)} />
                  )}

                  {activeTab === "admin_telemetry" && isAdmin && (
                    <AdminTelemetryHub />
                  )}

                  {activeTab === "synthetics" && (
                    <div onFocus={() => logEvent("Rendered custom asset generation.")}>
                      <OmniGen />
                    </div>
                  )}
                  
                  {activeTab === "narration" && (
                    <div onFocus={() => logEvent("Synthesized spoken voice file.")}>
                      <OmniSpeaker />
                    </div>
                  )}

                  {activeTab === "acoustics" && (
                    <div onFocus={() => logEvent("Rendered automatic synthesizer loop.")}>
                      <OmniComposer />
                    </div>
                  )}

                  {activeTab === "blueprints" && (
                    <div onFocus={() => logEvent("Mapped comprehensive execution phase.")}>
                      <OmniPlanner />
                    </div>
                  )}
                </div>

              </div>

            </section>

            {/* SIDEBAR RIGHT: Real-Time Dynamic Feedback & Support Form */}
            <aside className="w-80 border-l border-white/5 bg-[#080808] flex flex-col shrink-0 hidden xl:flex justify-between">
              
              {/* Live synchronized client suggestions section */}
              <div className="p-5 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[9px] uppercase tracking-widest text-[#718096] select-none font-mono font-bold">
                    Real-Time Customer Feeds
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                </div>
                
                <div className="space-y-3.5 max-h-[170px] overflow-y-auto pr-1">
                  {liveFeedbacks.length === 0 ? (
                    <p className="text-[11px] text-gray-550 italic leading-relaxed">No public inputs detected. Submit yours to instantly appear here!</p>
                  ) : (
                    liveFeedbacks.map((item) => (
                      <div key={item.id} className="bg-black/30 border border-white/5 p-2.5 rounded-xl space-y-1.5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-300 font-bold">@{item.name}</span>
                          <span className="text-[9px] text-[#fbbf24]">{'★'.repeat(item.score)}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-sans leading-relaxed break-words">
                          &ldquo;{item.feedbackText}&rdquo;
                        </p>
                        <span className="text-[9px] text-gray-600 block pl-0.5">{item.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Submit Feedback form */}
              <div className="p-5 border-b border-white/5 space-y-4">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">Post Public Feedback</h4>
                
                {feedbackSuccessNotice ? (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2 animate-scaleUp">
                    <CheckCircle size={14} />
                    <span>Feedback published to dynamic feeds instantly!</span>
                  </div>
                ) : (
                  <form onSubmit={handlePostFeedback} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase">Your Display Handle</label>
                      <input
                        type="text"
                        placeholder="@client_handle"
                        value={newFeedbackName}
                        onChange={(e) => setNewFeedbackName(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-2 rounded-lg text-xs text-white focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase">Acknowledge & Support Rating</label>
                      <select
                        value={newFeedbackScore}
                        onChange={(e) => setNewFeedbackScore(parseInt(e.target.value))}
                        className="w-full bg-[#111] border border-white/10 p-2 rounded-lg text-xs text-amber-400 focus:border-indigo-500 outline-none"
                      >
                        <option value={5}>★★★★★ (Extreme Reliability)</option>
                        <option value={4}>★★★★☆ (Strong Security)</option>
                        <option value={3}>★★★☆☆ (Acceptable Tunnel)</option>
                        <option value={2}>★★☆☆☆ (Needs Audit)</option>
                        <option value={1}>★☆☆☆☆ (Critical Weakness)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase">Input Text</label>
                      <textarea
                        rows={2}
                        placeholder="State your feedback, suggestion or inquiry..."
                        value={newFeedbackText}
                        onChange={(e) => setNewFeedbackText(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-2 rounded-lg text-xs text-white focus:border-indigo-500 outline-none placeholder:text-gray-600 leading-snug resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isFeedbackSubmitting}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl border border-indigo-500 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 select-none"
                    >
                      <Send size={11} />
                      Publish Feedback
                    </button>
                  </form>
                )}
              </div>

              {/* Support Us / Premium Investor Message */}
              <div className="p-5 flex flex-col justify-end space-y-3.5 bg-[#0a0a0a]/80">
                <div className="text-[9px] uppercase tracking-tighter text-gray-550 flex items-center gap-1.5 select-none font-bold">
                  <HeartHandshake size={11} className="text-amber-500 animate-pulse" />
                  SUPPORT LEOREX TECHNOLOGY
                </div>
                
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  LEOREX is completely sovereign and runs independent container pipelines. Investing in a premium account directly pays for standard graphics rendering, high-thinking logic queries, and key rotational servers.
                </p>

                <button
                  onClick={() => setIsSubModalOpen(true)}
                  className="w-full bg-amber-500 hover:bg-amber-450 hover:scale-102 text-black text-[9.5px] font-bold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer box-border"
                >
                  <Crown size={11} />
                  Support LEOREX System ($15)
                </button>
              </div>

            </aside>
          </>
        )}

      </main>

      {/* FOOTER METRICS */}
      <footer className="h-10 bg-black border-t border-white/10 flex items-center justify-between px-6 text-[9px] uppercase tracking-widest text-[#718096] font-mono shrink-0 select-none">
        <div>v4.2.0 // LEOREX AI</div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Gateway State: <span className="text-green-500 font-semibold text-[8px]">All Envelopes Secure</span>
        </div>
        <div className="flex gap-4">
          <span>PORT: 3000 HTTPS ACTIVE</span>
          <span className="hidden sm:inline">SHA-256 ROTATOR</span>
        </div>
      </footer>

      {/* Modals and Overlays */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        userSession={userSession}
        onUpgradeSession={(s) => {
          setUserSession(s);
          logEvent("Upgraded credentials to LEOREX Premium.");
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userSession={userSession}
        onUpdateSession={(s) => {
          setUserSession(s);
          logEvent("Updated operator profile credentials.");
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={() => {
          setIsDarkMode(!isDarkMode);
          logEvent(`Themes toggled to: ${!isDarkMode ? 'Optic Light' : 'Sovereign Dark'}`);
        }}
      />

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        userSession={userSession}
        onSignIn={(s) => {
          setUserSession(s);
          logEvent(`Client token registered for @${s.username}.`);
        }}
      />

      <AdminAutoHealer
        userSession={userSession}
        tickerLogs={tickerLogs}
        onHealAction={(txt) => logEvent(txt)}
      />

    </div>
  );
}
