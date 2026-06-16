import React, { useState } from "react";
import { UserSession } from "../types";
import { Crown, Check, CheckCircle2, ShieldAlert, CreditCard, Sparkles, X, Gift, Users, RefreshCw } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onUpgradeSession: (newSession: UserSession) => void;
}

export default function SubscriptionModal({ isOpen, onClose, userSession, onUpgradeSession }: SubscriptionModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentStep, setPaymentStep] = useState<"plan" | "checkout" | "success">("plan");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardName, setCardName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    setPaymentStep("checkout");
    if (cardName === "") {
      setCardName(userSession.username || "Leo Client");
    }
  };

  const processSimulatedPayment = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPaymentStep("success");

      // Upgrade session state
      onUpgradeSession({
        ...userSession,
        isPremium: true,
        premiumExpires: billingCycle === "monthly" ? "Expires on Jul 16, 2026" : "Expires on Jun 16, 2027"
      });
    }, 2200);
  };

  return (
    <div id="leo-subscription-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      
      {/* Container Card */}
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-xl rounded-2xl p-6 relative shadow-2xl overflow-hidden animate-scaleUp">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-indigo-500" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_100%_0%,rgba(234,179,8,0.06),transparent_70%)] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {paymentStep === "plan" && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-2">
                <Crown size={22} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-serif italic text-white font-medium select-none">
                Ugrade to LEO Premium Core
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto select-none">
                Unlock quantum machine learning pipelines, high resolution synthesis, and E2E instant secure channels.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex justify-center select-none">
              <div className="bg-[#111] p-1 rounded-xl border border-white/5 flex gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === "monthly" ? "bg-amber-500 text-black shadow font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Monthly ($15)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === "yearly" ? "bg-amber-500 text-black shadow font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Yearly ($200) <span className="text-[9px] text-[#2c2c2c] bg-white/40 px-1 py-0.2 rounded font-bold uppercase shrink-0">Save 10%</span>
                </button>
              </div>
            </div>

            {/* Features layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                "Unlimited Text to Speech rendering",
                "Unmetered HD & 4K Text-to-Video AI",
                "Bespoke voice signatures (Fenrir, Kore)",
                "Elite key security & E2EE instant channels",
                "Zero daily visual latency caps",
                "1-on-1 VIP developer console access"
              ].map((feat, index) => (
                <div key={index} className="flex gap-2 items-start text-xs text-gray-300">
                  <CheckCircle2 size={135} className="text-amber-400 mt-0.5 shrink-0" style={{ width: 14, height: 14 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Price Box */}
            <div className="bg-[#111] rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase text-gray-400 tracking-wider">ACTIVE SELECTION</p>
                <p className="text-xl font-bold text-white mt-1">
                  {billingCycle === "monthly" ? "$15.00 / month" : "$200.00 / year"}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs h-10 px-5 rounded-xl cursor-pointer shadow-md select-none transform hover:scale-102 transition-all flex items-center gap-1.5"
              >
                Start Premium Plan
              </button>
            </div>

          </div>
        )}

        {paymentStep === "checkout" && (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <h4 className="text-white font-serif italic text-lg flex items-center gap-1.5">
                <CreditCard size={18} className="text-amber-400" /> Secure Checkout Terminal
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Encryption tunnels verified. Checkout payload is zero-knowledge encrypted.
              </p>
            </div>

            {/* Subscription pricing overview */}
            <div className="bg-[#111] p-3 rounded-xl border border-white/5 text-xs text-gray-300 flex justify-between select-none font-mono">
              <span>LEO Premium ({billingCycle})</span>
              <span className="text-amber-400 font-bold">
                {billingCycle === "monthly" ? "$15.00" : "$200.00"}
              </span>
            </div>

            {/* Input Forms */}
            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold leading-none pl-1">Name on Registry</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  disabled={isLoading}
                  placeholder="e.g., Jane Doe"
                  className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:outline-none focus:border-amber-500/50 rounded-xl h-10 px-3 text-xs text-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold leading-none pl-1">Simulated Card Details</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  disabled={isLoading}
                  placeholder="4111 2222 3333 4444"
                  className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:outline-none focus:border-amber-500/50 rounded-xl h-10 px-3 text-xs text-gray-250 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold leading-none pl-1">MM/YY</label>
                  <input
                    type="text"
                    defaultValue="12/29"
                    disabled={isLoading}
                    className="w-full bg-[#121212] border border-white/10 hover:border-white/20 focus:outline-none rounded-xl h-10 px-3 text-xs text-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold leading-none pl-1">CVV / Security</label>
                  <input
                    type="text"
                    defaultValue="***"
                    disabled={true}
                    className="w-full bg-[#121212]/50 border border-white/5 rounded-xl h-10 px-3 text-xs text-gray-400 font-mono cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>

            {/* Action check button */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPaymentStep("plan")}
                disabled={isLoading}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium text-xs h-10 rounded-xl border border-white/10 cursor-pointer flex items-center justify-center transition-all select-none"
              >
                Back
              </button>
              <button
                type="button"
                onClick={processSimulatedPayment}
                disabled={isLoading || !cardName.trim()}
                className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all select-none gap-2 shadow-lg disabled:bg-white/5 disabled:text-gray-500"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Verifying Tunnel...
                  </>
                ) : (
                  <>
                    <Crown size={12} className="text-yellow-400" /> Authorized Payment
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {paymentStep === "success" && (
          <div className="text-center p-6 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 size={32} className="animate-bounce" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-xl font-serif italic text-white font-medium">Payment Complete!</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Congratulations! Your credentials have been escalated to <span className="text-indigo-300 font-semibold font-mono">LEO Premium Member</span>. Unfiltered 4K rendering is now operational inside this node.
              </p>
            </div>

            <button
              onClick={onClose}
              className="bg-amber-500 text-black font-bold text-xs h-10 px-6 rounded-xl cursor-pointer shadow-md select-none mx-auto block transform hover:scale-103 transition-all"
            >
              Launch Core Terminal
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
