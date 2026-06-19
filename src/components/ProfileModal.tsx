import React, { useState, useEffect } from "react";
import { User, Shield, Check, Lock, Palette, Mail, Users, Crown, RefreshCw, X, CreditCard, ChevronRight, CheckCircle2 } from "lucide-react";
import { UserSession } from "../types";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onUpdateSession: (newSession: UserSession) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const AVATARS = [
  { char: "🧠", name: "AI Operator", style: "border-indigo-500/30 text-indigo-400" },
  { char: "🥋", name: "Sovereign Admin", style: "border-amber-500/30 text-amber-400" },
  { char: "👑", name: "Premium Funder", style: "border-yellow-500/30 text-yellow-300" },
  { char: "🦾", name: "Systems Engineer", style: "border-purple-500/30 text-purple-400" },
  { char: "🌌", name: "Cosmic Architect", style: "border-emerald-500/30 text-emerald-400" },
  { char: "⚡", name: "Naira Investor", style: "border-pink-500/30 text-pink-400" }
];

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  userSession, 
  onUpdateSession,
  isDarkMode,
  onToggleTheme
}: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(userSession.username || "");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [userCountry, setUserCountry] = useState("Nigeria");
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    setDisplayName(userSession.username || "");
    const savedAvatar = localStorage.getItem(`leorex_avatar_${userSession.email || 'guest'}`);
    if (savedAvatar) {
      const idx = AVATARS.findIndex(av => av.char === savedAvatar);
      if (idx !== -1) setAvatarIndex(idx);
    }
  }, [userSession]);

  // Fetch submitted bank payments to link automatically for the current user
  useEffect(() => {
    if (!isOpen || !userSession.email) return;

    async function fetchUserPayments() {
      setLoadingPayments(true);
      try {
        const q = query(
          collection(db, "leorex_payments"),
          where("userEmail", "==", userSession.email)
        );
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        setPayments(list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch (err) {
        console.warn("Could not retrieve payment links:", err);
      } finally {
        setLoadingPayments(false);
      }
    }

    fetchUserPayments();
  }, [isOpen, userSession.email]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaveStatus("saving");
    try {
      // Opt-in sync to Firestore if not guest
      if (userSession.email) {
        await setDoc(doc(db, "leorex_users_config", userSession.email), {
          displayName: displayName.trim(),
          avatar: AVATARS[avatarIndex].char,
          country: userCountry,
          updatedAt: new Date()
        }, { merge: true });
      }

      localStorage.setItem(`leorex_avatar_${userSession.email || 'guest'}`, AVATARS[avatarIndex].char);
      
      onUpdateSession({
        ...userSession,
        username: displayName.trim()
      });

      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (e) {
      console.warn("Local storage fallback", e);
      setSaveStatus("error");
    }
  };

  return (
    <div id="leorex-profile-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      
      {/* Outer Card */}
      <div className={`w-full max-w-xl rounded-2xl relative shadow-2xl border transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#0c0c0e] border-white/10 text-gray-200" 
          : "bg-white border-slate-300 text-slate-800"
      }`}>
        
        {/* Dynamic header colored ribbon pattern */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-pink-500 rounded-t-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-all cursor-pointer ${
            isDarkMode ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <X size={15} />
        </button>

        <div className="p-6 sm:p-7 space-y-6">
          
          {/* Header Title Information */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-dashed border-gray-500/10">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
              isDarkMode ? "bg-indigo-950/20 border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
            }`}>
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-serif italic font-medium leading-none">
                Profile & Core Identity Console
              </h3>
              <p className="text-[10.5px] text-gray-400 mt-1">
                Customize your workspace credentials, change interface themes, and track subscription audit files.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Side: Avatar selector & settings info */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1">
                  <span>Display Username</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full text-xs font-medium h-9.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500/60 border ${
                    isDarkMode 
                      ? "bg-[#141416] border-white/10 text-white" 
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                  placeholder="Insert operator tag..."
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-gray-400">
                  Select Hub Avatar Block
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAvatarIndex(idx)}
                      className={`h-10 text-lg rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        avatarIndex === idx 
                          ? "bg-indigo-500/10 border-indigo-500 scale-105 shadow-md shadow-indigo-500/10" 
                          : isDarkMode ? "bg-black/40 border-white/5 hover:border-white/10" : "bg-slate-100 border-slate-200 hover:border-slate-300"
                      }`}
                      title={av.name}
                    >
                      {av.char}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-gray-500 font-mono italic">
                  Currently active: <span className="text-amber-400 font-bold">{AVATARS[avatarIndex].name}</span>
                </p>
              </div>

              {/* Theme Settings controller */}
              <div className="space-y-2 pt-2">
                <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-[#94a3b8] flex items-center gap-1">
                  <Palette size={11} className="text-amber-400" />
                  Appearance Settings
                </label>
                
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-gray-500/10">
                  <span className="text-xs font-medium">Toggle Dark / Light Theme</span>
                  <button
                    onClick={onToggleTheme}
                    className={`text-[9.5px] font-mono px-3 py-1.5 rounded-lg font-bold uppercase cursor-pointer select-none transition-all flex items-center gap-1.5 ${
                      isDarkMode 
                        ? "bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-950/60" 
                        : "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
                    }`}
                  >
                    {isDarkMode ? "🌌 Cyber Dark Mode" : "☀️ Aesthetic Light Mode"}
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                >
                  {saveStatus === "saving" ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Saving config...
                    </>
                  ) : saveStatus === "success" ? (
                    <>
                      <Check size={12} className="text-green-300" />
                      Operator Config Saved Successfully!
                    </>
                  ) : (
                    "Save Identity Parameters"
                  )}
                </button>
              </div>

            </div>

            {/* Right Side: Billing metadata or Nigeria support linking */}
            <div className={`p-4 rounded-xl space-y-4 border ${
              isDarkMode ? "bg-black/25 border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              
              <div className="space-y-1">
                <h4 className="text-[10.5px] font-mono uppercase tracking-widest text-[#718096] font-bold">Nigeria Transfer Link</h4>
                <p className="text-[10px] text-gray-500 leading-snug">
                  All subscriptions and Naira credentials processed securely via EZE CHIOMA OPAY terminal:
                </p>
              </div>

              {/* Billing outline component */}
              <div className={`p-3 rounded-lg space-y-2 border text-[11px] font-mono ${
                isDarkMode ? "bg-black/60 border-white/5" : "bg-white border-zinc-200"
              }`}>
                <div className="flex justify-between">
                  <span className="text-gray-500">Holder Bank:</span>
                  <span className="font-bold text-amber-500">OPAY Bank (NGN)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account No:</span>
                  <span className="font-bold text-white select-all bg-indigo-950/20 px-1 py-0.2 rounded font-mono border border-indigo-500/10">8165638800</span>
                </div>
                <div className="flex justify-between text-right">
                  <span className="text-gray-500">Account Name:</span>
                  <span className="font-bold text-gray-300 text-[10px] uppercase">EZE CHIOMA CHRISTIANA</span>
                </div>
              </div>

              {/* Dynamic pending payment tracking */}
              <div className="space-y-2">
                <h5 className="text-[9.5px] font-bold uppercase tracking-widest text-[#94a3b8] flex items-center justify-between">
                  <span>Linked Payment Slips</span>
                  {payments.length > 0 && <span className="text-[8px] bg-[#fbbf24]/10 text-amber-400 font-mono px-1.5 rounded">{payments.length}</span>}
                </h5>

                {loadingPayments ? (
                  <div className="text-center py-4 text-[10px] text-gray-500 italic flex items-center justify-center gap-1.5">
                    <RefreshCw size={10} className="animate-spin" /> Querying Nigerian ledgers...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center p-3.5 rounded-lg border border-dashed border-gray-500/10 text-[10.5px] text-gray-500 italic font-sans leading-relaxed">
                    No active bank receipts linked yet. Upgrade to premium to verify.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {payments.map((pay) => (
                      <div key={pay.id} className="bg-black/30 border border-white/5 p-2 rounded text-[10px] font-mono flex items-center justify-between">
                        <div>
                          <span className="text-gray-400 font-bold block">₦{Number(pay.amountNaira || 15000).toLocaleString()}</span>
                          <span className="text-gray-600 block text-[8px]">{pay.senderName || "Unknown Senders"}</span>
                        </div>
                        <div className="text-right">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] uppercase tracking-wide inline-block ${
                            pay.status === "approved" 
                              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {pay.status || "pending"}
                          </span>
                          <span className="text-gray-600 text-[8px] block mt-0.5">{pay.paymentDate || "Just now"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Connected state */}
          <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-xl flex items-center justify-between font-mono text-[9.5px]">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={13} />
              <span>Cryptographic Session: @{userSession.username} is connected</span>
            </div>
            <div className="text-gray-500 uppercase">
              {userSession.isPremium ? "Premium Core active" : "Free Plan tier"}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
