import React, { useState, useEffect } from "react";
import OmniChat from "./components/OmniChat";
import OmniGen from "./components/OmniGen";
import OmniSpeaker from "./components/OmniSpeaker";
import OmniComposer from "./components/OmniComposer";
import OmniPlanner from "./components/OmniPlanner";
import LeoMessenger from "./components/LeoMessenger";
import OmniVideo from "./components/OmniVideo";
import SubscriptionModal from "./components/SubscriptionModal";
import SignInModal from "./components/SignInModal";
import AdminAutoHealer from "./components/AdminAutoHealer";
import { UserSession } from "./types";

// Icons
import { Compass, Sparkles, Volume2, Headphones, Layers, HelpCircle, Activity, Satellite, Shield, Crown, MessageSquare, LogIn, LogOut, Video } from "lucide-react";

type TabId = "orchestrator" | "synthetics" | "director" | "narration" | "messenger" | "acoustics" | "blueprints";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("orchestrator");
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  const [tickerLogs, setTickerLogs] = useState<Array<{ text: string; time: string }>>([
    { text: "LEO AI system online. Secure network tunnels configured.", time: "Just now" },
    { text: "Primary voice synthesizer and encryption cores active.", time: "1m ago" }
  ]);

  // Session state storage
  const [userSession, setUserSession] = useState<UserSession>({
    username: "LEO_GUEST",
    isPremium: false,
    dailyFreeVideoCount: 0
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Check backend health & alert if API key is missing
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (!data.hasApiKey) {
          setApiKeyError(true);
        }
      })
      .catch(() => {
        // Fallback or silent catch
      });
  }, []);

  // Post new ticker logs dynamically when users interact
  const logEvent = (actionText: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTickerLogs(prev => [
      { text: actionText, time: timeNow },
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div id="app-root-container" className="bg-[#050505] text-gray-200 w-full min-h-screen flex flex-col font-sans overflow-hidden select-none border-t-4 border-amber-500">
      
      {/* HEADER SECTION */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
        
        {/* Logo Vibe */}
        <div className="flex items-center gap-3">
          {/* Stunning glowing gold lion shield logo */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.45)] transition-all transform hover:scale-105 select-none shrink-0">
            {/* Elegant Crown / Lion hybrid crest icon template */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0-13L8 9m4-6l4 6M8 9H4v7a3 3 0 003 3h10a3 3 0 003-3V9h-4M8 19s1.5-3 4-3 4 3 4 3" />
            </svg>
          </div>
          <span className="text-md sm:text-lg font-serif italic tracking-[0.14em] font-medium text-white uppercase select-none">
            LEO AI
          </span>
          <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 rounded border border-amber-500/15">
            LION-CORE
          </span>
        </div>

        {/* Dynamic Navigation Tabs */}
        <nav className="hidden md:flex gap-5 text-[10px] uppercase tracking-[0.18em] font-medium text-gray-400 select-none">
          <button
            onClick={() => setActiveTab("orchestrator")}
            className={`cursor-pointer transition-all pb-1 ${
              activeTab === "orchestrator" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
            }`}
          >
            Orchestrator
          </button>
          <button
            onClick={() => setActiveTab("synthetics")}
            className={`cursor-pointer transition-all pb-1 ${
              activeTab === "synthetics" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
            }`}
          >
            Synthetics
          </button>
          <button
            onClick={() => setActiveTab("director")}
            className={`cursor-pointer transition-all pb-1 ${
              activeTab === "director" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
            }`}
          >
            Director
          </button>
          <button
            onClick={() => setActiveTab("narration")}
            className={`cursor-pointer transition-all pb-1 ${
              activeTab === "narration" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
            }`}
          >
            Narration
          </button>
          <button
            onClick={() => setActiveTab("messenger")}
            className={`cursor-pointer transition-all pb-1 ${
              activeTab === "messenger" ? "text-amber-400 border-b-2 border-amber-500 font-bold" : "hover:text-white"
            }`}
          >
            Encrypted Messenger 🔐
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
            Blueprints
          </button>
        </nav>

        {/* User / Workspace Vitals */}
        <div className="flex items-center gap-4">
          
          {/* Subscriptions upgrade shortcut */}
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

          {/* Interactive User profile badge */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-[9px] text-gray-550 uppercase tracking-tighter select-none font-mono">AUTHORIZED CLIENT</div>
              <div className="text-xs text-indigo-300 font-medium select-none flex items-center gap-1.5">
                @{userSession.username}
              </div>
            </div>
            
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="w-9 h-9 rounded-full border border-white/25 bg-gradient-to-br from-indigo-900 to-black hover:hover:border-indigo-400 flex items-center justify-center font-mono font-bold text-xs select-none cursor-pointer transition-all"
              title="Configure auth options / Log in as another user"
            >
              {userSession.username.substring(0, 2).toUpperCase()}
            </button>
          </div>
          
        </div>

      </header>

      {/* CORE WORKSPACE SUB-ROUTINES COLUMN */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR LEFT */}
        <aside className="w-64 border-r border-white/5 bg-[#080808] p-5 flex flex-col gap-8 shrink-0 hidden lg:flex">
          
          {/* Workspaces list */}
          <section className="space-y-4">
            <h3 className="text-[9px] uppercase tracking-widest text-gray-550 pl-1 select-none font-bold">
              Active Dimensions
            </h3>
            <ul className="space-y-2">
              <li
                onClick={() => setActiveTab("orchestrator")}
                className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  activeTab === "orchestrator"
                    ? "text-gray-200 bg-white/5 border-white/10"
                    : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeTab === "orchestrator" ? "bg-amber-400 font-bold" : "bg-gray-600"}`} />
                Conversational Agent
              </li>
              <li
                onClick={() => setActiveTab("synthetics")}
                className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  activeTab === "synthetics"
                    ? "text-gray-200 bg-white/5 border-white/10"
                    : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeTab === "synthetics" ? "bg-amber-400 font-bold" : "bg-gray-600"}`} />
                Studio Artist Config
              </li>
              <li
                onClick={() => setActiveTab("director")}
                className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  activeTab === "director"
                    ? "text-gray-200 bg-white/5 border-white/10"
                    : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeTab === "director" ? "bg-amber-400 font-bold" : "bg-gray-600"}`} />
                Veo Video Director
              </li>
              <li
                onClick={() => setActiveTab("narration")}
                className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  activeTab === "narration"
                    ? "text-gray-200 bg-white/5 border-white/10"
                    : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeTab === "narration" ? "bg-amber-400 font-bold" : "bg-gray-600"}`} />
                Acoustic Narrations
              </li>
              <li
                onClick={() => setActiveTab("messenger")}
                className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  activeTab === "messenger"
                    ? "text-gray-200 bg-white/5 border-white/10"
                    : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeTab === "messenger" ? "bg-amber-400 font-bold" : "bg-gray-600"}`} />
                Encrypted Messenger 🔐
              </li>
              <li
                onClick={() => setActiveTab("acoustics")}
                className={`flex items-center gap-3 text-xs p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  activeTab === "acoustics"
                    ? "text-gray-200 bg-white/5 border-white/10"
                    : "text-gray-450 hover:text-white hover:bg-white/2 border-transparent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeTab === "acoustics" ? "bg-amber-400 font-bold" : "bg-gray-600"}`} />
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
                <span className={`w-2 h-2 rounded-full ${activeTab === "blueprints" ? "bg-amber-400 font-bold" : "bg-gray-600"}`} />
                Phased Blueprint Scheduler
              </li>
            </ul>
          </section>

          {/* Quick-toggle selector for mobile / tablets standard */}
          <section className="mt-auto">
            <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl">
              <p className="text-[10.5px] leading-relaxed text-indigo-200/80 italic mb-3 select-none">
                &ldquo;The cosmos is a sequence of solvable code blocks.&rdquo;
              </p>
              <div className="flex justify-between items-end">
                <span className="text-[9px] uppercase text-indigo-400 font-bold select-none font-mono tracking-wider">System Load</span>
                <span className="text-xs font-mono text-white select-none">14.2%</span>
              </div>
              <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                <div className="w-[14.2%] h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              </div>
            </div>
          </section>

        </aside>

        {/* CONTAINER CONTENT */}
        <section className="flex-1 flex flex-col relative overflow-y-auto">
          
          {/* Abstract ambient glowing background blob */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.06),transparent_70%)] pointer-events-none" />

          {/* API Key warning placard */}
          {apiKeyError && (
            <div className="m-6 p-4 bg-orange-950/40 border border-orange-500/30 rounded-xl relative z-10 text-xs text-orange-200 flex items-center justify-between">
              <div>
                <p className="font-bold">🔑 GEMINI_API_KEY NOT DETECTED</p>
                <p className="mt-0.5 opacity-80">
                  Please add your key in the top right Settings &gt; Secrets panel to unlock full machine output.
                </p>
              </div>
            </div>
          )}

          {/* Tab Selection Area for smaller screens */}
          <div className="md:hidden flex overflow-x-auto gap-2 p-4 border-b border-white/5 bg-[#0a0a0a]/50 select-none scrollbar-none relative z-10">
            {([
              { id: "orchestrator", label: "Guide", icon: Compass },
              { id: "synthetics", label: "Studio", icon: Sparkles },
              { id: "director", label: "Director", icon: Video },
              { id: "narration", label: "Speaker", icon: Volume2 },
              { id: "messenger", label: "Messenger", icon: MessageSquare },
              { id: "acoustics", label: "Synthesizer", icon: Headphones },
              { id: "blueprints", label: "Planner", icon: Layers }
            ] as const).map((tab) => {
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

          {/* Main workspace frame rendered coordinate */}
          <div className="flex-1 p-6 sm:p-8 relative z-10">
            <h1 className="text-3xl sm:text-4xl font-serif italic text-white mb-1.5 leading-tight select-none">
              {activeTab === "orchestrator" && "Conversational Companion"}
              {activeTab === "synthetics" && "Photovoltaic Synthesis"}
              {activeTab === "director" && "Cinematic Director"}
              {activeTab === "narration" && "Acoustic Narration Panel"}
              {activeTab === "messenger" && "Enigma Secured E2EE Handshake"}
              {activeTab === "acoustics" && "Harmonic Arranger V2"}
              {activeTab === "blueprints" && "Strategic Blueprint Orchestrator"}
            </h1>
            <p className="text-xs text-slate-400 mb-6 max-w-2xl select-none leading-relaxed">
              {activeTab === "orchestrator" && "Converse dynamically with general adapters, engineering mentors, mathematical codex tutors, and linguistic specialists."}
              {activeTab === "synthetics" && "Synthesize custom concept illustrations safely using professional prompts rendered straight via our media servers."}
              {activeTab === "director" && "Direct short films or animate starting images with powerful Veo 3 engine capabilities."}
              {activeTab === "narration" && "Configure high-integrity narration voices 'Zephyr', 'Kore', and more to read deep scripts out loud."}
              {activeTab === "messenger" && "Exchange symmetric AES-256 encrypted messages safely utilizing ephemeral private keys."}
              {activeTab === "acoustics" && "Program generative synthesizer loops, custom lofi chords, and lyric sheets generated symmetrically from sound cues."}
              {activeTab === "blueprints" && "Map and organize sophisticated step-by-step phased executable roadmaps using expert scheduling patterns."}
            </p>

            <div className="transition-all duration-300">
              {activeTab === "orchestrator" && (
                <div onFocus={() => logEvent("Orchestrated active chat prompt.")}>
                  <OmniChat />
                </div>
              )}
              {activeTab === "synthetics" && (
                <div onFocus={() => logEvent("Rendered image asset payload.")}>
                  <OmniGen />
                </div>
              )}
              {activeTab === "director" && (
                <div onFocus={() => logEvent("Directed cinematic footage generation.")}>
                  <OmniVideo />
                </div>
              )}
              {activeTab === "narration" && (
                <div onFocus={() => logEvent("Synthesized spoken narration audio.")}>
                  <OmniSpeaker />
                </div>
              )}
              {activeTab === "messenger" && (
                <div onFocus={() => logEvent("Opened secure messenger handshake portal.")}>
                  <LeoMessenger />
                </div>
              )}
              {activeTab === "acoustics" && (
                <div onFocus={() => logEvent("Arranged generative track composition.")}>
                  <OmniComposer />
                </div>
              )}
              {activeTab === "blueprints" && (
                <div onFocus={() => logEvent("Structured comprehensive tactical blueprint.")}>
                  <OmniPlanner />
                </div>
              )}
            </div>
          </div>

        </section>

        {/* SIDEBAR RIGHT - Feed logs of events */}
        <aside className="w-72 border-l border-white/5 bg-[#080808] flex flex-col shrink-0 hidden xl:flex justify-between">
          
          <div className="p-5 border-b border-white/5 space-y-4">
            <h3 className="text-[9px] uppercase tracking-widest text-gray-550 select-none font-bold">
              Global Feedback Feed
            </h3>
            <div className="space-y-4">
              {tickerLogs.map((log, index) => (
                <div key={index} className={`relative pl-3.5 border-l ${index === 0 ? "border-amber-500" : "border-white/10"}`}>
                  <p className={`text-xs leading-snug ${index === 0 ? "text-gray-200" : "text-gray-500"}`}>
                    {log.text}
                  </p>
                  <span className="text-[9px] text-gray-650 font-mono mt-1 block select-none">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 flex flex-col justify-end space-y-3 bg-[#0a0a0a]/40">
            <div className="text-[9px] uppercase tracking-tighter text-gray-550 flex items-center gap-1.5 select-none font-semibold">
              <Satellite size={11} className="text-amber-500" />
              SATELLITE DOWNLINK STATUS
            </div>
            {/* Pulsing visual graph indicator */}
            <div className="flex gap-1 h-10 items-end">
              <div className="flex-1 bg-amber-500/10 h-[40%] rounded-t-sm" />
              <div className="flex-1 bg-amber-500/20 h-[60%] rounded-t-sm" />
              <div className="flex-1 bg-amber-500/30 h-[80%] rounded-t-sm" />
              <div className="flex-1 bg-amber-500 h-[100%] rounded-t-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] anim-pulse" />
              <div className="flex-1 bg-amber-500/40 h-[70%] rounded-t-sm" />
              <div className="flex-1 bg-amber-500/20 h-[50%] rounded-t-sm" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-gray-600 select-none">
              <span>LAT: 34.0522 N</span>
              <span>LNG: 118.2437 W</span>
            </div>
          </div>

        </aside>

      </main>

      {/* FOOTER METRICS */}
      <footer className="h-10 bg-black border-t border-white/10 flex items-center justify-between px-6 text-[9px] uppercase tracking-widest text-gray-500 font-mono shrink-0 select-none">
        <div>v4.0.1 // LEO-KORE</div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Status: <span className="text-green-500 font-semibold text-[8px]">All Channels Secure</span>
        </div>
        <div className="flex gap-4">
          <span>SEC: Exalted Mode</span>
          <span>Latency: 14ms</span>
        </div>
      </footer>

      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        userSession={userSession}
        onUpgradeSession={(s) => {
          setUserSession(s);
          logEvent("Upgraded credentials to LEO Premium.");
        }}
      />

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        userSession={userSession}
        onSignIn={(s) => {
          setUserSession(s);
          logEvent(`Session authenticated as @${s.username}.`);
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
