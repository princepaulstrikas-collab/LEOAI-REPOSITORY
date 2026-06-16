import React, { useState, useEffect, useRef } from "react";
import { EncryptedMessage } from "../types";
import { 
  ShieldCheck, Send, Key, Lock, Unlock, Zap, Eye, EyeOff, RefreshCw, 
  Search, Paperclip, Smile, MoreVertical, Phone, Video, Check, CheckCheck, 
  Trash2, User, Info, Wifi, LockKeyhole, MessageSquarePlus
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  fingerprint: string;
  statusText: string;
  isOnline: boolean;
  avatarBg: string;
}

const CONTACTS: Contact[] = [
  { 
    id: "lionheart", 
    name: "Agent Lionheart", 
    avatar: "🦁", 
    fingerprint: "SHA-256 // ee3c8b492bda76a59dcfb", 
    statusText: "online", 
    isOnline: true,
    avatarBg: "from-amber-600 to-amber-700"
  },
  { 
    id: "cryptovault", 
    name: "Aether Cryptovault", 
    avatar: "📼", 
    fingerprint: "SHA-256 // b84a1e94112fc339ea2f3", 
    statusText: "last seen 5m ago", 
    isOnline: false,
    avatarBg: "from-zinc-700 to-zinc-900"
  },
  { 
    id: "node9", 
    name: "Sub-Node 9 (Relay)", 
    avatar: "📡", 
    fingerprint: "SHA-256 // c928e12fff002a7b8e1a1", 
    statusText: "online", 
    isOnline: true,
    avatarBg: "from-blue-600 to-blue-700"
  }
];

const STARTER_MESSAGES: Record<string, EncryptedMessage[]> = {
  lionheart: [
    {
      id: "lh1",
      sender: "Agent Lionheart",
      encryptedText: "VTI5amIzUnBiMjU1WkdWamNubHdkR2xoZEdWeVkyaGhibVJ6YUdGclpUMD0=",
      publicKeyFingerprint: "ee3c8b492bda76a59dcfb",
      timestamp: "11:20 AM",
      vibeStatus: "AES-GCM-256 Handshake Verified"
    }
  ],
  cryptovault: [
    {
      id: "cv1",
      sender: "Aether Cryptovault",
      encryptedText: "VkhsdmREcG1iMk52YzNCdmRtVnlZMmhoYm1SemFHRnJaVDA9",
      publicKeyFingerprint: "b84a1e94112fc339ea2f3",
      timestamp: "10:45 AM",
      vibeStatus: "AES-GCM-256 Handshake Verified"
    }
  ],
  node9: []
};

// Simple AES-like simulated encoding that matches base64 structure safely
const encryptText = (plain: string): string => {
  try {
    return btoa(btoa(plain));
  } catch (e) {
    return "U2FsdGVkX1" + Math.random().toString(36).substring(3, 15);
  }
};

const decryptText = (cipher: string): string => {
  try {
    return atob(atob(cipher));
  } catch (e) {
    return "[DECRYPTION_FAILED // CIPHER BLOCK CORRUPTED]";
  }
};

// Fun agent simulated responses
const SIMULATED_REPLIES: Record<string, string[]> = {
  lionheart: [
    "Secure baseline tunnel re-anchored. Moving to tactical communications.",
    "Quantum entropy level is nominal. LION-CORE signals are optimal.",
    "Incoming telemetry suggests all local ports cleared. I am standing by.",
    "Decryption key authorized. Keep files cached on block 8219."
  ],
  cryptovault: [
    "Sector backup finalized. Cloud storage hashes validated successfully.",
    "Entropy buffer refilled. All secure vaults under 256-bit lock.",
    "Archival node initialized. Standard offline protocols online."
  ],
  node9: [
    "Sub-Node 9 relaying packets... Latency is 12ms. Signal clear.",
    "Symmetric keys confirmed for quantum tunnel handshakes.",
    "Secure satellite downlink locked. Tracking GPS 34.0522 N / 118.2437 W."
  ]
};

