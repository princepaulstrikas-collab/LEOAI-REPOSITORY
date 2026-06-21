import React, { useState } from "react";
import { UserSession } from "../types";
import { Lock, User, ShieldCheck, Star, RefreshCw, Eye, EyeOff, AlertCircle, Sparkles, Mail, LogIn, UserPlus } from "lucide-react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "../lib/firebase";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onSignIn: (newSession: UserSession) => void;
}

export default function SignInModal({ isOpen, onClose, userSession, onSignIn }: SignInModalProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wantsPremiumOnSignUp, setWantsPremiumOnSignUp] = useState(false);
  const [step, setStep] = useState<"auth" | "success">("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (authMode === "signup") {
      if (!username.trim()) {
        setError("Username is required for sign up.");
        return;
      }
      
      // Extra Security Password Checks
      if (password.length < 8) {
        setError("Password must be at least 8 characters for strict security.");
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError("Password must contain at least one uppercase letter.");
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError("Password must contain at least one lowercase letter.");
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError("Password must contain at least one number.");
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setError("Password must contain at least one special character.");
        return;
      }
    }

    if (!email.trim() || !password.trim()) {
      setError("Email and Password are required.");
      return;
    }

    setIsProcessing(true);
    
    try {
      let user;
      if (authMode === "signup") {
        user = await signUpWithEmail(email, password, username);
      } else {
        user = await signInWithEmail(email, password);
      }
      
      const sessionUsername = authMode === "signup" 
        ? username.toLowerCase().replace(/\s+/g, "_") 
        : (user.displayName || user.email?.split("@")[0] || "client_user");

      const newSession: UserSession = {
        username: sessionUsername,
        email: user.email || "",
        isPremium: wantsPremiumOnSignUp || user.email?.toLowerCase() === "princepaulstrikas@gmail.com",
        dailyFreeVideoCount: 0
      };

      if (wantsPremiumOnSignUp) {
        localStorage.setItem("leorex_wants_premium", "true");
      }

      onSignIn(newSession);
      setStep("success");
    } catch (err: any) {
      console.error(err);
      let errMsg = "Authentication failed.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already registered. Please sign in instead.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "Invalid email or correct password. Please verify your entries.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password is too weak. Please ensure it passes the security check.";
      } else if (err.code === "auth/operation-not-allowed") {
        errMsg = "Email/Password sign-in has not been enabled for your project inside the Firebase Console. Go to Authentication > Sign-in method to activate it.";
      } else if (err.message) {
        errMsg = `Auth Error (${err.code || "unknown"}): ${err.message}`;
      }
      setError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      const user = await signInWithGoogle();
      
      const newSession: UserSession = {
        username: user.displayName?.toLowerCase().replace(/\s+/g, "_") || "google_user",
        email: user.email || "",
        isPremium: wantsPremiumOnSignUp || user.email?.toLowerCase() === "princepaulstrikas@gmail.com",
        dailyFreeVideoCount: 0
      };

      if (wantsPremiumOnSignUp) {
        localStorage.setItem("leorex_wants_premium", "true");
      }

      onSignIn(newSession);
      setStep("success");
    } catch (err: any) {
      console.error(err);
      let errMsg = "Google Sign-In failed or was cancelled.";
      if (err.code === "auth/popup-blocked") {
        errMsg = "Google pop-up was blocked by your browser. Please allow popups or use the Standalone App view.";
      } else if (err.code === "auth/operation-not-allowed") {
        errMsg = "Google sign-in has not been enabled in your Firebase Console. Under 'Authentication' -> 'Sign-in method', please activate the Google provider.";
      } else if (err.message) {
        errMsg = `Google Sign-In Error (${err.code || "unknown"}): ${err.message}`;
      }
      setError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="leo-signin-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl p-6 relative shadow-2xl overflow-hidden animate-scaleUp">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-indigo-600" />
        
        {step === "auth" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Header branding */}
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg mb-2 shadow-indigo-500/10">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-lg font-serif italic text-white">LEOREX AI Security Gateway</h3>
              <p className="text-xs text-gray-500">Initialize a client session tunnel on the LEOREX network.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-2 rounded flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Auth Mode Toggle */}
            <div className="flex bg-[#111] border border-white/10 rounded-xl p-1 relative">
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 z-10 ${authMode === "signin" ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("signup"); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 z-10 ${authMode === "signup" ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Create Account
              </button>
              {/* Animated Background Indicator */}
              <div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg transition-transform duration-300 ease-in-out"
                style={{ transform: authMode === "signin" ? 'translateX(0)' : 'translateX(100%)' }}
              />
            </div>

            {/* Google Sign In Button */}
            <div className="pt-2 space-y-2">
               <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isProcessing}
                className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 font-medium text-sm h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all select-none gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10H12V14.26H17.92C17.65 15.65 16.89 16.85 15.72 17.61V20.34H19.29C21.37 18.42 22.56 15.58 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.47 22.02 19.3 20.35L15.73 17.62C14.74 18.29 13.48 18.69 12 18.69C9.13 18.69 6.7 16.76 5.81 14.16H2.15V17C4.04 20.65 7.74 23 12 23Z" fill="#34A853"/>
                  <path d="M5.8 14.15C5.57 13.48 5.44 12.76 5.44 12C5.44 11.24 5.57 10.52 5.8 9.85V7.00003H2.14C1.36 8.54003 0.92 10.22 0.92 12C0.92 13.78 1.36 15.46 2.14 17L5.8 14.15Z" fill="#FBBC05"/>
                  <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.39 3.84C17.46 2.05 14.95 1 12 1C7.74 1 4.04 3.35 2.14 7.00003L5.8 9.85C6.7 7.24 9.13 5.38 12 5.38Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-[11px] leading-relaxed text-[#fcd34d] font-sans space-y-1.5 animate-fadeIn">
                <p className="font-bold flex items-center gap-1.5 text-[#fbbf24] font-mono uppercase text-[9px] tracking-wider">
                  ⚠️ Google Auth Blocked inside Iframe?
                </p>
                <p className="text-gray-400">
                  Many browsers block external authentication popups inside embedded preview windows due to nested cross-origin restrictions.
                </p>
                <ul className="list-disc pl-4 text-gray-400 space-y-1">
                  <li>
                    Click <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5">Open Standalone App ↗</a> to run it in a cleaner, standalone window where Google auth popup succeeds instantly!
                  </li>
                  <li>
                    Or, click on <strong>Create Account</strong> below to register instantly with any email and secure password (unconstrained by popups).
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">or email</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 font-sans">
              
              {authMode === "signup" && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1">Choose Username</label>
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
              )}

              <div className="space-y-1 animate-fadeIn">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., mail@example.com"
                    className="w-full bg-[#111111] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl h-10 pl-10 pr-4 text-xs text-gray-200 font-mono transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1 animate-fadeIn">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest pl-1">Secure Password</label>
                <div className="relative font-mono">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#111111] border border-white/10 hover:border-white/20 focus:outline-none focus:border-indigo-500/50 rounded-xl h-10 pl-10 pr-10 text-xs text-gray-200 transition-colors"
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
                disabled={isProcessing}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all select-none gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> {authMode === "signin" ? "Authenticating..." : "Registering..."}
                  </>
                ) : (
                  <>
                    {authMode === "signin" ? <LogIn size={13} /> : <UserPlus size={13} />}
                    {authMode === "signin" ? "Secure Sign In" : "Create Account"}
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
