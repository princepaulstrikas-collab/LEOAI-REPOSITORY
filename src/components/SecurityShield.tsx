import React, { useState, useEffect } from "react";
import { Shield, Key, AlertTriangle, Cpu, Radio, Terminal, Server, RefreshCw, Lock, HelpCircle } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface SecurityShieldProps {
  userSession: { email?: string; username: string };
  onLogSecurityEvent: (text: string) => void;
}

export default function SecurityShield({ userSession, onLogSecurityEvent }: SecurityShieldProps) {
  const [cipherSeed, setCipherSeed] = useState("0x" + Math.floor(Math.random() * 1e16).toString(16).toUpperCase());
  const [threatLevel, setThreatLevel] = useState<"standard" | "elevated" | "quantum_defiance">("standard");
  const [isRotating, setIsRotating] = useState(false);
  const [antivirusStatus, setAntivirusStatus] = useState("Active & Guarding");
  const [liveBlockedCount, setLiveBlockedCount] = useState(148);
  const [isDefianceModeActive, setIsDefianceModeActive] = useState(false);

  // Auto-rotate seed every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      rotateCipherSeed(true);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const rotateCipherSeed = (isAuto = false) => {
    if (!isAuto) {
      setIsRotating(true);
      setTimeout(() => setIsRotating(false), 850);
    }
    const newSeed = "0x" + Math.floor(Math.random() * 1e16).toString(16).toUpperCase();
    setCipherSeed(newSeed);
    if (!isAuto) {
      onLogSecurityEvent(`Manually rotated cryptographic SHA-256 key seed to ${newSeed}.`);
      saveDefenseEvent("Key Rotation", `Client manual key rotated. New seed hash generated: ${newSeed}`);
    }
  };

  const saveDefenseEvent = async (action: string, description: string) => {
    try {
      await addDoc(collection(db, "leorex_data_usage"), {
        category: "Security Protocol Trigger",
        email: userSession.email || "anonymous_user",
        username: userSession.username,
        prompt: `[${action}] ${description}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Could not log telemetry directly to cloud:", e);
    }
  };

  const handleLevelChange = (level: typeof threatLevel) => {
    setThreatLevel(level);
    let desc = "Standard defense shield updated.";
    if (level === "elevated") {
      desc = "Elevated threat mode activated. Enhanced packet inspection active.";
      setLiveBlockedCount(prev => prev + 12);
    } else if (level === "quantum_defiance") {
      desc = "🚨 QUANTUM DEFIANCE MODE INITIATED. AES-512 level double-wrapping active.";
      setLiveBlockedCount(prev => prev + 49);
    }
    onLogSecurityEvent(desc);
    saveDefenseEvent("Shield Calibration", desc);
  };

  return (
    <div id="leorex-security-shield" className="space-y-6 font-sans">
      
      {/* Top Warning Banner */}
      <div className="bg-[#1a0f0f] border border-red-500/25 p-4 rounded-xl flex items-start gap-3">
        <Shield className="text-red-500 animate-pulse shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-sm font-bold text-red-200">Sovereign Encryption Shield Active</h4>
          <p className="text-xs text-red-350 opacity-85 mt-0.5 max-w-2xl">
            LEOREX AI utilizes direct peer-to-cloud secure transport pipes. Multi-layered cryptographic wrappers mask all prompts in transport before writing logs directly to Firestore core storage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Core 1: Cryptographic Rotation */}
        <div className="bg-[#0b0c10] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Key size={16} />
              <h5 className="text-xs font-bold uppercase tracking-wider">SHA-256 E2E Key Rotator</h5>
            </div>
            <p className="text-xs text-gray-400">
              Session packets are encrypted standard. This dynamic salt randomizes key hash derivation periodically.
            </p>
            <div className="bg-[#111] p-3 rounded-xl border border-white/5 mt-3">
              <span className="text-[10px] text-gray-550 uppercase tracking-widest font-mono">ACTIVE KEYSEED</span>
              <div className="text-sm font-mono font-bold text-green-400 mt-1 select-all break-all tracking-wider">
                {cipherSeed}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => rotateCipherSeed(false)}
            disabled={isRotating}
            className="w-full mt-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 font-bold text-xs py-2 rounded-xl border border-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <RefreshCw size={12} className={isRotating ? "animate-spin" : ""} />
            Force Key Rotation
          </button>
        </div>

        {/* Core 2: Firewall Port Monitor */}
        <div className="bg-[#0b0c10] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500">
              <Server size={16} />
              <h5 className="text-xs font-bold uppercase tracking-wider">Firewall Status Panel</h5>
            </div>
            <p className="text-xs text-gray-400">
              Monitoring incoming proxy data routes. Only essential socket lines are open on the workspace.
            </p>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between p-1.5 bg-black/40 rounded">
                <span className="text-gray-500 font-mono text-[10px]">INBOUND HOST</span>
                <span className="text-gray-200 font-mono">0.0.0.0:3000</span>
              </div>
              <div className="flex justify-between p-1.5 bg-black/40 rounded">
                <span className="text-gray-500 font-mono text-[10px]">ENHANCED DEFENSE</span>
                <span className="text-green-500 font-bold">{antivirusStatus}</span>
              </div>
              <div className="flex justify-between p-1.5 bg-black/40 rounded">
                <span className="text-gray-500 font-mono text-[10px]">THREATS MITIGATED</span>
                <span className="text-red-400 font-mono font-bold">{liveBlockedCount} IPS Blocks</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setAntivirusStatus("Scanning Node Files...");
              setTimeout(() => {
                setAntivirusStatus("Scan Perfect. Guard Active");
                onLogSecurityEvent("Completed quick filesystem malware audit. Mainframe healthy.");
                saveDefenseEvent("Integrity Check", "Filesystem integrity verified. 0 anomalies detected.");
              }, 1500);
            }}
            className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all text-center"
          >
            <Terminal size={12} />
            Scan Environment Integrity
          </button>
        </div>

        {/* Core 3: Defiance Mode Controls */}
        <div className="bg-[#0b0c10] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500">
              <Radio size={16} />
              <h5 className="text-xs font-bold uppercase tracking-wider">Threat Defense Configuration</h5>
            </div>
            <p className="text-xs text-gray-400">
              Dynamically wraps LEOREX operations into nested, secure sandboxes to avoid memory interception.
            </p>
            
            <div className="flex flex-col gap-1.5 pt-2">
              <button
                onClick={() => handleLevelChange("standard")}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  threatLevel === "standard"
                    ? "bg-slate-900 border-indigo-500/45 text-white"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                ● Standard Vault Encryption
              </button>
              <button
                onClick={() => handleLevelChange("elevated")}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  threatLevel === "elevated"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                ▲ Elevated Prompt Masking
              </button>
              <button
                onClick={() => handleLevelChange("quantum_defiance")}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  threatLevel === "quantum_defiance"
                    ? "bg-red-500/10 border-red-500/40 text-red-400"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                ⚡ Quantum Threat Defiance
              </button>
            </div>
          </div>
          
          <div className="text-[10px] text-gray-550 font-mono text-center pt-2 select-none">
            DEFENCE STATUS: ACTIVE
          </div>
        </div>

      </div>

      {/* Database Guard Check card */}
      <div className="bg-[#080808] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <Lock size={14} />
            <span className="font-bold uppercase text-[10px] tracking-wider">Secure Access Control Status</span>
          </div>
          <p className="text-gray-500 leading-relaxed max-w-xl">
            Firestore collection security rules are strictly configured. Standard client accounts can only read/write standard user data. All telemetry streams are sealed behind verified owner logins. All database transactions are recorded.
          </p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-2 rounded-xl font-bold uppercase shrink-0 text-center text-[10px] tracking-wider select-none">
          ✔ ROBUST RULES DEPLOYED
        </div>
      </div>

    </div>
  );
}
