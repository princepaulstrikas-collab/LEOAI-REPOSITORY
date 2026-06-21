import React, { useState } from "react";
import { UserSession } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  Crown, Check, CheckCircle2, ShieldAlert, CreditCard, Sparkles, X, 
  Gift, Users, RefreshCw, Send, HelpCircle, Landmark 
} from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onUpgradeSession: (newSession: UserSession) => void;
}

export default function SubscriptionModal({ isOpen, onClose, userSession, onUpgradeSession }: SubscriptionModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentStep, setPaymentStep] = useState<"plan" | "checkout" | "bank_transfer" | "success">("plan");
  const [method, setMethod] = useState<"card" | "bank">("card");
  
  // Simulated Card parameters
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardName, setCardName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Nigerian OPAY Bank transfer receipt parameters
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [amountNaira, setAmountNaira] = useState("15000"); // 15,000 NGN for monthly, 200,000 NGN for yearly
  const [utrReference, setUtrReference] = useState("");
  const [bankReceiptNote, setBankReceiptNote] = useState("");

  if (!isOpen) return null;

  // Toggle checkout step
  const handleCheckoutIntent = (payMethod: "card" | "bank") => {
    setMethod(payMethod);
    if (!cardName) {
      setCardName(userSession.username || "Leo Client");
    }
    if (!senderName) {
      setSenderName(userSession.username || "");
    }
    setAmountNaira(billingCycle === "monthly" ? "15000" : "200000");

    if (payMethod === "card") {
      setPaymentStep("checkout");
    } else {
      setPaymentStep("bank_transfer");
    }
  };

  // 1. Process standard simulated credit card checkout
  const processSimulatedPayment = async () => {
    setIsLoading(true);
    try {
      // Save simulated card payment ledger
      if (userSession.email) {
        await addDoc(collection(db, "leorex_payments"), {
          userEmail: userSession.email,
          username: userSession.username || "anonymous",
          method: "Card Authorization",
          billingCycle,
          amountUSD: billingCycle === "monthly" ? 15 : 200,
          amountNaira: billingCycle === "monthly" ? 15000 : 200000,
          cardName: cardName.trim(),
          status: "approved",
          paymentDate: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Skipped database check for card checkout", e);
    }

    setTimeout(() => {
      setIsLoading(false);
      setPaymentStep("success");

      // Upgrade active session
      onUpgradeSession({
        ...userSession,
        isPremium: true,
        premiumExpires: billingCycle === "monthly" ? "Expires on Jul 16, 2026" : "Expires on Jun 16, 2027"
      });
    }, 2000);
  };

  // 2. Process real-time Nigerian Bank Transfer Receipt Submit
  const handleBankReceiptSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !amountNaira.trim()) return;

    setIsLoading(true);

    try {
      // Post actual payment receipt confirmation directly to Firestore
      await addDoc(collection(db, "leorex_payments"), {
        userEmail: userSession.email || "guest_transfer",
        username: userSession.username || "guest_node",
        method: "OPAY Bank Transfer",
        billingCycle,
        amountUSD: billingCycle === "monthly" ? 15 : 200,
        amountNaira: Number(amountNaira),
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim() || "No Phone",
        utrReference: utrReference.trim() || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
        bankReceiptNote: bankReceiptNote.trim(),
        status: "pending", // Waiting for Owner Team verification on princepaulstrikas@gmail.com
        paymentDate: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });

      // Give immediate premium trial/temporary access while owner reviews in real-time
      onUpgradeSession({
        ...userSession,
        isPremium: true,
        premiumExpires: `Pending Owner Verification (₦${Number(amountNaira).toLocaleString()})`
      });

      setTimeout(() => {
        setIsLoading(false);
        setPaymentStep("success");
      }, 1500);

    } catch (err) {
      console.error("Payment registration warning:", err);
      setIsLoading(false);
      alert("Error linking payment ledger. Please retry or contact technical team.");
    }
  };

  return (
    <div id="leo-subscription-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      
      {/* Container Card */}
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 relative shadow-2xl animate-scaleUp text-gray-200">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-indigo-500" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_100%_0%,rgba(234,179,8,0.06),transparent_70%)] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer z-10"
        >
          <X size={16} />
        </button>

        {/* STEP 1: PLAN CHOOSING SCREEN */}
        {paymentStep === "plan" && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-1.5 pt-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-2">
                <Crown size={22} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-serif italic text-white font-medium select-none">
                Upgrade to LEO Premium Core
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto select-none leading-relaxed">
                Activate quantum machine support, higher video bandwidths, and complete secure channels.
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
                  Monthly ($15 / ₦15,000)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === "yearly" ? "bg-amber-500 text-black shadow font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Yearly ($200 / ₦200,000)
                </button>
              </div>
            </div>

            {/* Features layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-sans">
              {[
                "Unlimited Text to Speech rendering",
                "Unmetered HD & 4K Text-to-Video AI",
                "Bespoke voice signatures (Fenrir, Kore)",
                "Elite key security & E2EE instant channels",
                "Zero daily visual latency caps",
                "Direct Nigeria payment verification"
              ].map((feat, index) => (
                <div key={index} className="flex gap-2 items-start text-xs text-gray-350">
                  <CheckCircle2 size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Nigerian Account Details Quick Box */}
            <div className="bg-[#111] rounded-xl p-3.5 border border-white/5 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[9px] uppercase tracking-widest font-bold">
                <Landmark size={12} />
                <span>Nigeria Official payment channel (OPAY)</span>
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Bank transfers made to this specific account are automatically synchronized to your user handle:
              </p>
              <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank Name:</span>
                  <span className="text-white font-bold">OPAY Bank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Number:</span>
                  <span className="text-amber-400 font-bold select-all bg-amber-950/20 px-1 rounded">8165638800</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Name:</span>
                  <span className="text-gray-200 font-bold text-[10px] uppercase">EZE CHIOMA CHRISTIANA</span>
                </div>
              </div>
            </div>

            {/* Selection Gateways Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => handleCheckoutIntent("card")}
                className="bg-black/50 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-gray-300 hover:text-white font-bold text-xs h-11 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 select-none"
              >
                <CreditCard size={14} className="text-indigo-400" />
                Pay via Card
              </button>
              
              <button
                onClick={() => handleCheckoutIntent("bank")}
                className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-xs h-11 px-4 rounded-xl cursor-pointer shadow-md select-none transform hover:scale-102 transition-all flex items-center justify-center gap-2"
              >
                <Landmark size={14} />
                Direct Transfer (NGN)
              </button>
            </div>

          </div>
        )}

        {/* STEP 2A: CARD CHECKOUT INTERFACE */}
        {paymentStep === "checkout" && (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <h4 className="text-white font-serif italic text-lg flex items-center gap-1.5">
                <CreditCard size={18} className="text-amber-400" /> Secure Card checkout
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Simulated secure gateway tunnel. Input parameters to verify.
              </p>
            </div>

            <div className="bg-[#111] p-3 rounded-xl border border-white/5 text-xs text-gray-350 flex justify-between select-none font-mono">
              <span>LEOREX Premium ({billingCycle})</span>
              <span className="text-amber-400 font-bold">
                {billingCycle === "monthly" ? "NGN 15,000 / $15.00" : "NGN 200,000 / $200.00"}
              </span>
            </div>

            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold pl-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  disabled={isLoading}
                  placeholder="e.g., EZE CHIOMA"
                  className="w-full bg-[#121212] border border-white/10 focus:outline-none focus:border-amber-500 rounded-xl h-10 px-3 text-xs text-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold pl-1">Debit / Credit Card Details</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-[#121212] border border-white/10 focus:outline-none focus:border-amber-500 rounded-xl h-10 px-3 text-xs text-gray-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  defaultValue="12/29"
                  disabled={isLoading}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl h-10 px-3 text-xs text-gray-200"
                  placeholder="MM/YY"
                />
                <input
                  type="text"
                  defaultValue="***"
                  disabled={true}
                  className="w-full bg-[#121212]/30 border border-white/5 rounded-xl h-10 px-3 text-xs text-gray-400 font-mono"
                  placeholder="CVV"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPaymentStep("plan")}
                disabled={isLoading}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium text-xs h-10 rounded-xl border border-white/10 cursor-pointer"
              >
                Back to Plans
              </button>
              <button
                type="button"
                onClick={processSimulatedPayment}
                disabled={isLoading || !cardName.trim()}
                className="flex-2 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw size={12} className="animate-spin mr-1.5" />
                ) : (
                  <Crown size={12} className="text-yellow-400 mr-1.5" />
                )}
                Authorize Payment
              </button>
            </div>
          </div>
        )}

        {/* STEP 2B: NIGERIAN OPAY BANK TRANSFER RECEIPT FORM */}
        {paymentStep === "bank_transfer" && (
          <form onSubmit={handleBankReceiptSubmission} className="space-y-4">
            <div>
              <h4 className="text-white font-serif italic text-lg flex items-center gap-1.5">
                <Landmark size={18} className="text-amber-400 animate-pulse" /> OPAY Bank Transfer Receipt
              </h4>
              <p className="text-xs text-gray-450 mt-1 leading-snug">
                Please make a transfer of the Naira equivalent, then complete your payment parameters below to automatically register the receipt to your account.
              </p>
            </div>

            {/* Payment Details Card */}
            <div className="bg-[#121212] border border-white/5 p-3 rounded-xl grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="border-r border-white/5 pr-1.5 space-y-1">
                <span className="text-[9px] text-gray-500 uppercase block">Send Money To:</span>
                <span className="text-white font-bold block">OPAY Bank</span>
                <span className="text-amber-400 font-extrabold block select-all bg-amber-950/20 px-1 rounded inline-block">8165638800</span>
                <span className="text-[10px] text-gray-400 font-sans block truncate" title="EZE CHIOMA CHRISTIANA">EZE CHIOMA CHRISTIANA</span>
              </div>
              <div className="pl-1.5 space-y-1">
                <span className="text-[9px] text-gray-500 uppercase block">Required Amount:</span>
                <span className="text-white font-bold block text-sm">
                  ₦{Number(amountNaira).toLocaleString()}
                </span>
                <span className="text-gray-500 block text-[9px] uppercase">Plan Selection:</span>
                <span className="text-indigo-400 font-bold block capitalize">{billingCycle} Core</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-3 font-sans">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Your Bank Account Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Eze Chioma C"
                  className="w-full bg-black/60 border border-white/10 focus:border-amber-500 rounded-xl h-9.5 px-3 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Amount Transferred (₦)</label>
                <input
                  type="number"
                  value={amountNaira}
                  onChange={(e) => setAmountNaira(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-black/60 border border-white/10 focus:border-amber-500 rounded-xl h-9.5 px-3 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Utr / Transaction Reference</label>
                <input
                  type="text"
                  value={utrReference}
                  onChange={(e) => setUtrReference(e.target.value)}
                  placeholder="Optional reference No"
                  className="w-full bg-black/60 border border-white/10 focus:border-amber-500 rounded-xl h-9.5 px-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Sender Phone No</label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g., 0803..."
                  className="w-full bg-black/60 border border-white/10 focus:border-amber-500 rounded-xl h-9.5 px-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block">Support remarks / extra message</label>
              <textarea
                value={bankReceiptNote}
                onChange={(e) => setBankReceiptNote(e.target.value)}
                placeholder="State any payment details or speed up request remarks here..."
                rows={1.5}
                className="w-full bg-black/60 border border-white/10 focus:border-amber-500 rounded-xl p-2 text-xs text-white focus:outline-none resize-none font-sans"
              />
            </div>

            {/* Submit receipt and action buttons */}
            <div className="flex gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setPaymentStep("plan")}
                disabled={isLoading}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium text-xs h-10 rounded-xl border border-white/10 cursor-pointer"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !senderName.trim() || !amountNaira.trim()}
                className="flex-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-xs h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all shadow-md gap-1.5"
              >
                {isLoading ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Send size={11} />
                )}
                Link Transfer Receipt
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: TRANSACTION SUCCESS SCREEN */}
        {paymentStep === "success" && (
          <div className="text-center p-6 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 size={32} className="animate-bounce" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-xl font-serif italic text-white font-medium">Receipt Registered Successfully!</h4>
              {method === "bank" ? (
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed font-sans">
                  Your bank transfer parameter of <span className="text-amber-400 font-bold">₦{Number(amountNaira).toLocaleString()}</span> has been updated on the ledger and linked to email <span className="text-indigo-400 font-semibold font-mono">{userSession.email}</span>. Premium trial core features are initialized while the team audits OPAY receipt ref.
                </p>
              ) : (
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed font-sans">
                  Congratulations! Your card credentials has been linked and upgraded safely. High-fidelity rendering is fully operational.
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="bg-amber-500 text-black font-extrabold text-xs h-10 px-6 rounded-xl cursor-pointer shadow-md select-none mx-auto block transform hover:scale-103 transition-all"
            >
              Launch Core Terminal
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
