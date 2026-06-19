import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, deleteDoc, doc, 
  getDocs, updateDoc, setDoc, where 
} from "firebase/firestore";
import { 
  Users, BarChart3, MessageSquareWarning, Trash2, ShieldAlert, Cpu, 
  CheckCircle, TrendingUp, Sparkles, Brain, Landmark, AlertCircle, 
  Check, Mail, CheckCircle2, XCircle, HeartHandshake, UserCheck 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend 
} from "recharts";

interface UserReg {
  id: string;
  email: string;
  username: string;
  createdAt?: any;
  lastLogin?: string;
  isPremium?: boolean;
}

interface DataUsage {
  id: string;
  category: string;
  prompt: string;
  username: string;
  email: string;
  timestamp: string;
  createdAt?: any;
}

interface UserFeedback {
  id: string;
  name: string;
  email: string;
  feedbackText: string;
  score?: number;
  timestamp: string;
}

interface BankPayment {
  id: string;
  userEmail: string;
  username: string;
  method: string;
  billingCycle: string;
  amountUSD: number;
  amountNaira: number;
  senderName: string;
  senderPhone?: string;
  utrReference?: string;
  bankReceiptNote?: string;
  status: string; // 'pending' | 'approved' | 'declined'
  paymentDate: string;
  createdAt?: any;
}

interface SupportComplaint {
  id: string;
  fullName: string;
  userEmail: string;
  username: string;
  category: string;
  complaintText: string;
  priority: string; // 'Low' | 'High' | 'Critical'
  status: string; // 'open' | 'resolved'
  dateString: string;
  createdAt?: any;
}

