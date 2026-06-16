import React, { useState } from "react";
import { UserSession } from "../types";
import { Lock, User, ShieldCheck, Star, RefreshCw, Eye, EyeOff, AlertCircle, Sparkles, Mail } from "lucide-react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onSignIn: (newSession: UserSession) => void;
}

export default function SignInModal({ isOpen, onClose, userSession, onSignIn }: SignInModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("princepaulstrikas@gmail.com");
  const [password, setPassword] = useState("");
  const [wantsPremiumOnSignUp, setWantsPremiumOnSignUp] = useState(false);
  const [step, setStep] = useState<"signin" | "success">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSigningIn(true);
    setTimeout(() => {
      setIsSigningIn(false);
      
      const newSession: UserSession = {
        username: username.toLowerCase().replace(/\s+/g, "_"),
        email: email.trim(),
        isPremium: wantsPremiumOnSignUp || email.toLowerCase() === "princepaulstrikas@gmail.com",
        dailyFreeVideoCount: 0
      };

      onSignIn(newSession);
      setStep("success");
    }, 1500);
  };

  return (
    <div id="leo-signin-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl p-6 relative shadow-2xl overflow-hidden animate-scaleUp">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-indigo-600" />
        
        {step === "signin" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Header branding */}
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto text-white shadow-lg mb-2">
                <Lock size={18} />
              </div>
              <h3 className="text-lg font-serif italic text-white">LEO Client Authentication</h3>
              <p className="text-xs text-gray-500">Initialize a client session tunnel safely below.</p>
            </div>

            {/* Inputs */}
            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1">Client Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., prince_leo"
                    className="w-full bg-[#111111] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl h-10 pl-10 pr-4 text-xs text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1">Client Email (Admin Level)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., princepaulstrikas@gmail.com"
                    className="w-full bg-[#111111] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl h-10 pl-10 pr-4 text-xs text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1">Secured Password</label>
                <div className="relative font-mono">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#111111] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl h-10 pl-10 pr-10 text-xs text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Auth level */}
            <div className="border border-white/5 bg-[#0e0e0e] rounded-xl p-3 space-y-2">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Access Tier Assignment</span>
              
              <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wantsPremiumOnSignUp}
                  onChange={(e) => setWantsPremiumOnSignUp(e.target.checked)}
                  className="rounded bg-[#121212] border-white/10 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  Exalt Session to <span className="text-amber-400 font-bold font-mono">Premium Core VIP ($15/mo)</span> 👑
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium text-xs h-10 rounded-xl border border-white/10 cursor-pointer flex items-center justify-center transition-all select-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSigningIn}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all select-none gap-2"
              >
                {isSigningIn ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} /> Secure Sign-in
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {step === "success" && (
          <div className="text-center p-4 space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
              <ShieldCheck size={24} />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-md font-serif italic text-white font-medium">Session Authenticated!</h4>
              <p className="text-xs text-gray-400">
                You are currently logged in as <span className="text-indigo-400 font-bold font-mono">@{userSession.username}</span>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer transition-all mx-auto block"
            >
              Continue to Terminals
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