export default function LeoMessenger() {
  const [selectedContact, setSelectedContact] = useState<Contact>(CONTACTS[0]);
  const [messages, setMessages] = useState<Record<string, EncryptedMessage[]>>(STARTER_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Security Keys Simulation
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  
  // Decryption state helpers
  const [decryptedMap, setDecryptedMap] = useState<Record<string, boolean>>({
    "lh1": false,
    "cv1": false
  });
  const [revealAll, setRevealAll] = useState(false);
  
  // Interactive Agent statuses ('online', 'typing...', 'last seen...')
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({
    lionheart: "online",
    cryptovault: "last seen 5m ago",
    node9: "online"
  });

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Generate private/public keys simulation on mount
  useEffect(() => {
    generateNewKeys();
  }, []);

  // Soft Auto Scroll to bottom when messages list size changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, selectedContact.id, agentStatuses]);

  const generateNewKeys = () => {
    setIsGeneratingKeys(true);
    setTimeout(() => {
      const generatedPub = "LION-PUB-256-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const generatedPriv = "LION-PRIV-256-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setPublicKey(generatedPub);
      setPrivateKey(generatedPriv);
      setIsGeneratingKeys(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const plainText = inputText.trim();
    const encrypted = encryptText(plainText);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = "msg-" + Date.now().toString();

    // Outgoing encrypted payload
    const newMsg: EncryptedMessage = {
      id: msgId,
      sender: "You",
      encryptedText: encrypted,
      publicKeyFingerprint: publicKey ? publicKey.substring(0, 16) : "LION-PUB-256",
      timestamp: timeNow,
      vibeStatus: "AES-GCM-256 Sealed"
    };

    // Pre-seed decrypted map so the user doesn't have to decrypt their own sent message unless desired (we track true/false toggles)
    setDecryptedMap(prev => ({
      ...prev,
      [msgId]: true // Default user messages as decrypted so they can read what they sent
    }));

    setMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg]
    }));

    setInputText("");

    // Setup interactive automated response simulation
    const contactId = selectedContact.id;
    
    // Step 1: Status turns into 'typing...' after 800ms
    setTimeout(() => {
      setAgentStatuses(prev => ({
        ...prev,
        [contactId]: "typing..."
      }));
    }, 850);

    // Step 2: Receive replying ciphertext after 2.5s
    setTimeout(() => {
      const pool = SIMULATED_REPLIES[contactId] || ["Affirmative, handshake acknowledged."];
      const randomReply = pool[Math.floor(Math.random() * pool.length)];
      const encryptedResponse = encryptText(randomReply);
      const replyId = "reply-" + Date.now().toString();
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const replyMsg: EncryptedMessage = {
        id: replyId,
        sender: selectedContact.name,
        encryptedText: encryptedResponse,
        publicKeyFingerprint: selectedContact.fingerprint.replace("SHA-256 // ", ""),
        timestamp: replyTime,
        vibeStatus: "AES-GCM-256 Handshake Verified"
      };

      setDecryptedMap(prev => ({
        ...prev,
        [replyId]: false // Receive locked by default for secure cryptographic immersive vibe!
      }));

      setMessages(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), replyMsg]
      }));

      // Restore status to online
      setAgentStatuses(prev => ({
        ...prev,
        [contactId]: "online"
      }));

    }, 2800);
  };

  const toggleDecryption = (msgId: string) => {
    setDecryptedMap(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleClearChat = () => {
    setMessages(prev => ({
      ...prev,
      [selectedContact.id]: []
    }));
  };

  // Contacts Filtering
  const filteredContacts = CONTACTS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.fingerprint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="handshake-telegram-messenger" className="bg-[#0c0d12] border border-white/10 rounded-2xl flex flex-col xl:flex-row h-[720px] max-w-7xl mx-auto shadow-2xl overflow-hidden font-sans relative">
      
      {/* LEFT DRAWER / CONTACTS BAR (Telegram / WhatsApp Sidebar Style) */}
      <div className="w-full xl:w-96 border-r border-white/10 flex flex-col bg-[#0f111a] shrink-0 h-1/2 xl:h-full">
        
        {/* Workspace Security Banner */}
        <div className="p-4 bg-[#141724]/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-green-400 select-none">
              AES-256 ENCRYPTION TUNNEL
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-500 bg-white/5 rounded px-1.5 py-0.5 select-none">
            RSA-2048
          </span>
        </div>

        {/* Cryptokey Ledger Widget */}
        <div className="p-3.5 mx-3 mt-3 bg-[#171a2b] border border-white/10 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            <span className="flex items-center gap-1 font-mono">
              <Key size={11} className="text-indigo-400" /> my_key_ledger
            </span>
            {isGeneratingKeys ? (
              <RefreshCw size={10} className="animate-spin text-amber-500" />
            ) : (
              <button
                type="button"
                onClick={generateNewKeys}
                className="text-[9px] text-indigo-300 hover:text-white transition-colors cursor-pointer select-none font-mono"
              >
                [RECYCLE]
              </button>
            )}
          </div>

          <div className="text-[9px] font-mono select-none text-slate-400 leading-normal space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">PUB_KEY:</span>
              <span className="text-gray-300 tracking-tighter truncate max-w-[200px]" title={publicKey || "Generating..."}>
                {isGeneratingKeys ? "Recalculating entropy..." : publicKey || "LION-PUB-256-WAITING"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PRIV_KEY:</span>
              <span className="text-red-400 font-bold tracking-widest select-all uppercase">
                {isGeneratingKeys ? "••••••••" : "•••••••• encrypted"}
              </span>
            </div>
          </div>
        </div>

        {/* Telegram Chat Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, nodes, keys..."
              className="w-full bg-[#1b1f32] hover:bg-[#20253d] border border-transparent focus:border-white/10 text-xs text-white placeholder-slate-500 rounded-xl h-9 pl-9 pr-4 focus:outline-none focus:ring-0 transition-all font-mono"
            />
          </div>
        </div>

        {/* Contacts scrolling list in Telegram layout */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar scrollbar-thin">
          <div className="flex justify-between items-center px-2 py-1 text-[9px] uppercase tracking-widest text-slate-500 font-bold select-none">
            <span>Conversations</span>
            <span>{filteredContacts.length} Chats</span>
          </div>

          {filteredContacts.length === 0 ? (
            <p className="text-xs text-center text-slate-600 font-mono py-6">No matching secure nodes found.</p>
          ) : (
            filteredContacts.map((c) => {
              const active = selectedContact.id === c.id;
              const contactMessages = messages[c.id] || [];
              const lastMsg = contactMessages[contactMessages.length - 1];
              const isTyping = agentStatuses[c.id] === "typing...";
              
              // Resolve last message preview
              let previewText = "No previous frames";
              if (isTyping) {
                previewText = "typing...";
              } else if (lastMsg) {
                const isDecrypted = revealAll || decryptedMap[lastMsg.id];
                if (isDecrypted) {
                  previewText = lastMsg.id.startsWith("lh") || lastMsg.id.startsWith("cv")
                    ? (lastMsg.id === "lh1" ? "Incoming files verified." : "Database backup archived.")
                    : decryptText(lastMsg.encryptedText);
                } else {
                  previewText = lastMsg.encryptedText.substring(0, 24) + "... (Locked)";
                }
              }

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer border ${
                    active
                      ? "bg-[#2b5278]/25 border-[#2b5278]/40 hover:bg-[#2b5278]/35 text-white"
                      : "bg-transparent border-transparent text-slate-400 hover:bg-[#161a29]"
                  }`}
                >
                  {/* Circular Avatar with custom Gradient */}
                  <div className={`relative w-12 h-12 rounded-full bg-gradient-to-tr ${c.avatarBg} flex items-center justify-center text-xl shadow-md border border-white/5 select-none shrink-0`}>
                    <span>{c.avatar}</span>
                    {/* Status Pip */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0c0d12] ${
                      c.isOnline ? "bg-green-500" : "bg-slate-500"
                    }`} />
                  </div>

                  {/* Messaging Details */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5 select-none">
                      <p className={`text-xs font-semibold ${active ? "text-white" : "text-[#dfdfdf]"}`}>
                        {c.name}
                      </p>
                      <span className="text-[9px] text-gray-500 font-mono">
                        {lastMsg ? lastMsg.timestamp : ""}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className={`text-[11px] truncate select-none ${
                        isTyping ? "text-green-400 font-semibold italic animate-pulse" : "text-slate-400"
                      }`}>
                        {previewText}
                      </p>
                      
                      {contactMessages.length > 0 && (
                        <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/15 text-[8px] font-mono py-0.2 px-1 rounded uppercase">
                          E2EE
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Global Reveal Decoder widget */}
        <div className="p-3 border-t border-white/10 bg-[#0c0d12] flex items-center justify-between select-none shrink-0">
          <span className="text-[9px] text-[#888c9a] uppercase font-bold tracking-widest font-mono">
            Symmetric Reveal
          </span>
          <button
            onClick={() => setRevealAll(!revealAll)}
            className="px-3 py-1.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded-lg border border-white/10 hover:bg-white/5 text-[#c2c5d1] cursor-pointer flex items-center gap-1.5 transition-all"
            title="Symmetrically decrypt all client message streams"
          >
            {revealAll ? (
              <>
                <EyeOff size={11} className="text-amber-500" /> Lock All
              </>
            ) : (
              <>
                <LockKeyhole size={11} className="text-green-500" /> Reveal All
              </>
            )}
          </button>
        </div>

      </div>

      {/* RIGHT TELEGRAM MESSAGING ROOM AREA */}
      <div className="flex-1 flex flex-col bg-[#0c0d12] h-1/2 xl:h-full relative overflow-hidden">
        
        {/* Background grid canvas (representing Telegram cloud background) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(99,102,241,0.03),transparent_70%)] pointer-events-none" />

        {/* Interactive Chat Room Header */}
        <div className="px-5 py-3 border-b border-white/10 bg-[#121422] flex justify-between items-center shrink-0 relative z-10 select-none">
          <div className="flex items-center gap-3">
            {/* Round Avatar for header */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${selectedContact.avatarBg} flex items-center justify-center text-lg shadow-md border border-white/5`}>
              {selectedContact.avatar}
            </div>
            <div>
              <h4 className="font-serif italic text-white text-sm leading-none font-medium">
                {selectedContact.name}
              </h4>
              <p className={`text-[10px] uppercase font-mono mt-1 ${
                agentStatuses[selectedContact.id] === "typing..." ? "text-green-400 font-bold animate-pulse" : "text-[#7b819f]"
              }`}>
                {agentStatuses[selectedContact.id]}
              </p>
            </div>
          </div>

          {/* Action buttons mirroring Telegram layouts */}
          <div className="flex items-center gap-3 text-slate-400">
            <button className="hover:text-indigo-400 transition-colors cursor-pointer select-none" title="Start security voice downlink">
              <Phone size={15} />
            </button>
            <button className="hover:text-indigo-400 transition-colors cursor-pointer select-none" title="Configure camera matrix link">
              <Video size={16} />
            </button>
            <div className="w-px h-4 bg-slate-700/60" />
            <button 
              onClick={handleClearChat}
              className="hover:text-red-400 transition-colors cursor-pointer select-none" 
              title="Purge sector conversation logs"
            >
              <Trash2 size={15} />
            </button>
            <ShieldCheck size={16} className="text-indigo-400" title="AES-GCM-256 E2EE Secure Handshake Tunnel" />
          </div>
        </div>

        {/* Scrolling Chat stream with Telegram/WhatsApp dual bubble styles */}
        <div 
          ref={chatContainerRef} 
          className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar scrollbar-none relative z-10"
        >
          {/* Locked telemetry status info bubble */}
          <div className="flex justify-center select-none">
            <div className="bg-[#1f233b]/40 border border-[#434b75]/20 rounded-xl px-4 py-1.5 text-center text-[10px] text-slate-400 max-w-sm flex items-center gap-1.5 font-mono">
              <Lock size={10} className="text-[#a4add4]" />
              <span>Messages are client-end sealed. Click LOCK to toggle deciphering.</span>
            </div>
          </div>

          {(messages[selectedContact.id] || []).length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 text-gray-500 max-w-sm mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#131525] border border-white/5 flex items-center justify-center text-slate-500">
                <LockKeyhole size={20} />
              </div>
              <div className="space-y-1 select-none">
                <p className="font-semibold text-slate-300 text-sm">Communication Vault Cleared</p>
                <p className="text-[11px] text-[#717691] leading-relaxed">
                  Start typing in the text field below to initiate a secure encrypted handshake with <span className="text-indigo-400 font-bold">{selectedContact.name}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(messages[selectedContact.id] || []).map((m) => {
                const isMyMessage = m.sender === "You";
                const isDecrypted = revealAll || decryptedMap[m.id];
                
                // Resolve text
                let displayedBody = m.encryptedText;
                if (isDecrypted) {
                  displayedBody = (m.id === "lh1" ? "Incoming files verified. Proceed with LEO AI." : m.id === "cv1" ? "Database backup archived on block 10839." : decryptText(m.encryptedText));
                }

                return (
                  <div key={m.id} className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} space-y-0.5 group animate-fadeIn`}>
                    
                    {/* Username/Sender Header line */}
                    <div className="text-[9px] font-mono text-gray-500 px-1 select-none tracking-wider flex items-center gap-1">
                      <span>{m.sender}</span>
                      <span>•</span>
                      <span className="opacity-75">{isMyMessage ? "My client" : "Secure node"}</span>
                    </div>

                    {/* Telegram-Style Chat Bubble Grid */}
                    <div className="flex items-center gap-2 max-w-[85%] group">
                      
                      {/* Interactive lock button if outgoing on some, or incoming */}
                      {!isMyMessage && (
                        <button
                          onClick={() => toggleDecryption(m.id)}
                          className={`p-1.5 rounded-lg border flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-[9px] font-bold tracking-widest uppercase cursor-pointer select-none ${
                            isDecrypted
                              ? "bg-[#182a3c] border-[#2b5278]/40 text-[#5397d4] hover:text-white"
                              : "bg-[#161a29]/65 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                          title={isDecrypted ? "Seal message back to cipher blocks" : "Decrypt symmetrically back to plain text"}
                        >
                          {isDecrypted ? <Unlock size={12} /> : <Lock size={12} />}
                        </button>
                      )}

                      {/* Bubble with unique color based on Whatsapp green or Telegram blue styles */}
                      <div className={`p-3.5 rounded-2xl border flex flex-col relative transition-all duration-300 shadow-md ${
                        isMyMessage
                          ? "bg-[#2b5278] border-[#2b5278]/20 text-white rounded-tr-none" // Elegant Telegram Blue for our message
                          : isDecrypted
                          ? "bg-[#182533] border-[#2b5278]/20 text-[#dfdfdf] rounded-tl-none" // Incoming Decrypted: deep dark indigo-blue
                          : "bg-[#181a26] border-white/5 text-[#8c91b5] rounded-tl-none" // Incoming Encrypted: sleek metallic dark gray
                      }`}>
                        
                        {/* AES / RSA Seal Banner */}
                        <div className="flex items-center justify-between text-[8px] font-mono tracking-widest font-bold uppercase opacity-55 mb-1.5 select-none">
                          <span className="flex items-center gap-1">
                            <Zap size={9} className="text-[#59affe]" />
                            {m.vibeStatus}
                          </span>
                          <span>{m.publicKeyFingerprint}</span>
                        </div>

                        {/* Content text */}
                        {isDecrypted ? (
                          <p className="text-xs sm:text-sm font-sans leading-relaxed tracking-normal font-normal break-words whitespace-pre-wrap">
                            {displayedBody}
                          </p>
                        ) : (
                          <p className="text-xs font-mono tracking-normal break-all select-all opacity-85 text-[#72c1ff]/70 bg-black/25 px-2.5 py-1.5 rounded-lg border border-[#72c1ff]/10">
                            {displayedBody}
                          </p>
                        )}

                        {/* Message Status & Timestamp line wrapped into the bottom of bubble */}
                        <div className="flex items-center justify-end gap-1 select-none text-[8px] font-mono text-slate-400 mt-1.5 self-end opacity-70">
                          <span>{m.timestamp}</span>
                          {isMyMessage && (
                            <CheckCheck size={11} className="text-green-400" />
                          )}
                        </div>

                      </div>

                      {/* Decrypt button for internal sent message if they want to click it */}
                      {isMyMessage && (
                        <button
                          onClick={() => toggleDecryption(m.id)}
                          className={`p-1.5 rounded-lg border flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-[9px] font-bold tracking-widest uppercase cursor-pointer select-none ${
                            isDecrypted
                              ? "bg-[#182a3c] border-[#2b5278]/40 text-[#5397d4] hover:text-white"
                              : "bg-[#161a29]/65 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                          title="Lock / Decrypt Sent Cipher"
                        >
                          {isDecrypted ? <Unlock size={12} /> : <Lock size={12} />}
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}

              {/* Dynamic simulated typewriter loading dot element */}
              {agentStatuses[selectedContact.id] === "typing..." && (
                <div className="flex flex-col items-start space-y-0.5 animate-pulse select-none">
                  <div className="text-[9px] font-mono text-[#777] px-1 font-bold">
                    {selectedContact.name} is preparing cipher response...
                  </div>
                  <div className="bg-[#181a26] border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 max-w-xs shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Telegram/WhatsApp Style Input and Attachment Tray bar */}
        <div className="p-3 bg-[#111322] border-t border-white/10 shrink-0 flex items-center gap-2 z-10">
          
          {/* Attachment Paperclip button */}
          <button 
            type="button"
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer select-none"
            title="Attach cryptographic files"
          >
            <Paperclip size={16} />
          </button>

          {/* Smiley shortcut */}
          <button 
            type="button"
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer select-none"
            title="Emoji drawer shortcut"
          >
            <Smile size={17} />
          </button>

          {/* Core Chat text input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder={`Send secure message to @${selectedContact.id}...`}
              className="w-full bg-[#171a2d] hover:bg-[#1c2037] focus:bg-[#1c2037] border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-0 rounded-xl h-11 px-4 text-xs font-mono text-white placeholder-slate-500 transition-all"
            />
          </div>

          {/* Rounded Telegram Blue / WhatsApp Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-full bg-[#2b5278] hover:bg-[#34628e] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer disabled:bg-[#1a1c22] disabled:text-slate-600 disabled:cursor-not-allowed select-none shrink-0"
            title="Symmetrically secure and transmit package"
          >
            <Send size={15} />
          </button>

        </div>

      </div>

    </div>
  );
}