export default function AdminTelemetryHub() {
  const [activeTab, setActiveTab] = useState<
    "users" | "data_usage" | "usage_stats" | "feedback" | "payments" | "complaints"
  >("users");

  const [usersList, setUsersList] = useState<UserReg[]>([]);
  const [usageList, setUsageList] = useState<DataUsage[]>([]);
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [paymentsList, setPaymentsList] = useState<BankPayment[]>([]);
  const [complaintsList, setComplaintsList] = useState<SupportComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [usersStats, setUsersStats] = useState<any[]>([]);

  // 1. Synchronize User Directory
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "leorex_user_registry"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: UserReg[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          email: d.email || "",
          username: d.username || "client_guest",
          isPremium: d.isPremium ?? false,
          lastLogin: d.lastLogin || "",
          createdAt: d.createdAt
        });
      });
      setUsersList(records);
      setIsLoading(false);
    }, (err) => {
      console.warn("User listing sync:", err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Synchronize Prompt Telemetry
  useEffect(() => {
    const q = query(collection(db, "leorex_data_usage"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: DataUsage[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          category: d.category || "General AI Prompt",
          prompt: d.prompt || "",
          username: d.username || "anonymous",
          email: d.email || "",
          timestamp: d.timestamp || "",
          createdAt: d.createdAt
        });
      });
      
      setUsageList(records.slice(0, 40));

      // Trend calculator
      const chronological = [...records].reverse();
      let runningTokens = 0;
      let runningImages = 0;

      const timeline = chronological.map((log, idx) => {
        const promptText = log.prompt || "";
        const isArt = log.category === "Artwork Synthesis" || /imagine|create image|generate image/i.test(promptText);
        const tokens = isArt ? 0 : Math.floor(promptText.length * 0.75 + 50);
        const images = isArt ? 1 : 0;
        runningTokens += tokens;
        runningImages += images;
        return {
          name: log.timestamp || `T-${chronological.length - idx}`,
          user: `@${log.username}`,
          tokens: tokens,
          accumulatedTokens: runningTokens,
          images: images,
          accumulatedImages: runningImages
        };
      });
      setStatsData(timeline);

      // Group usage by user
      const userGroup: { [username: string]: { tokens: number; images: number; count: number } } = {};
      records.forEach(log => {
        const promptText = log.prompt || "";
        const isArt = log.category === "Artwork Synthesis" || /imagine|create image|generate image/i.test(promptText);
        const tokens = isArt ? 0 : Math.floor(promptText.length * 0.75 + 50);
        const images = isArt ? 1 : 0;
        const u = log.username || "anonymous";
        if (!userGroup[u]) {
          userGroup[u] = { tokens: 0, images: 0, count: 0 };
        }
        userGroup[u].tokens += tokens;
        userGroup[u].images += images;
        userGroup[u].count += 1;
      });

      const userData = Object.keys(userGroup).map(user => ({
        username: `${user}`,
        tokens: userGroup[user].tokens,
        images: userGroup[user].images,
        prompts: userGroup[user].count
      }));
      setUsersStats(userData);

    }, (err) => {
      console.warn("Usage listing error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 3. Synchronize Client Feedbacks
  useEffect(() => {
    const q = query(collection(db, "leorex_feedbacks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: UserFeedback[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          name: d.name || "Anonymous Client",
          email: d.email || "",
          feedbackText: d.feedbackText || "",
          score: d.score || 5,
          timestamp: d.timestamp || ""
        });
      });
      setFeedbackList(records);
    }, (err) => {
      console.warn("Feedback sync error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 4. Synchronize Nigerian Payments Slips
  useEffect(() => {
    const q = query(collection(db, "leorex_payments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: BankPayment[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          userEmail: d.userEmail || "",
          username: d.username || "anonymous",
          method: d.method || "N/A",
          billingCycle: d.billingCycle || "monthly",
          amountUSD: d.amountUSD || 15,
          amountNaira: d.amountNaira || 15000,
          senderName: d.senderName || "",
          senderPhone: d.senderPhone || "",
          utrReference: d.utrReference || "",
          bankReceiptNote: d.bankReceiptNote || "",
          status: d.status || "pending",
          paymentDate: d.paymentDate || ""
        });
      });
      setPaymentsList(records);
    }, (err) => {
      console.warn("Nigerian payments sync error:", err);
    });
    return () => unsubscribe();
  }, []);

  // 5. Synchronize Escalated Support Technical Complaints List
  useEffect(() => {
    const q = query(collection(db, "leorex_complaints"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: SupportComplaint[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        records.push({
          id: docSnap.id,
          fullName: d.fullName || "Anonymous Client",
          userEmail: d.userEmail || "",
          username: d.username || "anonymous",
          category: d.category || "Incidental Log",
          complaintText: d.complaintText || "",
          priority: d.priority || "High",
          status: d.status || "open",
          dateString: d.dateString || ""
        });
      });
      setComplaintsList(records);
    }, (err) => {
      console.warn("Complaints desk sync error:", err);
    });
    return () => unsubscribe();
  }, []);

  // Operations: Delete item safely
  const handleDeleteRecord = async (colName: string, id: string) => {
    if (window.confirm("Delete record indices permanently? This is irreversible.")) {
      try {
        await deleteDoc(doc(db, colName, id));
      } catch (err) {
        console.error(`Failed to delete record from ${colName}:`, err);
      }
    }
  };

  // Operations: Authorize pending Nigerian bank payments (Automatically upgrade premium)
  const handleAuthorizePayment = async (payment: BankPayment) => {
    try {
      // 1. Update the payment document state to 'approved'
      await updateDoc(doc(db, "leorex_payments", payment.id), {
        status: "approved"
      });

      // 2. Scan and upgrade user account state in 'leorex_user_registry' to isPremium = true
      if (payment.userEmail) {
        const q = query(collection(db, "leorex_user_registry"), where("email", "==", payment.userEmail));
        const snap = await getDocs(q);
        snap.forEach(async (docSnap) => {
          await updateDoc(doc(db, "leorex_user_registry", docSnap.id), {
            isPremium: true,
            premiumExpires: `Authorized (Linked OPAY-₦${payment.amountNaira.toLocaleString()})`
          });
        });

        // Toggle configuration profile updates as well
        await setDoc(doc(db, "leorex_users_config", payment.userEmail), {
          isPremium: true,
          premiumExpires: `Authorized (OPAY ₦${payment.amountNaira.toLocaleString()})`
        }, { merge: true });
      }

      alert(`Payment success! Premium status automatically activated and linked to user ${payment.userEmail}.`);
    } catch (err) {
      console.error("Authorization workflow failed:", err);
      alert("Error approving transaction parameters.");
    }
  };

  // Operations: Decline / Cancel transfer slip
  const handleDeclinePayment = async (paymentId: string) => {
    if (window.confirm("Flag this receipt confirmation as declined?")) {
      try {
        await updateDoc(doc(db, "leorex_payments", paymentId), {
          status: "declined"
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Operations: Resolve support technical tickets
  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, "leorex_complaints", complaintId), {
        status: "resolved"
      });
      alert("Ticket status updated to resolved!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllTelemetry = async () => {
    const isConfirmed = window.confirm("Clear all prompts and security logs? Users, payments and complaints will be retained.");
    if (isConfirmed) {
      try {
        const snapshot = await getDocs(collection(db, "leorex_data_usage"));
        snapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(db, "leorex_data_usage", docSnap.id));
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div id="leorex-admin-monitoring-console" className="space-y-6 font-sans">
      
      {/* Top Admin Branding Banner */}
      <div className="bg-[#100f1a] border border-indigo-500/25 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden text-gray-200">
        <div className="absolute right-0 top-0 h-full w-48 bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-400 animate-pulse animate-bounce" />
            <h4 className="text-md font-serif italic text-white font-bold uppercase tracking-wider">Leorex Owner Sovereign Mission Control Desk</h4>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Sovereign oversight portal for operator <span className="text-amber-400 font-bold font-mono">princepaulstrikas@gmail.com</span>. Audit registration signals, process premium NGN transfers to OPAY bank account, and resolve technical complaints instantly.
          </p>
        </div>
        <button
          onClick={handleClearAllTelemetry}
          className="bg-red-500/10 hover:bg-red-500/25 text-red-400 font-bold text-xs px-3.5 py-1.5 rounded-lg border border-red-505/20 transition-all cursor-pointer relative z-10 font-mono"
        >
          Clear Prompts Log
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-[#0a0a0a] border border-white/5 p-1 rounded-xl gap-2 font-mono text-[9.5px] tracking-wider uppercase select-none">
        
        <button
          onClick={() => setActiveTab("users")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "users" ? "bg-white/10 text-white font-bold" : "text-gray-550 hover:text-white"
          }`}
        >
          <Users size={12} />
          <span>Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeTab === "payments" ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/25" : "text-amber-500 hover:text-white"
          }`}
        >
          <Landmark size={12} />
          <span>OPAY Payments ({paymentsList.filter(p => p.status === "pending").length})</span>
          {paymentsList.filter(p => p.status === "pending").length > 0 && (
            <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8.5px] font-bold text-black border border-[#0a0a0a]">
              {paymentsList.filter(p => p.status === "pending").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("complaints")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeTab === "complaints" ? "bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/25" : "text-indigo-400 hover:text-white"
          }`}
        >
          <Mail size={12} />
          <span>Complaints ({complaintsList.filter(c => c.status === "open").length})</span>
          {complaintsList.filter(c => c.status === "open").length > 0 && (
            <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[8.5px] font-bold text-white border border-[#0a0a0a] animate-pulse">
              {complaintsList.filter(c => c.status === "open").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("data_usage")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "data_usage" ? "bg-white/10 text-white font-bold" : "text-gray-550 hover:text-white"
          }`}
        >
          <BarChart3 size={11} />
          <span>Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab("usage_stats")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "usage_stats" ? "bg-white/10 text-white font-bold" : "text-gray-550 hover:text-white"
          }`}
        >
          <TrendingUp size={11} />
          <span>Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "feedback" ? "bg-white/10 text-white font-bold" : "text-gray-550 hover:text-white"
          }`}
        >
          <MessageSquareWarning size={11} />
          <span>Feedbacks</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10 gap-2 text-xs text-slate-400 font-mono">
          <Cpu size={14} className="animate-spin text-amber-400" />
          Synchronizing microservices logs...
        </div>
      )}

      {/* TAB CONTENTS */}
      <div className="bg-[#0b0c10] border border-white/10 rounded-2xl p-5 min-h-[300px]">
        
        {/* TAB 1: NIGERIAN PAYMENTS AUDIT WORKFLOW */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h5 className="text-xs font-bold text-amber-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                  <Landmark size={14} /> NIGERIA OPAY PAYMENTS LEDGER (EZE CHIOMA 8165638800)
                </h5>
                <p className="text-[10px] text-gray-500 mt-1">Review transfer payment slips deposited for Naira Premium access. Click Approve to grant instant Premium to accounts.</p>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-1 rounded">
                Pending Ledger: <strong className="text-amber-400">{paymentsList.filter(p => p.status === "pending").length}</strong>
              </span>
            </div>

            {paymentsList.length === 0 ? (
              <div className="text-center p-12 text-xs text-gray-500 italic">No bank transfer Slips registered in cloud Firestore.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase text-[9px] tracking-wider font-bold">
                      <th className="py-2.5 px-3">Sender & Email</th>
                      <th className="py-2.5 px-3">Amount Paid</th>
                      <th className="py-2.5 px-3">Gateway Cycle</th>
                      <th className="py-2.5 px-3">UTR Reference / Slip Remarks</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Confirm Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {paymentsList.map((pay) => (
                      <tr key={pay.id} className="hover:bg-white/2">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">@{pay.username}</span>
                          <span className="text-[11px] text-indigo-400 select-all block">{pay.userEmail}</span>
                          {pay.senderPhone && <span className="text-[9px] text-gray-600 block">Phone: {pay.senderPhone}</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-green-400 font-bold block">₦{Number(pay.amountNaira || 15000).toLocaleString()}</span>
                          <span className="text-gray-600 text-[10px] block">($ {pay.amountUSD})</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-[10px] bg-indigo-950/20 text-indigo-300 border border-indigo-500/10 px-2 py-0.5 rounded">
                            {pay.billingCycle}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs text-gray-400">
                          <div className="text-[10px]">Reference: <span className="text-amber-400 font-bold font-mono">{pay.utrReference || "N/A"}</span></div>
                          {pay.senderName && <div className="text-[9px] text-[#94a3b8]">Sender Holder: {pay.senderName}</div>}
                          {pay.bankReceiptNote && <p className="text-[9.5px] italic text-zinc-500 mt-1 pl-1 border-l border-zinc-700">&ldquo;{pay.bankReceiptNote}&rdquo;</p>}
                        </td>
                        <td className="py-2.5 px-3 select-none">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            pay.status === "approved" 
                              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                              : pay.status === "declined"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          }`}>
                            {pay.status || "pending"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {pay.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleAuthorizePayment(pay)}
                                  className="bg-green-600 hover:bg-green-500 text-white font-extrabold px-2.2 py-1 rounded text-[10px] cursor-pointer flex items-center gap-0.5 transition-all"
                                  title="Approve Naira Receipt & Grant Premium Access"
                                >
                                  <UserCheck size={11} /> Approve
                                </button>
                                <button
                                  onClick={() => handleDeclinePayment(pay.id)}
                                  className="bg-black border border-white/10 hover:border-red-500/30 text-red-400 hover:text-red-300 px-2 py-1 rounded text-[10px] cursor-pointer transition-all"
                                  title="Decline / Flag Receipt Slip"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={() => handleDeleteRecord("leorex_payments", pay.id)}
                              className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                              title="Delete Payment Reference"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TECHNICAL COMPLAINTS & ESCALATIONS DESK */}
        {activeTab === "complaints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                  <Mail size={14} /> ESCALATED GMAIL TECHNICAL COMPLAINTS MONITOR (princepaulstrikas@gmail.com)
                </h5>
                <p className="text-[10px] text-gray-550 mt-1">Review operational breakdowns filed under user nodes. Easily format replies using client-side Gmail / Mailto injectors.</p>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-1 rounded">
                Open Tickets: <strong className="text-indigo-400">{complaintsList.filter(c => c.status === "open").length}</strong>
              </span>
            </div>

            {complaintsList.length === 0 ? (
              <div className="text-center p-12 text-xs text-gray-500 italic">No technical complaints filed yet. User nodes are healthy!</div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {complaintsList.map((comp) => (
                  <div key={comp.id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 transition-all ${
                    comp.status === "resolved" 
                      ? "bg-black/30 border-white/5 opacity-70" 
                      : comp.priority === "Critical"
                      ? "bg-red-950/10 border-red-500/25 ring-1 ring-red-500/10"
                      : "bg-[#0f1016] border-white/10"
                  }`}>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="font-bold text-white text-sm">{comp.fullName}</h6>
                          <div className="text-[10px] text-indigo-400 font-mono select-all flex items-center gap-1">
                            <span>{comp.userEmail}</span>
                            <span className="text-gray-650">•</span>
                            <span>@{comp.username}</span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider font-extrabold font-mono ${
                            comp.priority === "Critical" 
                              ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" 
                              : comp.priority === "High"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-white/5"
                          }`}>
                            {comp.priority} URGENCY
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider font-extrabold font-mono ${
                            comp.status === "resolved" 
                              ? "bg-green-500/10 text-green-405 border border-green-500/20" 
                              : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          }`}>
                            {comp.status || "open"}
                          </span>
                        </div>
                      </div>

                      {/* Incident Category Row */}
                      <div className="text-[10px] uppercase font-mono bg-white/5 inline-block px-2 py-0.6 rounded border border-white/5 text-gray-300">
                        Category: <strong className="text-slate-200">{comp.category}</strong>
                      </div>

                      {/* Complaint Content */}
                      <p className="text-xs text-gray-350 leading-relaxed font-sans bg-black/40 p-3 rounded-lg border border-white/5 break-words whitespace-pre-wrap">
                        &ldquo;{comp.complaintText}&rdquo;
                      </p>
                    </div>

                    {/* Footer Reply dispatchers */}
                    <div className="flex justify-between items-center pt-2 text-[10px] text-gray-550 border-t border-white/5">
                      <span className="font-mono">{comp.dateString}</span>
                      
                      <div className="flex gap-1.5">
                        
                        {/* Direct Mailto compiler */}
                        <a
                          href={`mailto:${comp.userEmail}?subject=LEOREX%20Technical%20Escalation%20Resolution%20[%20${comp.category}%20]&body=Hello%20${encodeURIComponent(comp.fullName)},%0D%0DThis%20is%20the%20LEOREX%20Systems%20Owner%20Team%20referencing%20your%20complaint%20regarding:%20"${encodeURIComponent(comp.category)}".%0D%0D[Your%20Issue%20Description]:%0D"${encodeURIComponent(comp.complaintText)}"%0D%0D-------------------------%0D[RESOLUTION%20STEPS]:%0D1.%20Please%20try%20launching%20the%20app%20using%20the%2520Standalone%2520link%2520if%2520Google%2520popup%2520was%2520previously%2520blocked.%0D2.%20Naira%2520OPAY%2520transfers%2520have%2520been%2520audited%2520against%2520reference%2520indexes.%0D%0DLet%20us%20know%20if%20access%20is%20now%20unlocked.%0D%0DBest%20regards,%0DLEOREX%20Sovereign%20Owner%20Team`}
                          className="bg-indigo-600 hover:bg-indigo-501 font-sans text-white font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 hover:no-underline text-[9.5px]"
                          title="Compose direct Gmail reply via mailto connector"
                        >
                          <Mail size={10} /> Reply to Email
                        </a>

                        {comp.status === "open" && (
                          <button
                            onClick={() => handleResolveComplaint(comp.id)}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold px-2 py-1 rounded text-[9.5px] cursor-pointer transition-colors"
                          >
                            Mark Resolved
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteRecord("leorex_complaints", comp.id)}
                          className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS REGISTRY */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-widest pl-1">Authorized User Directory</h5>
            {usersList.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3">No user database signals synced yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#718096] uppercase text-[9px] tracking-widest">
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Subscription</th>
                      <th className="py-2.5 px-3">Last Interconnect</th>
                      <th className="py-2.5 px-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-white/2">
                        <td className="py-2.5 px-3 font-bold text-white">@{usr.username}</td>
                        <td className="py-2.5 px-3 text-indigo-300 select-all">{usr.email || "No email registered"}</td>
                        <td className="py-2.5 px-3">
                          {usr.isPremium ? (
                            <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15">👑 PREMIUM CORE</span>
                          ) : (
                            <span className="text-gray-500 text-[10px]">STANDARD GUEST</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-450">{usr.lastLogin || "Initial Setup"}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteRecord("leorex_user_registry", usr.id)}
                            className="text-red-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                            title="Deauthorize user credential"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROMPT & DATA USAGE LOGS */}
        {activeTab === "data_usage" && (
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-widest pl-1">Live Telemetry & Prompts Monitor</h5>
            <p className="text-[10px] text-gray-500">Chronological list of all interactive actions written directly to Firestore by users.</p>
            {usageList.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3">Data pipeline empty check. Have users send prompt vectors first!</p>
            ) : (
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#718096] uppercase text-[9px] tracking-widest">
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Input / Prompt Info</th>
                      <th className="py-2.5 px-3">Initiated By</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3 text-right">Flush</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {usageList.map((log) => (
                      <tr key={log.id} className="hover:bg-white/2 text-[11px]">
                        <td className="py-2.5 px-3">
                          <span className="text-indigo-400 font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20 text-[9px] uppercase tracking-wider">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-200 select-all max-w-sm truncate" title={log.prompt}>
                          {log.prompt}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">
                          @{log.username} <span className="text-[9px] opacity-75">({log.email || "anon"})</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-[10px] whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteRecord("leorex_data_usage", log.id)}
                            className="text-red-500 hover:text-red-400 p-1 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USAGE STATISTICS */}
        {activeTab === "usage_stats" && (
          <div className="space-y-6 animate-fadeIn font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-4">
              <div>
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-widest pl-1">Usage Analytics & Core Metrics</h5>
                <p className="text-[10px] text-gray-500">Live monitoring of calculated token throughput and image synthesis events across the LEOREX network.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="bg-indigo-950/30 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-right font-mono">
                  <span className="text-[8px] text-indigo-400 uppercase font-mono block leading-none">Global Token Pool</span>
                  <span className="text-xs text-white font-bold">{statsData.reduce((acc, curr) => acc + (curr.tokens || 0), 0).toLocaleString()}</span>
                </div>
                <div className="bg-amber-950/30 border border-amber-500/20 px-3 py-1.5 rounded-lg text-right font-mono">
                  <span className="text-[8px] text-amber-400 uppercase font-mono block leading-none">Graphics Rendered</span>
                  <span className="text-xs text-white font-bold">{statsData.reduce((acc, curr) => acc + (curr.images || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {statsData.length === 0 ? (
              <div className="bg-black/20 border border-white/5 p-8 rounded-xl text-center text-xs text-slate-500 italic">
                No usage history telemetry has been accumulated yet. Spark some discussions or synthesize art to populate metrics!
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Charts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* Timeline Chart */}
                  <div className="bg-black/45 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pl-1">
                      <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1.5 font-mono">
                        <TrendingUp size={12} className="text-indigo-400" /> Token Consumption Timeline
                      </span>
                      <span className="text-[9px] font-mono text-gray-550">Last Active Prompts</span>
                    </div>
                    <div className="w-full h-64 text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={statsData.slice(-15)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                          <XAxis dataKey="name" stroke="#666" fontSize={8} tickLine={false} />
                          <YAxis stroke="#666" fontSize={8} tickLine={false} />
                          <ChartTooltip
                            contentStyle={{ backgroundColor: "#0b0c10", borderColor: "#444", borderRadius: "8px" }}
                            labelStyle={{ color: "#aaa" }}
                          />
                          <Area type="monotone" dataKey="tokens" name="Tokens Used" stroke="#6366f1" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Graphics Synthesis Chart */}
                  <div className="bg-black/45 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pl-1">
                      <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5 font-mono">
                        <Sparkles size={12} className="text-amber-400" /> Artwork Generation Frequency
                      </span>
                      <span className="text-[9px] font-mono text-gray-550">Graphics Counts</span>
                    </div>
                    <div className="w-full h-64 text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData.slice(-15)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                          <XAxis dataKey="name" stroke="#666" fontSize={8} tickLine={false} />
                          <YAxis stroke="#666" fontSize={8} tickLine={false} allowDecimals={false} />
                          <ChartTooltip
                            contentStyle={{ backgroundColor: "#0b0c10", borderColor: "#444", borderRadius: "8px" }}
                            labelStyle={{ color: "#aaa" }}
                          />
                          <Bar dataKey="images" name="Images Synthesized" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Users breakdown section */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pl-1">
                    <Brain size={13} className="text-[#a5b4fc]" />
                    <h6 className="text-[10px] uppercase font-bold text-gray-300 tracking-widest leading-none font-mono">Node Level Resource Utilization</h6>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User tokens chart */}
                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <span className="text-[9px] uppercase font-mono text-gray-400 block mb-3 pl-1">Tokens consumed per Workspace Node</span>
                      <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={usersStats} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                            <XAxis type="number" stroke="#666" fontSize={8} tickLine={false} />
                            <YAxis type="category" dataKey="username" stroke="#666" fontSize={8} tickLine={false} />
                            <ChartTooltip
                              contentStyle={{ backgroundColor: "#0b0c10", borderColor: "#444", borderRadius: "8px" }}
                            />
                            <Bar dataKey="tokens" name="Tokens" fill="#10b981" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* User prompts and images */}
                    <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                      <span className="text-[9px] uppercase font-mono text-gray-400 block mb-3 pl-1">Generative calls by Node</span>
                      <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={usersStats} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="username" stroke="#666" fontSize={8} tickLine={false} />
                            <YAxis stroke="#666" fontSize={8} tickLine={false} allowDecimals={false} />
                            <ChartTooltip
                              contentStyle={{ backgroundColor: "#0b0c10", borderColor: "#444", borderRadius: "8px" }}
                            />
                            <Legend wrapperStyle={{ fontSize: '8px' }} />
                            <Bar dataKey="prompts" name="Total Prompts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="images" name="Images Synthesized" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* FEEDBACK FORMS FEED */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-widest pl-1 text-emerald-400">Public User Inquiries & Suggestions</h5>
            {feedbackList.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3">No active client suggestions recorded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbackList.map((f) => (
                  <div key={f.id} className="bg-black/35 rounded-xl border border-white/10 p-4 space-y-3 flex flex-col justify-between transition-all hover:bg-black/50">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="text-white font-bold leading-none">{f.name}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: f.score || 5 }).map((_, idx) => (
                            <span key={idx} className="text-amber-400 text-xs">★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-indigo-400 select-all font-mono">{f.email}</p>
                      <div className="bg-[#111] p-3 rounded-xl border border-white/5 text-xs text-gray-200 leading-relaxed font-sans mt-2 whitespace-pre-wrap">
                        &ldquo;{f.feedbackText}&rdquo;
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-[10px] text-gray-500 mt-2">
                      <span className="font-mono">{f.timestamp}</span>
                      <button
                        onClick={() => handleDeleteRecord("leorex_feedbacks", f.id)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-[#151f15]/40 hover:bg-[#151f15]/80 px-2.5 py-1 rounded-lg border border-emerald-500/20 cursor-pointer transition-all"
                      >
                        <CheckCircle size={11} />
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
