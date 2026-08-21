import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageSquare, Users, History, Filter, Search, Plus, X, ArrowRightLeft,
  ChevronDown, ExternalLink, Send, Clock, BadgeCheck, AlertCircle, RefreshCw,
  Check, Info, Trash2, Pencil, Smile, PlusCircle, MinusCircle, Tag, ArrowLeft, ArrowUpDown, Gem, Shield
} from "lucide-react";
import { Yl, Hl } from "../data";
import { Unit, SignValue, TradeOfferItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface DiscordUser {
  id: number;
  name: string;
  displayName: string;
  avatar: string;
  email?: string;
  discordId?: string;
}

interface CounterOffer {
  id: string;
  userId: number;
  displayName: string;
  avatar: string;
  discordId?: string;
  offerText: string;
  createdAt: string;
}

interface Trade {
  id: string;
  userId: number;
  username: string;
  displayName: string;
  avatar: string;
  robloxId?: number;
  robloxUsername?: string;
  robloxDisplayName?: string;
  robloxAvatar?: string;
  yourOffer: TradeOfferItem[];
  yourGems: number;
  theirOffer: TradeOfferItem[];
  theirGems: number;
  createdAt: string;
  isDiscord?: boolean;
  isStaff?: boolean;
  discordId?: string;
  counterOffers?: CounterOffer[];
}

interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  text: string;
  createdAt: string;
  edited?: boolean;
  reactions?: Record<string, string[]>;
}

interface Chat {
  id: string;
  userA: { id: number; name: string; displayName: string; avatar: string; discordId?: string };
  userB: { id: number; name: string; displayName: string; avatar: string; discordId?: string };
  messages: ChatMessage[];
}

// Admin list is determined dynamically by email on the backend

const rarityClasses: Record<string, { bg: string; text: string; shadow: string; border: string; activeBorder: string; hoverBg: string; hoverText: string; accentGlow: string }> = {
  All: { bg: "bg-blue-600/5", text: "text-white", shadow: "shadow-sm", border: "border-blue-500/25", activeBorder: "border-blue-500/50", hoverBg: "hover:bg-blue-600/10", hoverText: "hover:text-blue-300", accentGlow: "rgba(37,99,235,0.4)" },
  Basic: { bg: "bg-zinc-500/5", text: "text-zinc-400", shadow: "shadow-sm", border: "border-zinc-500/25", activeBorder: "border-zinc-400/50", hoverBg: "hover:bg-zinc-600/10", hoverText: "hover:text-zinc-300", accentGlow: "rgba(113,113,122,0.2)" },
  Uncommon: { bg: "bg-emerald-600/5", text: "text-emerald-400", shadow: "shadow-sm", border: "border-emerald-500/25", activeBorder: "border-emerald-500/50", hoverBg: "hover:bg-emerald-600/10", hoverText: "hover:text-emerald-300", accentGlow: "rgba(16,185,129,0.4)" },
  Rare: { bg: "bg-sky-600/5", text: "text-sky-400", shadow: "shadow-sm", border: "border-sky-500/25", activeBorder: "border-sky-500/50", hoverBg: "hover:bg-sky-500/10", hoverText: "hover:text-sky-300", accentGlow: "rgba(14,165,233,0.4)" },
  Epic: { bg: "bg-purple-600/5", text: "text-purple-400", shadow: "shadow-sm", border: "border-purple-500/25", activeBorder: "border-purple-500/50", hoverBg: "hover:bg-purple-600/10", hoverText: "hover:text-purple-300", accentGlow: "rgba(147,51,234,0.45)" },
  Legendary: { bg: "bg-amber-500/5", text: "text-amber-400", shadow: "shadow-sm", border: "border-amber-500/25", activeBorder: "border-amber-500/50", hoverBg: "hover:bg-amber-500/10", hoverText: "hover:text-amber-300", accentGlow: "rgba(245,158,11,0.5)" },
  Mythic: { bg: "bg-rose-600/5", text: "text-rose-400", shadow: "shadow-sm", border: "border-rose-500/25", activeBorder: "border-rose-500/50", hoverBg: "hover:bg-rose-600/10", hoverText: "hover:text-rose-300", accentGlow: "rgba(225,29,72,0.6)" },
  Exclusive: { bg: "bg-white/5", text: "text-white", shadow: "shadow-sm", border: "border-indigo-500/25", activeBorder: "border-indigo-500/50", hoverBg: "hover:bg-white/10", hoverText: "hover:text-indigo-300", accentGlow: "rgba(79,70,229,0.6)" },
  Godly: { bg: "bg-cyan-600/5", text: "text-cyan-400", shadow: "shadow-sm", border: "border-cyan-500/25", activeBorder: "border-cyan-500/60", hoverBg: "hover:bg-cyan-600/10", hoverText: "hover:text-cyan-300", accentGlow: "rgba(6,182,212,0.7)" },
  Crate: { bg: "bg-zinc-650/5", text: "text-zinc-400", shadow: "shadow-sm", border: "border-zinc-500/25", activeBorder: "border-zinc-500/50", hoverBg: "hover:bg-zinc-600/10", hoverText: "hover:text-zinc-300", accentGlow: "rgba(113,113,122,0.3)" }
};

const rarityTabs = ["All", "Basic", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Exclusive", "Crate"];

const renderCounterOfferText = (text: string) => {
  if (text.startsWith("[STRUCT_COUNTER]")) {
    try {
      const payload = JSON.parse(text.substring("[STRUCT_COUNTER]\n".length));
      return (
        <div className="flex flex-col gap-2 mt-2 bg-black/45 border border-white/5 p-3 rounded-2xl text-left w-full relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Offer */}
            <div className="bg-[#18181b]/40 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[9px] font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5 leading-none pb-1.5 border-b border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
                <span>THEY OFFER</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {payload.yourGems > 0 && (
                  <div className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg w-max flex items-center gap-1 font-mono">
                    💎 {payload.yourGems.toLocaleString()}
                  </div>
                )}
                {payload.yourOffer && payload.yourOffer.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-200 bg-[#181a26]/40 rounded-lg p-1 pr-2 border border-white/[0.03]">
                    <div className="w-5 h-5 shrink-0 overflow-hidden rounded bg-black/30"><img src={item.unit?.img} className="w-full h-full object-contain scale-110" alt="" /></div>
                    <span className="font-mono font-black text-white text-[9px] bg-white/10 px-1 rounded shrink-0">{item.qty}x</span>
                    <span className="truncate max-w-[80px] font-semibold">{item.unit?.name}</span>
                  </div>
                ))}
                {payload.yourGems === 0 && (!payload.yourOffer || payload.yourOffer.length === 0) && (
                  <span className="text-[10px] text-zinc-500 italic">None</span>
                )}
              </div>
            </div>

            {/* Request */}
            <div className="bg-[#18181b]/40 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[9px] font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5 leading-none pb-1.5 border-b border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
                <span>THEY WANT</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {payload.theirGems > 0 && (
                  <div className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg w-max flex items-center gap-1 font-mono">
                    💎 {payload.theirGems.toLocaleString()}
                  </div>
                )}
                {payload.theirOffer && payload.theirOffer.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-200 bg-[#181a26]/40 rounded-lg p-1 pr-2 border border-white/[0.03]">
                    <div className="w-5 h-5 shrink-0 overflow-hidden rounded bg-black/30"><img src={item.unit?.img} className="w-full h-full object-contain scale-110" alt="" /></div>
                    <span className="font-mono font-black text-zinc-300 text-[9px] bg-white/10 px-1 rounded shrink-0">{item.qty}x</span>
                    <span className="truncate max-w-[80px] font-semibold">{item.unit?.name}</span>
                  </div>
                ))}
                {payload.theirGems === 0 && (!payload.theirOffer || payload.theirOffer.length === 0) && (
                  <span className="text-[10px] text-zinc-500 italic">None</span>
                )}
              </div>
            </div>
          </div>

          {payload.note && (
            <div className="text-[10px] text-slate-400 bg-white/[0.01] border border-white/5 rounded-lg px-2.5 py-1.5 italic mt-1">
              Note: "{payload.note}"
            </div>
          )}
        </div>
      );
    } catch (e) {
      console.error("Error parsing structural counter offer:", e);
    }
  }

  let offer = "";
  let request = "";

  if (text.includes("->")) {
    const parts = text.split("->");
    offer = parts[0].trim();
    request = parts[1].trim();
  } else if (text.includes(" for ")) {
    const parts = text.split(" for ");
    offer = parts[0].trim();
    request = parts[1].trim();
  } else if (text.includes(":")) {
    const parts = text.split(":");
    offer = parts[0].trim();
    request = parts[1].trim();
  }

  if (offer && request) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 bg-black/40 border border-white/5 p-2.5 rounded-xl text-left w-full">
        <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-lg p-2 text-center">
          <span className="block text-[8px] font-black tracking-wider text-zinc-400 uppercase mb-0.5">THEY OFFER</span>
          <span className="text-xs font-extrabold text-white">{offer}</span>
        </div>
        <div className="flex items-center justify-center shrink-0">
          <ArrowRightLeft className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-lg p-2 text-center">
          <span className="block text-[8px] font-black tracking-wider text-zinc-400 uppercase mb-0.5">THEY WANT</span>
          <span className="text-xs font-extrabold text-white">{request}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[11px] text-slate-300 mt-1.5 break-words bg-black/25 border border-white/5 px-3 py-2 rounded-xl text-left w-full">
      {text}
    </div>
  );
};

export default function CommunityTrades({ units: propUnits, signatures: propSignatures }: { units?: Unit[]; signatures?: SignValue[] }) {
  const units = propUnits || Yl;
  const signatures = propSignatures || Hl;
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try { return localStorage.getItem("lttd_rb_session") || null; } catch { return null; }
  });

  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isChatsPanelOpen, setIsChatsPanelOpen] = useState(false);
  const [isAdminChatsMode, setIsAdminChatsMode] = useState(false);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showDemoInput, setShowDemoInput] = useState(false);
  const [demoUsername, setDemoUsername] = useState("");
  const [demoError, setDemoError] = useState("");
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUsername.trim()) {
      setDemoError("Пожалуйста, введите имя пользователя.");
      return;
    }
    setDemoError("");
    setIsDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: demoUsername.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessionToken(data.sessionToken);
        localStorage.setItem("lttd_rb_session", data.sessionToken);
        setDiscordUser(data.user);
        setIsLoginModalOpen(false);
        setDemoUsername("");
      } else {
        setDemoError(data.error || "Не удалось выполнить вход.");
      }
    } catch (err) {
      setDemoError("Ошибка сети при входе.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  
  const [chatMessageText, setChatMessageText] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [activeMsgToolbarId, setActiveMsgToolbarId] = useState<string | null>(null);
  
  // Report states
  const [reportingMessage, setReportingMessage] = useState<any | null>(null);
  const [reportingChat, setReportingChat] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [customReportReason, setCustomReportReason] = useState("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOfferingGems, setFilterOfferingGems] = useState(false);
  const [filterLookingForGems, setFilterLookingForGems] = useState(false);
  const [rarityFilter, setRarityFilter] = useState("All");
  const [isRarityDropdownOpen, setIsRarityDropdownOpen] = useState(false);

  // Add Trade Form State
  const [yourOfferGems, setYourOfferGems] = useState<number>(0);
  const [theirOfferGems, setTheirOfferGems] = useState<number>(0);
  const [yourOfferItems, setYourOfferItems] = useState<TradeOfferItem[]>([]);
  const [theirOfferItems, setTheirOfferItems] = useState<TradeOfferItem[]>([]);
  const [isGemsConfigOpen, setIsGemsConfigOpen] = useState(false);
  const [gemsModalSide, setGemsModalSide] = useState<"your" | "their" | null>(null);
  const [gemsInputValue, setGemsInputValue] = useState("");

  // Chat Proposal Form State
  const [isDMProposalOpen, setIsDMProposalOpen] = useState(false);
  const [dmYourOfferGems, setDmYourOfferGems] = useState<number>(0);
  const [dmTheirOfferGems, setDmTheirOfferGems] = useState<number>(0);
  const [dmYourOfferItems, setDmYourOfferItems] = useState<TradeOfferItem[]>([]);
  const [dmTheirOfferItems, setDmTheirOfferItems] = useState<TradeOfferItem[]>([]);
  const [dmCustomNote, setDmCustomNote] = useState("");
  
  // Interactive Counter Offer State
  const [isCounterOfferModalOpen, setIsCounterOfferModalOpen] = useState(false);
  const [counterOfferTradeId, setCounterOfferTradeId] = useState<string | null>(null);
  const [coYourOfferGems, setCoYourOfferGems] = useState<number>(0);
  const [coTheirOfferGems, setCoTheirOfferGems] = useState<number>(0);
  const [coYourOfferItems, setCoYourOfferItems] = useState<TradeOfferItem[]>([]);
  const [coTheirOfferItems, setCoTheirOfferItems] = useState<TradeOfferItem[]>([]);
  const [coCustomNote, setCoCustomNote] = useState("");
  const [collapsedCounterOffers, setCollapsedCounterOffers] = useState<Record<string, boolean>>({});

  const [pickerContext, setPickerContext] = useState<"create-trade" | "dm-proposal" | "counter-offer">("create-trade");

  // Unit picker states
  const [unitPickerSide, setUnitPickerSide] = useState<"your" | "their" | null>(null);
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const [pickerRarityFilter, setPickerRarityFilter] = useState("All");
  
  // Selected unit config states
  const [pickerSelectedUnit, setPickerSelectedUnit] = useState<Unit | null>(null);
  const [pickerSelectedSign, setPickerSelectedSign] = useState<SignValue>(signatures.find(s => s.name === "None") || signatures[0]);
  const [pickerSelectedQty, setPickerSelectedQty] = useState<number | "">(1);
  const [isConfigureUnitOpen, setIsConfigureUnitOpen] = useState(false);
  const [isPickerSignDropdownOpen, setIsPickerSignDropdownOpen] = useState(false);

  const filteredPickerUnits = React.useMemo(() => {
    const getRarityIndex = (rarity: string): number => {
      const r = (rarity || "").toLowerCase();
      if (r === "basic" || r === "common") return 1;
      if (r === "uncommon") return 2;
      if (r === "rare") return 3;
      if (r === "epic") return 4;
      if (r === "legendary") return 5;
      if (r === "mythic") return 6;
      if (r === "exclusive") return 7;
      if (r === "godly") return 8;
      if (r === "crate") return 9;
      return 10;
    };

    const list = units.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(pickerSearchQuery.toLowerCase());
      const matchesRarity = pickerRarityFilter === "All" || u.rarity === pickerRarityFilter;
      return matchesSearch && matchesRarity;
    });

    return [...list].sort((a, b) => {
      const rA = getRarityIndex(a.rarity);
      const rB = getRarityIndex(b.rarity);
      if (rA !== rB) return rA - rB;
      const valA = a.gems === -1 ? Infinity : a.gems;
      const valB = b.gems === -1 ? Infinity : b.gems;
      return valA - valB;
    });
  }, [pickerSearchQuery, pickerRarityFilter, units]);

  const isUserAdmin = discordUser ? !!discordUser.isAdmin : false;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const prevChatIdRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const fetchSession = async (token: string) => {
    try {
      const res = await fetch("/api/roblox/session-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setDiscordUser(data.user);
        } else {
          setDiscordUser(null);
          setSessionToken(null);
          localStorage.removeItem("lttd_rb_session");
        }
      }
    } catch {}
  };

  const fetchTrades = async () => {
    try {
      const res = await fetch("/api/trades");
      if (res.ok) {
        const data = await res.json();
        setActiveTrades((data.trades || []).map((t: any) => ({
          ...t,
          userId: t.userId || t.robloxId,
          username: t.username || t.robloxUsername,
          displayName: t.displayName || t.robloxDisplayName,
          avatar: t.avatar || t.robloxAvatar,
          isStaff: t.isStaff,
          discordId: t.discordId
        })));
      }
    } catch {}
  };

  const fetchChats = async () => {
    if (!sessionToken) return;
    try {
      const endpoint = isAdminChatsMode ? "/api/chats/admin" : "/api/chats";
      const res = await fetch(endpoint, {
        headers: { "Authorization": sessionToken }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sessionToken) {
      fetchSession(sessionToken);
      fetchChats();
      const interval = setInterval(fetchChats, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionToken, isAdminChatsMode]);

  // Scroll to bottom of chat when messages change (smart scrolling)
  useEffect(() => {
    const container = chatScrollContainerRef.current;
    if (!container) return;

    const currentChat = chats.find(c => c.id === currentChatId);
    const messagesLength = currentChat ? currentChat.messages.length : 0;

    const chatChanged = currentChatId !== prevChatIdRef.current;
    const newMessagesAdded = messagesLength > prevMessagesLengthRef.current;

    if (chatChanged) {
      // Force scroll to bottom on chat switch
      setTimeout(() => {
        if (chatScrollContainerRef.current) {
          chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
        }
      }, 50);
    } else if (newMessagesAdded) {
      // Only scroll if they were already near the bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      const lastMsg = currentChat?.messages[messagesLength - 1];
      const isOwnMessage = lastMsg && String(lastMsg.senderId) === String(discordUser?.id);

      if (isNearBottom || isOwnMessage) {
        setTimeout(() => {
          if (chatScrollContainerRef.current) {
            chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
          }
        }, 50);
      }
    }

    prevChatIdRef.current = currentChatId;
    prevMessagesLengthRef.current = messagesLength;
  }, [currentChatId, chats, discordUser]);

  // Lock body scroll when overlay panels are active to prevent mobile scrolling blowout
  useEffect(() => {
    const isAnyPanelOpen = isChatsPanelOpen || isAddTradeModalOpen || isDMProposalOpen || isCounterOfferModalOpen || isLoginModalOpen || (unitPickerSide !== null) || isGemsConfigOpen;
    if (isAnyPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatsPanelOpen, isAddTradeModalOpen, isDMProposalOpen, isCounterOfferModalOpen, isLoginModalOpen, unitPickerSide, isGemsConfigOpen]);

  const startChat = async (trade: Trade) => {
    if (!discordUser) {
      setIsLoginModalOpen(true);
      return;
    }
    const tUserId = trade.userId || trade.robloxId;
    if (String(tUserId) === String(discordUser.id)) return;
    try {
      const res = await fetch("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          recipientId: tUserId,
          recipientName: trade.username || trade.robloxUsername,
          recipientDisplayName: trade.displayName || trade.robloxDisplayName,
          recipientAvatar: trade.avatar || trade.robloxAvatar,
          recipientDiscordId: trade.discordId,
        })
      });
      if (res.ok) {
        const data = await res.json();
        fetchChats();
        setCurrentChatId(data.chat.id);
        setIsChatsPanelOpen(true);
      }
    } catch {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim() || !currentChatId) return;
    const text = chatMessageText.trim();
    setChatError(null);
    
    if (editingMessageId) {
      try {
        const res = await fetch(`/api/chats/${currentChatId}/messages/${editingMessageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken, text })
        });
        if (res.ok) {
          fetchChats();
          setEditingMessageId(null);
          setChatMessageText("");
        } else {
          const errData = await res.json();
          setChatError(errData.error || "Failed to edit message");
        }
      } catch {
        setChatError("Connection error. Try again!");
      }
    } else {
      const chat = chats.find(c => c.id === currentChatId);
      if (!chat) return;
      const recipient = chat.userA.id === discordUser?.id ? chat.userB : chat.userA;
      try {
        const res = await fetch("/api/chats/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientDisplayName: recipient.displayName,
            recipientAvatar: recipient.avatar,
            recipientDiscordId: recipient.discordId,
            text
          })
        });
        if (res.ok) {
          fetchChats();
          setChatMessageText("");
        } else {
          const errData = await res.json();
          setChatError(errData.error || "Failed to send message");
        }
      } catch {
        setChatError("Connection error. Try again!");
      }
    }
  };

  const handleSendTradeProposal = async () => {
    if (!currentChatId || !discordUser) return;
    
    // Validate we have something
    const hasItems = dmYourOfferItems.length > 0 || dmTheirOfferItems.length > 0;
    const hasGems = dmYourOfferGems > 0 || dmTheirOfferGems > 0;
    if (!hasItems && !hasGems) {
      alert("Please add at least one unit or some gems to send a trade proposal!");
      return;
    }

    const proposalPayload = {
      yourGems: dmYourOfferGems,
      yourOffer: dmYourOfferItems,
      theirGems: dmTheirOfferGems,
      theirOffer: dmTheirOfferItems,
      note: dmCustomNote.trim() || "Let's do this trade!",
      status: "pending" as "pending" | "accepted" | "declined"
    };

    const text = `[TRADE_OFFER]
${JSON.stringify(proposalPayload)}`;
    setChatError(null);

    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    const recipient = chat.userA.id === discordUser?.id ? chat.userB : chat.userA;
    try {
      const url = editingMessageId 
        ? `/api/chats/${currentChatId}/messages/${editingMessageId}`
        : "/api/chats/send";
      const method = editingMessageId ? "PUT" : "POST";
      const body = editingMessageId 
        ? JSON.stringify({ sessionToken, text })
        : JSON.stringify({
            sessionToken,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientDisplayName: recipient.displayName,
            recipientAvatar: recipient.avatar,
            recipientDiscordId: recipient.discordId,
            text
          });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body
      });
      if (res.ok) {
        fetchChats();
        // Clear proposal state
        setDmYourOfferItems([]);
        setDmTheirOfferItems([]);
        setDmYourOfferGems(0);
        setDmTheirOfferGems(0);
        setDmCustomNote("");
        setEditingMessageId(null);
        setIsDMProposalOpen(false);
      } else {
        const errData = await res.json();
        setChatError(errData.error || (editingMessageId ? "Failed to edit trade proposal" : "Failed to send trade proposal"));
      }
    } catch {
      setChatError("Connection error. Try again!");
    }
  };

  const handleUpdateTradeProposalStatus = async (messageId: string, status: "accepted" | "declined") => {
    if (!currentChatId || !discordUser) return;
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    const msg = chat.messages.find(m => m.id === messageId);
    if (!msg) return;

    try {
      const parts = msg.text.split("\n");
      if (parts[0] !== "[TRADE_OFFER]") return;
      const payload = JSON.parse(parts.slice(1).join("\n"));
      payload.status = status;

      const updatedText = `[TRADE_OFFER]
${JSON.stringify(payload)}`;

      // Edit the trade proposal message on the server
      const res = await fetch(`/api/chats/${currentChatId}/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, text: updatedText })
      });

      if (res.ok) {
        fetchChats();
        
        // Post a notification message about the accept/decline action
        const recipient = chat.userA.id === discordUser?.id ? chat.userB : chat.userA;
        const alertText = status === "accepted" 
          ? "🤝 I have accepted your trade proposal! Let's arrange a time to trade in-game."
          : "❌ I have declined your trade proposal.";

        await fetch("/api/chats/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientDisplayName: recipient.displayName,
            recipientAvatar: recipient.avatar,
            recipientDiscordId: recipient.discordId,
            text: alertText
          })
        });
        fetchChats();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update trade proposal status.");
      }
    } catch (e) {
      console.error(e);
      alert("Error processing trade proposal status update.");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!currentChatId) return;
    try {
      await fetch(`/api/chats/${currentChatId}/messages/${msgId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken })
      });
      fetchChats();
    } catch {}
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!currentChatId) return;
    try {
      await fetch(`/api/chats/${currentChatId}/messages/${msgId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, emoji })
      });
      fetchChats();
      setShowReactionsFor(null);
    } catch {}
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/discord/oauth-start");
      const data = await res.json();
      if (data.authUrl && data.state) {
        const win = window.open(data.authUrl, "_blank");

        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/discord/oauth-poll?state=${data.state}`);
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.completed && pollData.sessionToken) {
                clearInterval(pollInterval);
                setSessionToken(pollData.sessionToken);
                localStorage.setItem("lttd_rb_session", pollData.sessionToken);
                setDiscordUser(pollData.user);
                setIsLoginModalOpen(false);
                if (win && !win.closed) {
                  try { win.close(); } catch(e){}
                }
              }
            }
          } catch {}
        }, 700);
        
        const handler = (e: MessageEvent) => {
          if (e.data.type === "OAUTH_AUTH_SUCCESS") {
            const token = e.data.sessionToken;
            setSessionToken(token);
            localStorage.setItem("lttd_rb_session", token);
            setIsLoginModalOpen(false);
            window.removeEventListener("message", handler);
            clearInterval(pollInterval);
            if (win && !win.closed) {
              try { win.close(); } catch(e){}
            }
          }
        };
        window.addEventListener("message", handler);

        setTimeout(() => {
          clearInterval(pollInterval);
          window.removeEventListener("message", handler);
        }, 180000);
      } else if (data.error) {
        console.warn("Discord OAuth Configuration Error:", data.error);
      }
    } catch (e) {
      console.error("Discord OAuth start failed:", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lttd_rb_session");
    setSessionToken(null);
    setDiscordUser(null);
    setCurrentChatId(null);
    setIsChatsPanelOpen(false);
  };

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordUser) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          yourOffer: yourOfferItems,
          yourGems: yourOfferGems,
          theirOffer: theirOfferItems,
          theirGems: theirOfferGems
        })
      });
      if (res.ok) {
        fetchTrades();
        setIsAddTradeModalOpen(false);
        // Reset states
        setYourOfferItems([]);
        setTheirOfferItems([]);
        setYourOfferGems(0);
        setTheirOfferGems(0);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create trade listing.");
      }
    } catch (err) {
      console.error("Error creating trade listing", err);
    }
  };

  const handleConfirmGems = () => {
    const gems = Math.max(0, parseInt(gemsInputValue) || 0);
    if (pickerContext === "dm-proposal") {
      if (gemsModalSide === "your") {
        setDmYourOfferGems(gems);
      } else if (gemsModalSide === "their") {
        setDmTheirOfferGems(gems);
      }
    } else if (pickerContext === "counter-offer") {
      if (gemsModalSide === "your") {
        setCoYourOfferGems(gems);
      } else if (gemsModalSide === "their") {
        setCoTheirOfferGems(gems);
      }
    } else {
      if (gemsModalSide === "your") {
        setYourOfferGems(gems);
      } else if (gemsModalSide === "their") {
        setTheirOfferGems(gems);
      }
    }
    setIsGemsConfigOpen(false);
  };

  const handleSendStructuredCounterOffer = async (tradeId: string) => {
    if (!discordUser) {
      setIsLoginModalOpen(true);
      return;
    }
    
    // Check if empty
    const hasItems = coYourOfferItems.length > 0 || coTheirOfferItems.length > 0;
    const hasGems = coYourOfferGems > 0 || coTheirOfferGems > 0;
    if (!hasItems && !hasGems) {
      alert("Please add at least one unit or some gems to make a counter offer!");
      return;
    }

    const payload = {
      yourGems: coYourOfferGems,
      yourOffer: coYourOfferItems,
      theirGems: coTheirOfferGems,
      theirOffer: coTheirOfferItems,
      note: coCustomNote.trim()
    };

    const text = `[STRUCT_COUNTER]
${JSON.stringify(payload)}`;

    try {
      const res = await fetch(`/api/trades/${tradeId}/counter`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": sessionToken || ""
        },
        body: JSON.stringify({ offerText: text })
      });
      if (res.ok) {
        // Clear co states
        setCoYourOfferItems([]);
        setCoTheirOfferItems([]);
        setCoYourOfferGems(0);
        setCoTheirOfferGems(0);
        setCoCustomNote("");
        setIsCounterOfferModalOpen(false);
        setCounterOfferTradeId(null);
        fetchTrades();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to submit counter offer.");
      }
    } catch (err) {
      console.error("Error adding structural counter offer", err);
      alert("Network error. Try again!");
    }
  };



  const handleDeleteCounterOffer = async (tradeId: string, counterId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/counter/${counterId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": sessionToken || ""
        }
      });
      if (res.ok) {
        fetchTrades();
      } else {
        const data = await res.json();
        console.error(data.error || "Failed to delete counter offer.");
      }
    } catch (err) {
      console.error("Error deleting counter offer", err);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}?sessionToken=${sessionToken}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": sessionToken || ""
        },
        body: JSON.stringify({ sessionToken })
      });
      if (res.ok) {
        fetchTrades();
      } else {
        const data = await res.json();
        console.error(data.error || "Failed to delete trade.");
      }
    } catch (err) {
      console.error("Error deleting trade", err);
    }
  };

  const handleInitiateReport = (msg: any, chat: any) => {
    setReportingMessage(msg);
    setReportingChat(chat);
    setReportReason("");
    setCustomReportReason("");
  };

  const handleSubmitReport = async () => {
    if (!reportingMessage || !reportingChat) return;
    
    const finalReason = reportReason === "Other" ? customReportReason : reportReason;
    if (!finalReason || !finalReason.trim()) {
      alert("Please select or enter a reason for the report.");
      return;
    }

    const reportedUserId = reportingMessage.senderId;
    const reportedUserName = reportingMessage.senderName;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": sessionToken || ""
        },
        body: JSON.stringify({
          chatId: reportingChat.id,
          messageId: reportingMessage.id,
          messageText: reportingMessage.text,
          reportedUserId,
          reportedUserName,
          reason: finalReason
        })
      });

      if (res.ok) {
        alert("The report has been successfully submitted to the Admin Panel. Thank you for making our community safe.");
        setReportingMessage(null);
        setReportingChat(null);
        setReportReason("");
        setCustomReportReason("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit report.");
      }
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Network error. Please try again.");
    }
  };

  const currentChat = chats.find(c => c.id === currentChatId);

  // Filter Trades
  const filteredTrades = useMemo(() => {
    return activeTrades.filter(trade => {
      // Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const tUsername = (trade.username || trade.robloxUsername || "").toLowerCase();
        const tDisplayName = (trade.displayName || trade.robloxDisplayName || "").toLowerCase();
        const matchUser = tUsername.includes(query) || tDisplayName.includes(query);
        const matchYourUnits = trade.yourOffer.some(item => item.unit?.name?.toLowerCase().includes(query));
        const matchTheirUnits = trade.theirOffer.some(item => item.unit?.name?.toLowerCase().includes(query));
        if (!matchUser && !matchYourUnits && !matchTheirUnits) return false;
      }

      // Gems Filters
      if (filterOfferingGems && trade.yourGems === 0) return false;
      if (filterLookingForGems && trade.theirGems === 0) return false;

      // Rarity Filter
      if (rarityFilter !== "All") {
        const matchYourRarity = trade.yourOffer.some(item => item.unit?.rarity === rarityFilter);
        const matchTheirRarity = trade.theirOffer.some(item => item.unit?.rarity === rarityFilter);
        if (!matchYourRarity && !matchTheirRarity) return false;
      }

      return true;
    });
  }, [activeTrades, searchQuery, filterOfferingGems, filterLookingForGems, rarityFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto font-sans min-h-screen p-4 pb-20 bg-[#09090b] text-zinc-300">
      
      {/* 1. Header Banner Redesigned (To match Screenshot 1) */}
      <div className="bg-[#09090b]/95 border border-white/5 p-4 md:p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              ROBLOX COMMUNITY TRADES 
              <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-zinc-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">LIVE</span>
            </h1>
            <p className="text-[10px] tracking-widest font-mono text-slate-400 uppercase mt-0.5">
              CONNECT OFFICIAL ROBLOX ACCOUNT & POST LIVE TRADE LISTINGS
            </p>
          </div>
        </div>
        
        {discordUser ? (
          <div className="flex flex-wrap items-center gap-3">
            {/* User Profile Info Card */}
            <div className="flex items-center gap-3 bg-[#13141d] border border-white/5 p-1.5 pr-4 rounded-full relative shadow-inner">
              <div className="relative">
                <img src={discordUser.avatar} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(discordUser.displayName || discordUser.name || 'User')}&background=18181b&color=fff`; }} className="w-9 h-9 rounded-full bg-black/40 border border-white/10 shrink-0 object-cover" alt="" referrerPolicy="no-referrer" />
                {/* Green badge with checkmark inside */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-[#23a55a] rounded-full border-2 border-[#13141d] flex items-center justify-center shadow">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm font-black text-white leading-tight">{discordUser.displayName}</div>
                <div className="text-[10px] font-mono text-zinc-300 leading-tight">@{discordUser.name}</div>
              </div>
            </div>

            {/* CHATS Toggle Button */}
            <button 
              onClick={() => setIsChatsPanelOpen(!isChatsPanelOpen)} 
              className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer border ${isChatsPanelOpen ? 'bg-white/10 border-white/20 text-white shadow-md' : 'bg-[#181924] border-white/5 text-white hover:bg-[#202230]'}`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>CHATS</span>
              {chats.length > 0 && (
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">{chats.length}</span>
              )}
            </button>

            {isUserAdmin && (
              <button 
                onClick={() => setIsAdminChatsMode(!isAdminChatsMode)} 
                className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer border ${isAdminChatsMode ? 'bg-white/10 border-white/20 text-white shadow-md' : 'bg-[#181924] border-white/5 text-amber-500 hover:bg-[#202230]'}`}
                title="Toggle Admin Mode to view all user chats"
              >
                <span>ADMIN</span>
                <span className={`w-2 h-2 rounded-full ${isAdminChatsMode ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
              </button>
            )}

            {/* + LIST TRADE Button */}
            <button 
              onClick={() => {
                setPickerContext("create-trade");
                setIsAddTradeModalOpen(true);
              }} 
              className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-none"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>LIST TRADE</span>
            </button>
            
            {/* Logout Icon Button */}
            <button 
              onClick={handleLogout} 
              className="bg-[#13141d] hover:bg-[#1a1b27] text-slate-400 hover:text-white p-2.5 rounded-full border border-white/5 transition cursor-pointer" 
              title="Logout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsLoginModalOpen(true)} 
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg shadow-[#5865F2]/20"
          >
            <span>Login with Discord</span>
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>

      {/* 2. Main Content Feed Panel */}
      <div className="w-full">
        
        {/* LIVE LISTINGS FEED (Always full width for pristine clean layout) */}
        <div className="flex flex-col gap-5 w-full">
          
          {/* Listings Controls Panel */}
          <div className="bg-[#09090b] border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  LIVE LISTINGS (CURRENT TRADES)
                </h3>
                <p className="text-xs text-slate-500">Real-time Roblox trade offers posted by Discord members</p>
              </div>

              {/* Advanced Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative shrink-0 w-full sm:w-48 md:w-56">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search unit or player..." 
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/50" 
                  />
                </div>

                <button 
                  onClick={() => setFilterOfferingGems(!filterOfferingGems)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${filterOfferingGems ? 'bg-white border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  Offer Gems
                </button>

                <button 
                  onClick={() => setFilterLookingForGems(!filterLookingForGems)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${filterLookingForGems ? 'bg-white border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  LF Gems
                </button>

                <div className="relative z-30">
                  <button
                    type="button"
                    onClick={() => setIsRarityDropdownOpen(!isRarityDropdownOpen)}
                    className="flex items-center justify-between gap-2 bg-black/30 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-slate-300 hover:border-indigo-500/50 hover:text-white transition duration-200 select-none cursor-pointer"
                  >
                    <span>{rarityFilter === "All" ? "All Rarities" : rarityFilter}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isRarityDropdownOpen ? "rotate-180 text-white" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isRarityDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsRarityDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[#0d0e14] border border-white/10 p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 overflow-hidden"
                        >
                          {["All", "Mythic", "Legendary", "Epic", "Godly", "Exclusive", "Rare", "Uncommon", "Basic"].map((rarity) => {
                            const isSelected = rarityFilter === rarity;
                            const dotColor = rarity === "All" ? "bg-blue-400" :
                                             rarity === "Mythic" ? "bg-rose-400" :
                                             rarity === "Legendary" ? "bg-amber-400" :
                                             rarity === "Epic" ? "bg-purple-400" :
                                             rarity === "Godly" ? "bg-cyan-400" :
                                             rarity === "Exclusive" ? "bg-indigo-400" :
                                             rarity === "Rare" ? "bg-sky-400" :
                                             rarity === "Uncommon" ? "bg-emerald-400" :
                                             rarity === "Basic" ? "bg-zinc-400" : "bg-blue-400";
                            return (
                              <button
                                key={rarity}
                                type="button"
                                onClick={() => {
                                  setRarityFilter(rarity);
                                  setIsRarityDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-black transition duration-150 flex items-center gap-2 select-none cursor-pointer ${
                                  isSelected 
                                    ? "bg-white/20 text-indigo-300 border border-white/5" 
                                    : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                <span>{rarity === "All" ? "All Rarities" : rarity}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {(searchQuery || filterOfferingGems || filterLookingForGems || rarityFilter !== "All") && (
                  <button 
                    onClick={() => { setSearchQuery(""); setFilterOfferingGems(false); setFilterLookingForGems(false); setRarityFilter("All"); }} 
                    className="text-rose-400 hover:text-rose-300 text-xs font-mono uppercase underline px-2 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Live Trades Stream Container */}
            <div className="flex flex-col gap-4">
              {filteredTrades.length === 0 ? (
                <div className="text-center p-14 text-slate-500 border border-dashed border-white/5 rounded-3xl bg-[#09090b]/50">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm">No active trades found matching your search filters.</p>
                  <p className="text-xs text-slate-600 mt-1">Be the first to list a trade!</p>
                </div>
              ) : (
                filteredTrades.map(trade => {
                  const isOwner = discordUser && (
                    String(trade.userId || trade.robloxId) === String(discordUser.id) || 
                    (trade.discordId && discordUser.discordId && String(trade.discordId) === String(discordUser.discordId))
                  );
                  const hasDeleteRights = isOwner || isUserAdmin;

                  return (
                    <div key={trade.id} className="bg-gradient-to-b from-[#111320] to-[#0a0b11] border border-white/5 hover:border-white/20 rounded-3xl p-5 md:p-6 flex flex-col gap-5 transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-white/10 transition-all duration-500" />
                      
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 z-10">
                        {/* Player Profile Segment */}
                        <div className="flex items-center gap-3.5 shrink-0">
                          <div className="relative">
                            <img src={trade.avatar || trade.robloxAvatar} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(trade.displayName || trade.username || 'User')}&background=18181b&color=fff`; }} className="w-12 h-12 rounded-full bg-black/40 border border-white/10 object-cover" alt="" referrerPolicy="no-referrer" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-[#23a55a] rounded-full border border-[#0b0c13] flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-black text-white flex items-center gap-1.5 leading-tight">
                              {trade.displayName || trade.robloxDisplayName}
                              {trade.isStaff && (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] tracking-wider px-2 py-0.5 rounded-full font-black uppercase">STAFF</span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 leading-tight">@{trade.username || trade.robloxUsername}</div>
                            <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5 text-slate-600" /> {new Date(trade.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>

                        {/* Dual Box Offers Grid */}
                        {/* Unified Trade Container */}
                        <div className="flex-1 flex flex-col md:flex-row items-stretch bg-black/40 border border-white/5 rounded-2xl relative z-10 shadow-inner">
                          {/* Left: OFFERING */}
                          <div className="flex-1 p-4 md:p-5 flex flex-col gap-2.5 relative bg-[#0a0a0c]">
                          {/* Box 1: OFFERING (Monochrome accent) */}
                            <div className="text-[10px] font-black tracking-widest text-zinc-300 flex items-center gap-1.5 uppercase leading-none pb-2 border-b border-white/5">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                              <span>OFFERING</span>
                            </div>
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-3 p-1">
                              {trade.yourGems > 0 && (
                                <div className="relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-center gap-1.5 shadow-lg select-none min-h-[116px]">
                                  <div className="absolute -top-1.5 -right-1.5 bg-zinc-700 border border-white/10 text-white font-black text-[8px] px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider select-none z-20 font-mono">
                                    GEMS
                                  </div>
                                  <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-9 h-9 object-contain mt-1" />
                                  <span className="font-black text-cyan-400 font-mono text-xs sm:text-sm whitespace-nowrap block truncate max-w-full">
                                    {formatNumber(trade.yourGems)}
                                  </span>
                                </div>
                              )}
                              {trade.yourOffer && trade.yourOffer.map((item, idx) => {
                                const hasSign = item.sign && item.sign.name !== "None";
                                return (
                                  <div
                                    key={`your-calc-${idx}`}
                                    className={`relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                                      hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                                    } hover:border-zinc-500/60 hover:scale-[1.02] transition-all duration-300 shadow-md`}
                                  >
                                    <div className="absolute -top-1.5 -right-1.5 bg-[#22242c] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                                      x{item.qty}
                                    </div>
                                    <div className="flex flex-col items-center gap-1 w-full min-w-0">
                                      <div className="relative group/img overflow-hidden rounded-xl w-12 h-12 bg-[#050505] shadow-inner shrink-0 flex items-center justify-center p-0.5">
                                        <img
                                          src={item.unit?.img}
                                          alt={item.unit?.name}
                                          className="relative w-full h-full object-contain scale-110 group-hover/img:scale-125 transition-transform duration-300 z-10"
                                          loading="lazy"
                                        />
                                      </div>
                                      <div className="flex flex-col items-center w-full min-w-0 mt-0.5">
                                        <div className="h-7 flex items-center justify-center w-full min-w-0">
                                          <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                            {item.unit?.name}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {hasSign && (
                                      <div
                                        className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                        style={{
                                          background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                          borderColor: item.sign.color,
                                          color: item.sign.color,
                                          boxShadow: `0 0 8px ${item.sign.color}20`
                                        }}
                                        title={`Signature: ${item.sign.name}`}
                                      >
                                        ✍️ {item.sign.name}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {trade.yourGems === 0 && (!trade.yourOffer || trade.yourOffer.length === 0) && (
                                <div className="col-span-full text-[10px] text-zinc-500 italic py-6 px-2 bg-[#18181b] rounded-2xl border border-dashed border-white/5 text-center flex flex-col items-center justify-center gap-1 min-h-[112px]">
                                  <span className="text-white/20 font-black text-xl mb-1">?</span>
                                  None listed
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Box 2: LOOKING FOR (Green/emerald accent) */}
                          {/* Center Arrow Divider */}
                          <div className="hidden md:flex items-center justify-center -mx-6 z-20 relative">
                            <div className="w-12 h-12 rounded-full bg-[#121214] border-4 border-[#0a0b11] flex items-center justify-center shadow-2xl">
                              <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                            </div>
                          </div>
                          <div className="md:hidden flex items-center justify-center -my-3 z-20 relative">
                            <div className="w-10 h-10 rounded-full bg-[#121214] border-4 border-[#0a0b11] flex items-center justify-center shadow-2xl rotate-90">
                              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                          
                          {/* Right: LOOKING FOR */}
                          <div className="flex-1 p-4 md:p-5 flex flex-col gap-2.5 relative bg-[#0a0a0c]">
                            <div className="text-[10px] font-black tracking-widest text-zinc-300 flex items-center gap-1.5 uppercase leading-none pb-2 border-b border-white/5">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                              <span>LOOKING FOR</span>
                            </div>
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-3 p-1">
                              {trade.theirGems > 0 && (
                                <div className="relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-center gap-1.5 shadow-lg select-none min-h-[116px]">
                                  <div className="absolute -top-1.5 -right-1.5 bg-zinc-700 border border-white/10 text-white font-black text-[8px] px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider select-none z-20 font-mono">
                                    GEMS
                                  </div>
                                  <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-9 h-9 object-contain mt-1" />
                                  <span className="font-black text-cyan-400 font-mono text-xs sm:text-sm whitespace-nowrap block truncate max-w-full">
                                    {formatNumber(trade.theirGems)}
                                  </span>
                                </div>
                              )}
                              {trade.theirOffer && trade.theirOffer.map((item, idx) => {
                                const hasSign = item.sign && item.sign.name !== "None";
                                return (
                                  <div
                                    key={`their-calc-${idx}`}
                                    className={`relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                                      hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                                    } hover:border-zinc-500/60 hover:scale-[1.02] transition-all duration-300 shadow-md`}
                                  >
                                    <div className="absolute -top-1.5 -right-1.5 bg-[#22242c] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                                      x{item.qty}
                                    </div>
                                    <div className="flex flex-col items-center gap-1 w-full min-w-0">
                                      <div className="relative group/img overflow-hidden rounded-xl w-12 h-12 bg-[#050505] shadow-inner shrink-0 flex items-center justify-center p-0.5">
                                        <img
                                          src={item.unit?.img}
                                          alt={item.unit?.name}
                                          className="relative w-full h-full object-contain scale-110 group-hover/img:scale-125 transition-transform duration-300 z-10"
                                          loading="lazy"
                                        />
                                      </div>
                                      <div className="flex flex-col items-center w-full min-w-0 mt-0.5">
                                        <div className="h-7 flex items-center justify-center w-full min-w-0">
                                          <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                            {item.unit?.name}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {hasSign && (
                                      <div
                                        className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                        style={{
                                          background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                          borderColor: item.sign.color,
                                          color: item.sign.color,
                                          boxShadow: `0 0 8px ${item.sign.color}20`
                                        }}
                                        title={`Signature: ${item.sign.name}`}
                                      >
                                        ✍️ {item.sign.name}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {trade.theirGems === 0 && (!trade.theirOffer || trade.theirOffer.length === 0) && (
                                <div className="col-span-full text-[10px] text-zinc-500 italic py-6 px-2 bg-[#18181b] rounded-2xl border border-dashed border-white/5 text-center flex flex-col items-center justify-center gap-1 min-h-[112px]">
                                  <span className="text-white/20 font-black text-xl mb-1">?</span>
                                  None listed
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Active Actions Box */}
                        <div className="flex md:flex-col items-center gap-2.5 w-full md:w-32 shrink-0 z-10">
                          {isOwner ? (
                            <button 
                              onClick={() => setIsChatsPanelOpen(true)}
                              className="flex-1 w-full bg-[#27272a] hover:bg-[#3f3f46] hover:text-white text-slate-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 text-center cursor-pointer border border-white/5 shadow-sm"
                            >
                              Your Trade
                            </button>
                          ) : (
                            <button 
                              onClick={() => startChat(trade)}
                              className="flex-1 w-full bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 text-center cursor-pointer shadow-md"
                            >
                              Message
                            </button>
                          )}
                          {hasDeleteRights && (
                            <button 
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-white/5 hover:border-rose-500 text-rose-400 p-2.5 rounded-xl transition duration-200 cursor-pointer shadow-sm"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Counter Offers Section */}
                      <div className="z-10 mt-2 bg-black/30 rounded-2xl p-4 md:p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-3.5 border-b border-white/5 pb-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-zinc-400" /> Counter Offers
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setCollapsedCounterOffers(prev => ({ ...prev, [trade.id]: !prev[trade.id] }));
                            }}
                            className="text-[9px] font-black uppercase text-slate-400 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 transition-all duration-200 select-none cursor-pointer"
                          >
                            {collapsedCounterOffers[trade.id] ? "Show Offers" : "Hide Offers"}
                          </button>
                        </div>
                        
                        {!collapsedCounterOffers[trade.id] && (
                          <>
                            {trade.counterOffers && trade.counterOffers.length > 0 ? (
                              <div className="flex flex-col gap-2 mb-3.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                                {trade.counterOffers.map((counter, idx) => (
                                  <div key={idx} className="bg-[#12131a] rounded-xl p-3 flex items-start gap-3 border border-white/5">
                                    <img src={counter.avatar} alt="" className="w-8 h-8 rounded-full bg-black/40 border border-white/10 object-cover shrink-0" referrerPolicy="no-referrer" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <div className="text-[11px] font-bold text-white flex flex-wrap items-center gap-1">
                                          {counter.displayName}
                                          <span className="text-[9px] text-slate-500 font-mono ml-1">{new Date(counter.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        {(isOwner || isUserAdmin || (discordUser && String(counter.userId) === String(discordUser.id))) && (
                                          <button onClick={() => handleDeleteCounterOffer(trade.id, counter.id)} className="text-slate-500 hover:text-white transition ml-2 shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      <div className="mt-0.5">
                                        {renderCounterOfferText(counter.offerText)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 italic mb-3.5">No counter offers yet.</div>
                            )}

                            <div className="flex flex-col gap-3">
                              {/* Interactive Counter Offer Trigger */}
                              {!isOwner && (
                                <div className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                                  <div className="text-left">
                                    <span className="block text-[10px] font-black uppercase text-zinc-300 tracking-wider">Interactive Trade Configurator</span>
                                    <span className="block text-[9px] text-slate-400 font-medium">Select exactly which units to give them and what you want in exchange!</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!discordUser) {
                                        setIsLoginModalOpen(true);
                                        return;
                                      }
                                      setCounterOfferTradeId(trade.id);
                                      setCoYourOfferItems([]);
                                      setCoYourOfferGems(0);
                                      // Pre-fill the request with their original listing's offered items so it's ready to go!
                                      setCoTheirOfferItems([...(trade.yourOffer || [])]);
                                      setCoTheirOfferGems(trade.yourGems || 0);
                                      setCoCustomNote("");
                                      setPickerContext("counter-offer");
                                      setIsCounterOfferModalOpen(true);
                                    }}
                                    className="bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl transition duration-200 select-none cursor-pointer shrink-0 border border-white/5 shadow-md flex items-center justify-center gap-1.5"
                                  >
                                    🤝 Build Counter Offer
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* CHATS MODAL OVERLAY (Centered overlay that stands perfectly on top of other content) */}
      <AnimatePresence>
        {isChatsPanelOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#09090b] border-0 sm:border border-white/10 rounded-none sm:rounded-3xl overflow-hidden flex flex-col w-full max-w-5xl h-[100dvh] sm:h-[85vh] shadow-2xl relative"
            >
              
              {/* Chat Panel Header */}
              <div className="p-4 border-b border-[#1c1e26] bg-[#18181b] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    <MessageSquare className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">CHATS</h2>
                    <p className="text-[10px] text-slate-500">Chat directly with online traders</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatsPanelOpen(false)} 
                  className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
                {/* Sub-column 1: Active Conversations List */}
                <div className={`col-span-1 md:col-span-4 border-r border-[#1c1e26] flex flex-col h-full bg-[#09090b] min-h-0 overflow-hidden ${currentChatId ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-2.5 bg-black/20 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-white/5 font-mono">
                    CHATS ({chats.length})
                  </div>
                  <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5 scrollbar-thin">
                    {chats.length === 0 ? (
                      <div className="text-center text-[11px] text-slate-600 mt-10 px-2">
                        No active chats. Click "Message" on any trade card!
                      </div>
                    ) : (
                      chats.map(chat => {
                        const partner = chat.userA.id === discordUser?.id ? chat.userB : chat.userA;
                        const isSelected = currentChatId === chat.id;
                        const lastMsg = chat.messages[chat.messages.length - 1];

                        const sidebarTitle = isAdminChatsMode 
                          ? `${chat.userA.displayName} ↔ ${chat.userB.displayName}`
                          : partner.displayName;
                        const sidebarSubtitle = isAdminChatsMode
                          ? `@${chat.userA.name} ↔ @${chat.userB.name}`
                          : `@${partner.name}`;

                        return (
                          <div 
                            key={chat.id} 
                            onClick={() => setCurrentChatId(chat.id)} 
                            className={`p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition border ${isSelected ? 'bg-white/10 border-white/20 text-white' : 'hover:bg-white/5 border-transparent'}`}
                          >
                            <div className="relative shrink-0">
                              {isAdminChatsMode ? (
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                  <Shield className="w-4 h-4" />
                                </div>
                              ) : (
                                <>
                                  <img src={partner.avatar} className="w-8 h-8 rounded-full bg-black/50 border border-white/10" alt="" referrerPolicy="no-referrer" />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23a55a] rounded-full border border-[#08090d]" />
                                </>
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="text-[11px] font-bold text-white truncate leading-tight">{sidebarTitle}</div>
                              <div className="text-[9px] font-mono text-slate-500 truncate">{sidebarSubtitle}</div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans leading-snug">
                                {lastMsg ? lastMsg.text : "No messages yet"}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Sub-column 2: Messages Stream View */}
                <div className={`col-span-1 md:col-span-8 flex flex-col h-full bg-[#09090b] min-h-0 overflow-hidden ${!currentChatId ? 'hidden md:flex' : 'flex'}`}>
                  {currentChat ? (
                    <>
                      {/* Conversation Header Card */}
                      <div className="p-3 border-b border-[#1c1e26] bg-[#18181b] flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setCurrentChatId(null)}
                            className="md:hidden text-slate-400 hover:text-white mr-1.5 p-1.5 hover:bg-white/5 rounded-xl cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title="Back to Chats List"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div className="relative shrink-0">
                            {isAdminChatsMode ? (
                              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                                <Shield className="w-4 h-4" />
                              </div>
                            ) : (
                              <>
                                <img src={currentChat.userA.id === discordUser?.id ? currentChat.userB.avatar : currentChat.userA.avatar} className="w-8 h-8 rounded-full border border-white/10 object-cover" alt="" referrerPolicy="no-referrer" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23a55a] rounded-full border border-[#0c0d14]" />
                              </>
                            )}
                          </div>
                          <div>
                            <div className="text-[11px] font-extrabold text-white flex flex-wrap items-center gap-1.5 leading-tight">
                              {isAdminChatsMode ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-amber-400 font-extrabold text-[10px] uppercase tracking-wider mr-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">MODERATOR CHECK:</span>
                                  <span className="text-white font-black">{currentChat.userA.displayName}</span>
                                  <span className="text-slate-500 font-mono">↔</span>
                                  <span className="text-white font-black">{currentChat.userB.displayName}</span>
                                </div>
                              ) : (
                                currentChat.userA.id === discordUser?.id ? currentChat.userB.displayName : currentChat.userA.displayName
                              )}
                              {isAdminChatsMode ? (
                                <div className="flex items-center gap-1.5 ml-1">
                                  {(() => {
                                    const makeLink = (user: any) => {
                                      const isDiscord = user.discordId || user.avatar.includes("discord");
                                      if (isDiscord && !user.discordId) return null;
                                      return isDiscord 
                                        ? `https://discord.com/users/${user.discordId}` 
                                        : `https://www.roblox.com/users/${user.id}/profile`;
                                    };
                                    
                                    const linkA = makeLink(currentChat.userA);
                                    const linkB = makeLink(currentChat.userB);
                                    
                                    return (
                                      <>
                                        {linkA && (
                                          <a 
                                            href={linkA} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[8px] text-slate-300 hover:text-white flex items-center gap-0.5 underline font-sans font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/20"
                                          >
                                            <span>Profile A</span>
                                            <ExternalLink className="w-1.5 h-1.5" />
                                          </a>
                                        )}
                                        {linkB && (
                                          <a 
                                            href={linkB} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[8px] text-purple-300 hover:text-purple-200 flex items-center gap-0.5 underline font-sans font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20"
                                          >
                                            <span>Profile B</span>
                                            <ExternalLink className="w-1.5 h-1.5" />
                                          </a>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              ) : (() => {
                                const chatPartner = currentChat.userA.id === discordUser?.id ? currentChat.userB : currentChat.userA;
                                const isDiscord = chatPartner.discordId || chatPartner.avatar.includes("discord");
                                if (isDiscord && !chatPartner.discordId) return null;
                                const link = isDiscord 
                                  ? `https://discord.com/users/${chatPartner.discordId}` 
                                  : `https://www.roblox.com/users/${chatPartner.id}/profile`;
                                
                                return (
                                  <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[9px] text-slate-400 hover:text-white flex items-center gap-0.5 underline font-normal bg-white/5 px-1.5 py-0.5 rounded"
                                  >
                                    <span>Profile</span>
                                    <ExternalLink className="w-2 h-2" />
                                  </a>
                                );
                              })()}
                            </div>
                            <div className="text-[9px] font-mono text-zinc-300 mt-0.5">
                              {isAdminChatsMode ? (
                                <span>@{currentChat.userA.name} ↔ @{currentChat.userB.name}</span>
                              ) : (
                                <span>@{currentChat.userA.id === discordUser?.id ? currentChat.userB.name : currentChat.userA.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Message History Scroll */}
                      <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-[#050608]/50 scrollbar-thin">
                        {currentChat.messages.map(msg => {
                          const isOwn = String(msg.senderId) === String(discordUser?.id);
                          return (
                            <div key={msg.id} className={`flex flex-col max-w-[85%] relative group ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
                              <div className={`text-[9px] font-mono text-slate-500 mb-0.5 flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                <span className="font-bold">{msg.senderName}</span>
                                <span>•</span>
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {msg.edited && <span className="text-[8px] text-zinc-300 italic">(edited)</span>}
                              </div>
                              
                              {msg.text.startsWith("[TRADE_OFFER]") ? (
                                <div className="mt-1 relative">
                                  {(() => {
                                    try {
                                      const parts = msg.text.split("\n");
                                      const payload = JSON.parse(parts.slice(1).join("\n"));
                                      const isPending = payload.status === "pending";
                                      const isAccepted = payload.status === "accepted";
                                      const isDeclined = payload.status === "declined";

                                      return (
                                        <div className="bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full sm:w-[320px] shadow-2xl flex flex-col select-none text-left relative overflow-hidden group">
                                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-600 opacity-80" />
                                          
                                          <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-white/5 bg-white/[0.01]">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-sans">DM TRADE PROPOSAL</span>
                                            {isPending && <span className="bg-yellow-500/10 text-yellow-500 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse border border-yellow-500/20">PENDING</span>}
                                            {isAccepted && <span className="bg-white/10 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20">ACCEPTED 🤝</span>}
                                            {isDeclined && <span className="bg-zinc-800 text-zinc-400 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/5">DECLINED ❌</span>}
                                          </div>

                                          <div className="p-4 flex flex-col gap-4">
                                            <div className="flex flex-col gap-2">
                                               <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Offers</span>
                                               <div className="flex flex-col gap-1.5">
                                                 {payload.yourGems > 0 && <span className="text-xs font-mono font-bold bg-[#18181b] border border-white/5 text-white px-2.5 py-1.5 rounded-lg w-max shadow-sm">💎 {payload.yourGems.toLocaleString()}</span>}
                                                 {payload.yourOffer && payload.yourOffer.map((it:any, idx:number) => (
                                                   <span key={idx} className="text-xs font-medium bg-[#18181b] border border-white/5 text-slate-200 p-1.5 pr-3 rounded-xl flex items-center gap-2.5 w-max shadow-sm">
                                                     {it.unit?.img ? <img src={it.unit.img} className="w-6 h-6 rounded-md object-cover bg-black" /> : <div className="w-6 h-6 rounded-md bg-white/5" />} 
                                                     <span><span className="text-white font-black font-mono mr-1">{it.qty}x</span> {it.unit?.name}</span>
                                                   </span>
                                                 ))}
                                                 {payload.yourGems === 0 && (!payload.yourOffer || payload.yourOffer.length === 0) && (
                                                  <span className="text-[10px] text-slate-600 italic px-1">Empty offer</span>
                                                )}
                                               </div>
                                            </div>
                                            
                                             <div className="flex justify-center -my-1 opacity-50">
                                               <ArrowUpDown className="w-4 h-4 text-slate-400" />
                                             </div>

                                             <div className="flex flex-col gap-2">
                                               <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Wants</span>
                                               <div className="flex flex-col gap-1.5">
                                                 {payload.theirGems > 0 && <span className="text-xs font-mono font-bold bg-[#18181b] border border-white/5 text-white px-2.5 py-1.5 rounded-lg w-max shadow-sm">💎 {payload.theirGems.toLocaleString()}</span>}
                                                 {payload.theirOffer && payload.theirOffer.map((it:any, idx:number) => (
                                                   <span key={idx} className="text-xs font-medium bg-[#18181b] border border-white/5 text-slate-200 p-1.5 pr-3 rounded-xl flex items-center gap-2.5 w-max shadow-sm">
                                                     {it.unit?.img ? <img src={it.unit.img} className="w-6 h-6 rounded-md object-cover bg-black" /> : <div className="w-6 h-6 rounded-md bg-white/5" />}
                                                     <span><span className="text-white font-black font-mono mr-1">{it.qty}x</span> {it.unit?.name}</span>
                                                   </span>
                                                 ))}
                                                 {payload.theirGems === 0 && (!payload.theirOffer || payload.theirOffer.length === 0) && (
                                                   <span className="text-[10px] text-slate-600 italic px-1">Empty request</span>
                                                 )}
                                               </div>
                                             </div>
                                           </div>

                                          {payload.note && (
                                            <div className="bg-white/[0.02] border-t border-white/5 px-4 py-3 text-xs text-slate-300 italic font-medium leading-relaxed">
                                              "{payload.note}"
                                            </div>
                                          )}

                                          {/* Interactive controls for recipient */}
                                          {isPending && !isOwn && (
                                            <div className="flex gap-2 pt-1">
                                              <button 
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateTradeProposalStatus(msg.id, "accepted");
                                                }}
                                                className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg"
                                              >
                                                Accept
                                              </button>
                                              <button 
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateTradeProposalStatus(msg.id, "declined");
                                                }}
                                                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer text-center border border-white/5 hover:border-white/10"
                                              >
                                                Decline
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } catch {
                                      return <span className="italic text-slate-400 text-xs">[Invalid Trade Offer]</span>;
                                    }
                                  })()}
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    setActiveMsgToolbarId(activeMsgToolbarId === msg.id ? null : msg.id);
                                  }}
                                  className={`px-3 py-2 rounded-2xl text-[13px] relative leading-relaxed shadow-sm transition-all duration-200 cursor-pointer ${isOwn ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-sm shadow-indigo-500/20' : 'bg-[#181922] text-slate-200 rounded-tl-sm border border-white/5 shadow-black/40'}`}
                                >
                                  {msg.text}
                                </div>
                              )}

                              {/* Active reactions list */}
                              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  {Object.entries(msg.reactions as Record<string, string[]>).map(([emoji, users]) => (
                                    <button 
                                      key={emoji} 
                                      onClick={() => handleReact(msg.id, emoji)} 
                                      className="bg-black/30 hover:bg-white/10 transition text-[11px] px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 cursor-pointer"
                                      title={users.join(", ")}
                                    >
                                      <span className="text-sm">{emoji}</span>
                                      <span className="text-[8px] text-slate-400 font-extrabold">{users.length}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Floating Hover Toolbar */}
                              <div className={`absolute -top-12 ${isOwn ? 'right-0' : 'left-0'} transition-all duration-200 flex flex-wrap items-center gap-1 bg-black/95 backdrop-blur-md border border-white/10 rounded-xl p-1 z-30 shadow-2xl ${
                                activeMsgToolbarId === msg.id 
                                  ? 'opacity-100 pointer-events-auto visible scale-100' 
                                  : 'opacity-0 pointer-events-none invisible scale-95 sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:visible sm:group-hover:scale-100'
                              } w-max max-w-[260px] sm:max-w-none origin-bottom after:content-[''] after:absolute after:h-12 after:w-[calc(100%+32px)] after:-bottom-12 after:-left-4`}>
                                {['👍', '❤️', '🔥', '💀', '🖕'].map(em => (
                                  <button 
                                    key={em} 
                                    onClick={() => handleReact(msg.id, em)} 
                                    className="text-[15px] hover:scale-125 transition-transform p-1.5 cursor-pointer"
                                  >
                                    {em}
                                  </button>
                                ))}
                                <button 
                                  onClick={() => setShowReactionsFor(showReactionsFor === msg.id ? null : msg.id)} 
                                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 cursor-pointer" 
                                >
                                  <Smile className="w-4 h-4" />
                                </button>
                                {isOwn && (
                                  <button 
                                    onClick={() => { if (msg.text.startsWith("[TRADE_OFFER]")) {
                                        try {
                                          const parts = msg.text.split("\n");
                                          const payload = JSON.parse(parts.slice(1).join("\n"));
                                          setDmYourOfferItems(payload.yourOffer || []);
                                          setDmTheirOfferItems(payload.theirOffer || []);
                                          setDmYourOfferGems(payload.yourGems || 0);
                                          setDmTheirOfferGems(payload.theirGems || 0);
                                          setDmCustomNote(payload.note || "");
                                          setEditingMessageId(msg.id);
                                          setIsDMProposalOpen(true);
                                        } catch (err) {
                                          console.error("Failed to parse trade offer JSON on edit", err);
                                          setEditingMessageId(msg.id);
                                          setChatMessageText(msg.text);
                                        }
                                      } else {
                                        setEditingMessageId(msg.id);
                                        setChatMessageText(msg.text);
                                      } }} 
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 cursor-pointer" 
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                {(isOwn || isUserAdmin) && (
                                  <button 
                                    onClick={() => handleDeleteMessage(msg.id)} 
                                    className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-400 cursor-pointer" 
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                                {!isOwn && (
                                  <button 
                                    onClick={() => handleInitiateReport(msg, currentChat)} 
                                    className="p-1.5 hover:bg-amber-500/20 rounded-lg text-amber-400 cursor-pointer" 
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Detailed emoji popover */}
                              {showReactionsFor === msg.id && (
                                <div className={`absolute z-40 bg-[#12131a]/95 backdrop-blur-xl border border-[#2b2d35] p-2 rounded-xl flex flex-wrap max-w-[200px] sm:max-w-none gap-1 shadow-2xl top-10 ${isOwn ? 'right-0' : 'left-0'}`}>
                                  {['👍', '❤️', '😂', '🔥', '💀', '👀', '🖕', '💯'].map(em => (
                                    <button 
                                      key={em} 
                                      onClick={() => handleReact(msg.id, em)} 
                                      className="text-[18px] p-1 hover:scale-125 transition-transform cursor-pointer"
                                    >
                                      {em}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Error Bar */}
                      {chatError && (
                        <div className="bg-zinc-800 border-t border-white/10 px-3 py-2 text-[10px] text-zinc-300 font-mono flex items-center justify-between shrink-0">
                          <span>{chatError}</span>
                          <button onClick={() => setChatError(null)} className="text-zinc-300 hover:text-white p-0.5 rounded hover:bg-white/5 transition cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Interactive Message Form Footer */}
                      <form onSubmit={handleSendMessage} className="p-2.5 border-t border-[#1c1e26] bg-[#18181b] flex gap-2 shrink-0 items-center">
                        {!editingMessageId && (
                          <button
                            type="button"
                            onClick={() => {
                              setPickerContext("dm-proposal");
                              setDmYourOfferItems([]);
                              setDmTheirOfferItems([]);
                              setDmYourOfferGems(0);
                              setDmTheirOfferGems(0);
                              setDmCustomNote("");
                              setIsDMProposalOpen(true);
                            }}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 border border-white/5 text-white hover:scale-105 active:scale-95 transition-all px-3 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider shrink-0 cursor-pointer flex items-center gap-1 hover:shadow-[0_0_12px_rgba(79,70,229,0.35)]"
                            title="Create Live Trade Proposal"
                          >
                            <span>💼 Offer</span>
                          </button>
                        )}
                        {editingMessageId && (
                          <button 
                            type="button" 
                            onClick={() => { setEditingMessageId(null); setChatMessageText(""); }} 
                            className="p-2.5 text-zinc-300 hover:bg-white/5 rounded-xl transition cursor-pointer shrink-0" 
                            title="Cancel Edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <input 
                          type="text" 
                          value={chatMessageText} 
                          onChange={(e) => setChatMessageText(e.target.value)} 
                          placeholder={editingMessageId ? "Edit message..." : "Type a message here..."} 
                          className="flex-1 bg-[#050505]/80 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-zinc-200 placeholder-slate-500 focus:outline-none focus:border-white/50" 
                        />
                        <button 
                          type="submit" 
                          disabled={!chatMessageText.trim()} 
                          className="bg-[#2b2d31] hover:bg-[#383a40] disabled:opacity-40 p-2.5 rounded-xl transition shrink-0 cursor-pointer text-zinc-300 hover:text-white"
                        >
                          {editingMessageId ? <Check className="w-4.5 h-4.5" /> : <Send className="w-4.5 h-4.5" />}
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
                      <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                      <p className="text-xs max-w-xs text-slate-500 leading-normal">
                        Select a chat from the active list, or click "Message" on any live trade feed card to initiate a transaction deal.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Discord Login Modal (Beautiful visual style) */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[#1e1f22] border border-white/5 text-zinc-300 flex flex-col rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full relative p-8 text-center animate-fade-in"
            >
              <button 
                onClick={() => setIsLoginModalOpen(false)} 
                className="absolute top-4 right-4 text-[#949ba4] hover:text-white transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              
              <div className="w-16 h-16 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#5865F2]/20">
                <MessageSquare className="w-8 h-8 text-zinc-400" />
              </div>

              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Login with Discord</h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Connect your Discord account to publish trade offers, chat with other traders, and perform secure trades.
              </p>
              
              <button 
                onClick={handleLogin} 
                className="bg-[#5865F2] hover:bg-[#4752C4] w-full text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-[#5865F2]/25"
              >
                Authorize Discord Account
              </button>


            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. List Trade / Create Trade Listing Modal Redesigned */}
      <AnimatePresence>
        {isAddTradeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[#18181b] border border-white/10 text-zinc-300 flex flex-col rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full relative max-h-[95vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-zinc-300" /> PUBLISH COMMUNITY TRADE
                </h2>
                <button 
                  onClick={() => setIsAddTradeModalOpen(false)} 
                  className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateTrade} className="p-4 sm:p-5 flex flex-col gap-5 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Left Column: Your Offer */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[420px]">
                    
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black tracking-widest text-zinc-200 flex items-center gap-2 uppercase">
                        <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        YOUR OFFER
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setYourOfferItems([]);
                          setYourOfferGems(0);
                        }}
                        className="text-xs font-black uppercase text-zinc-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    
                    {/* Grid of added items and gems */}
                    <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 min-h-[200px] max-h-[300px] content-start overflow-y-auto p-2 mb-6 scrollbar-thin">
                      {yourOfferGems > 0 && (
                        <div className="relative group bg-[#050505]/80 border border-cyan-500/30 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-center gap-1 shadow-lg select-none min-h-[120px]">
                          <button
                            type="button"
                            onClick={() => setYourOfferGems(0)}
                            className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md z-20 select-none cursor-pointer border border-white/20 transition-all active:scale-95"
                            title="Remove gems"
                          >
                            <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                          </button>
                          <div className="absolute -top-1.5 -right-1.5 bg-cyan-500 border border-white/20 text-black font-black text-[7px] px-1.5 py-0.5 rounded-full shadow-md uppercase tracking-wider select-none z-20 font-mono">
                            GEMS
                          </div>
                          <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-9 h-9 object-contain mt-1 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.3)]" />
                          <span className="font-black text-cyan-400 font-mono text-[11px] sm:text-xs whitespace-nowrap block truncate max-w-full">
                            {yourOfferGems.toLocaleString("en-US")}
                          </span>
                        </div>
                      )}

                      {yourOfferItems.map((item, idx) => {
                        const hasSign = item.sign?.name && item.sign.name !== "None";
                        const rStyle = rarityClasses[item.unit?.rarity] || rarityClasses.Basic;

                        return (
                          <div
                            key={`your-modal-${idx}`}
                            className={`relative group ${rStyle.bg} border ${rStyle.border} ${rStyle.shadow} rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                              hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                            } hover:border-white/40 hover:scale-[1.02] transition-all duration-300 shadow-md`}
                          >
                            <button
                              type="button"
                              onClick={() => setYourOfferItems(yourOfferItems.filter((_, i) => i !== idx))}
                              className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md z-20 select-none cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                              title="Remove item"
                            >
                              <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                            </button>
                            <div className="absolute -top-1.5 -right-1.5 bg-rose-500 border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                              x{item.qty}
                            </div>

                            <div className="flex flex-col items-center gap-1 w-full min-w-0">
                              <div className="w-11 h-11 shrink-0 overflow-hidden rounded-xl bg-black/40 shadow-inner flex items-center justify-center p-0.5">
                                <img src={item.unit?.img} alt={item.unit?.name} className="w-full h-full object-contain scale-110" loading="lazy" />
                              </div>
                              <div className="h-7 flex items-center justify-center w-full min-w-0">
                                <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                  {item.unit?.name}
                                </span>
                              </div>
                            </div>

                            <div className="w-full flex flex-col gap-1 mt-1 shrink-0">
                              {hasSign && (
                                <div
                                  className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                  style={{
                                    background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                    borderColor: item.sign.color,
                                    color: item.sign.color,
                                    boxShadow: `0 0 8px ${item.sign.color}20`
                                  }}
                                  title={`Signature: ${item.sign.name}`}
                                >
                                  ✍️ {item.sign.name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {yourOfferItems.length === 0 && yourOfferGems === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                          <Gem className="w-6 h-6 opacity-40 text-white/60" />
                          <span className="text-[10px]">Your offer is empty. Add Units or Gems below!</span>
                        </div>
                      )}
                    </div>
                  <div>
                    <div className="flex gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPickerContext('create-trade');
                          setUnitPickerSide('your');
                          setPickerSearchQuery('');
                          setPickerRarityFilter('All');
                          setPickerSelectedUnit(null);
                          setPickerSelectedSign(Hl.find(s => s.name === "None") || Hl[0]);
                          setPickerSelectedQty(1);
                        }}
                        className="flex-1 bg-white hover:bg-zinc-200 hover:scale-[1.01] active:scale-[0.99] text-black font-black py-3 px-4 rounded-xl shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest select-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ADD UNIT
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPickerContext('create-trade');
                          setGemsModalSide('your');
                          setGemsInputValue(yourOfferGems > 0 ? String(yourOfferGems) : "");
                          setIsGemsConfigOpen(true);
                        }}
                        className="bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-cyan-400 font-black py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-[10px] uppercase tracking-widest select-none cursor-pointer"
                      >
                        💎 Gems
                      </button>
                    </div>

                    <div className="border border-white/5 flex justify-between items-center bg-black/25 px-4 py-3 rounded-2xl">
                      <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wider">Total Value:</span>
                      <span className="font-mono text-lg font-black text-zinc-100">
                        💎 {Math.round(yourOfferGems + yourOfferItems.reduce((acc, item) => acc + (item.unit?.gems === -1 ? 0 : (item.unit?.gems || 0)) * (1 + (item.sign?.percent || 0) / 100) * item.qty, 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                </div>
                  {/* Right Column: Their Offer */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[420px]">
                    
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black tracking-widest text-zinc-200 flex items-center gap-2 uppercase">
                        <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        THEIR OFFER
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setTheirOfferItems([]);
                          setTheirOfferGems(0);
                        }}
                        className="text-xs font-black uppercase text-zinc-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    
                    {/* Grid of added items and gems */}
                    <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 min-h-[200px] max-h-[300px] content-start overflow-y-auto p-2 mb-6 scrollbar-thin">
                      {theirOfferGems > 0 && (
                        <div className="relative group bg-[#050505]/80 border border-cyan-500/30 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-center gap-1 shadow-lg select-none min-h-[120px]">
                          <button
                            type="button"
                            onClick={() => setTheirOfferGems(0)}
                            className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md z-20 select-none cursor-pointer border border-white/20 transition-all active:scale-95"
                            title="Remove gems"
                          >
                            <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                          </button>
                          <div className="absolute -top-1.5 -right-1.5 bg-cyan-500 border border-white/20 text-black font-black text-[7px] px-1.5 py-0.5 rounded-full shadow-md uppercase tracking-wider select-none z-20 font-mono">
                            GEMS
                          </div>
                          <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-9 h-9 object-contain mt-1 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.3)]" />
                          <span className="font-black text-cyan-400 font-mono text-[11px] sm:text-xs whitespace-nowrap block truncate max-w-full">
                            {theirOfferGems.toLocaleString("en-US")}
                          </span>
                        </div>
                      )}

                      {theirOfferItems.map((item, idx) => {
                        const hasSign = item.sign?.name && item.sign.name !== "None";
                        const rStyle = rarityClasses[item.unit?.rarity] || rarityClasses.Basic;

                        return (
                          <div
                            key={`their-modal-${idx}`}
                            className={`relative group ${rStyle.bg} border ${rStyle.border} ${rStyle.shadow} rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                              hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                            } hover:border-white/40 hover:scale-[1.02] transition-all duration-300 shadow-md`}
                          >
                            <button
                              type="button"
                              onClick={() => setTheirOfferItems(theirOfferItems.filter((_, i) => i !== idx))}
                              className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md z-20 select-none cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                              title="Remove item"
                            >
                              <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                            </button>
                            <div className="absolute -top-1.5 -right-1.5 bg-rose-500 border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                              x{item.qty}
                            </div>

                            <div className="flex flex-col items-center gap-1 w-full min-w-0">
                              <div className="w-11 h-11 shrink-0 overflow-hidden rounded-xl bg-black/40 shadow-inner flex items-center justify-center p-0.5">
                                <img src={item.unit?.img} alt={item.unit?.name} className="w-full h-full object-contain scale-110" loading="lazy" />
                              </div>
                              <div className="h-7 flex items-center justify-center w-full min-w-0">
                                <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                  {item.unit?.name}
                                </span>
                              </div>
                            </div>

                            <div className="w-full flex flex-col gap-1 mt-1 shrink-0">
                              {hasSign && (
                                <div
                                  className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                  style={{
                                    background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                    borderColor: item.sign.color,
                                    color: item.sign.color,
                                    boxShadow: `0 0 8px ${item.sign.color}20`
                                  }}
                                  title={`Signature: ${item.sign.name}`}
                                >
                                  ✍️ {item.sign.name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {theirOfferItems.length === 0 && theirOfferGems === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                          <Gem className="w-6 h-6 opacity-40 text-white/60" />
                          <span className="text-[10px]">Their offer is empty. Add Units or Gems below!</span>
                        </div>
                      )}
                    </div>
                  <div>
                    <div className="flex gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPickerContext('create-trade');
                          setUnitPickerSide('their');
                          setPickerSearchQuery('');
                          setPickerRarityFilter('All');
                          setPickerSelectedUnit(null);
                          setPickerSelectedSign(Hl.find(s => s.name === "None") || Hl[0]);
                          setPickerSelectedQty(1);
                        }}
                        className="flex-1 bg-zinc-800 border border-white/10 hover:bg-zinc-700 hover:scale-[1.01] active:scale-[0.99] text-white font-black py-3 px-4 rounded-xl shadow-none transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest select-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ADD UNIT
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPickerContext('create-trade');
                          setGemsModalSide('their');
                          setGemsInputValue(theirOfferGems > 0 ? String(theirOfferGems) : "");
                          setIsGemsConfigOpen(true);
                        }}
                        className="bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-cyan-400 font-black py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-[10px] uppercase tracking-widest select-none cursor-pointer"
                      >
                        💎 Gems
                      </button>
                    </div>

                    <div className="border border-white/5 flex justify-between items-center bg-black/25 px-4 py-3 rounded-2xl">
                      <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wider">Total Value:</span>
                      <span className="font-mono text-lg font-black text-zinc-100">
                        💎 {Math.round(theirOfferGems + theirOfferItems.reduce((acc, item) => acc + (item.unit?.gems === -1 ? 0 : (item.unit?.gems || 0)) * (1 + (item.sign?.percent || 0) / 100) * item.qty, 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

                <button 
                  type="submit" 
                  className="bg-white hover:bg-zinc-200 text-black active:scale-[0.99] font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest transition w-full mt-2 cursor-pointer shadow-none"
                >
                  PUBLISH TRADE TO FEED
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDMProposalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[#18181b] border border-white/10 text-zinc-300 flex flex-col rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full relative max-h-[95vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-zinc-400" /> CONFIGURE TRADE PROPOSAL
                </h2>
                <button 
                  type="button"
                  onClick={() => {
                    setIsDMProposalOpen(false);
                    setDmYourOfferItems([]);
                    setDmTheirOfferItems([]);
                    setDmYourOfferGems(0);
                    setDmTheirOfferGems(0);
                    setDmCustomNote("");
                    setEditingMessageId(null);
                  }} 
                  className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Column: Your Offer */}
                  <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[420px]">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black tracking-widest text-zinc-300 flex items-center gap-2 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                          YOUR OFFER
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setDmYourOfferItems([]);
                            setDmYourOfferGems(0);
                          }}
                          className="text-[10px] font-black uppercase text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      
                      {/* Grid of added items and gems */}
                      <div className="grid grid-cols-2 gap-2.5 overflow-y-auto max-h-[220px] content-start scrollbar-thin mb-3">
                        {dmYourOfferGems > 0 && (
                          <div className="relative group bg-[#050505]/80 border border-cyan-500/30 rounded-2xl p-2.5 text-center flex flex-col items-center justify-center gap-1 shadow-lg select-none min-h-[100px]">
                            <button
                              type="button"
                              onClick={() => setDmYourOfferGems(0)}
                              className="absolute -top-1 -left-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[8px] shadow-md z-25 cursor-pointer hover:scale-110 active:scale-95 transition-all border border-white/20"
                            >
                              <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                            </button>
                            <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-8 h-8 object-contain" />
                            <span className="font-black text-cyan-400 font-mono text-[10px] truncate max-w-full">
                              {dmYourOfferGems.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {dmYourOfferItems.map((item, idx) => {
                          const hasSign = item.sign?.name && item.sign.name !== "None";
                          const rStyle = rarityClasses[item.unit?.rarity] || rarityClasses.Basic;

                          return (
                            <div
                              key={`dm-your-modal-${idx}`}
                              className={`relative group ${rStyle.bg} border ${rStyle.border} ${rStyle.shadow} rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                                hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                              } hover:border-white/30 transition-all duration-300 shadow-md`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qty > 1) {
                                    setDmYourOfferItems(dmYourOfferItems.map((it, i) => i === idx ? { ...it, qty: it.qty - 1 } : it));
                                  } else {
                                    setDmYourOfferItems(dmYourOfferItems.filter((_, i) => i !== idx));
                                  }
                                }}
                                className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 cursor-pointer border border-white/20 transition-all active:scale-90"
                                title={item.qty > 1 ? "Decrement quantity" : "Remove unit"}
                              >
                                <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                              </button>
                              <span className="absolute -top-1.5 -right-1.5 bg-[#252730] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                                x{item.qty}
                              </span>
                              <div className="w-11 h-11 shrink-0 overflow-hidden rounded-xl bg-black/40 flex items-center justify-center p-0.5 shadow-inner">
                                <img src={item.unit?.img} className="w-full h-full object-contain scale-110" alt={item.unit?.name || ""} loading="lazy" />
                              </div>
                              <div className="min-w-0 w-full mt-1 flex flex-col items-center">
                                <div className="h-7 flex items-center justify-center w-full min-w-0">
                                  <div className="text-[10.5px] font-extrabold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                    {item.unit?.name}
                                  </div>
                                </div>
                                {hasSign && (
                                  <div
                                    className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                    style={{
                                      background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                      borderColor: item.sign.color,
                                      color: item.sign.color,
                                      boxShadow: `0 0 8px ${item.sign.color}20`
                                    }}
                                    title={`Signature: ${item.sign.name}`}
                                  >
                                    ✍️ {item.sign.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {dmYourOfferItems.length === 0 && dmYourOfferGems === 0 && (
                          <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                            <Gem className="w-5 h-5 opacity-40 text-white/50" />
                            <span className="text-[10px] text-zinc-500 italic">Your offer is empty. Add Units or Gems below!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-3 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPickerContext('dm-proposal');
                            setUnitPickerSide('your');
                            setPickerSearchQuery('');
                            setPickerRarityFilter('All');
                            setPickerSelectedUnit(null);
                            setPickerSelectedSign(signatures.find(s => s.name === "None") || signatures[0]);
                            setPickerSelectedQty(1);
                          }}
                          className="flex-1 bg-white hover:bg-zinc-200 hover:scale-[1.01] active:scale-[0.99] text-black font-black py-3 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider select-none cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> ADD UNIT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPickerContext('dm-proposal');
                            setGemsModalSide('your');
                            setGemsInputValue(dmYourOfferGems > 0 ? String(dmYourOfferGems) : "");
                            setIsGemsConfigOpen(true);
                          }}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          💎 Gems
                        </button>
                      </div>

                      <div className="border border-white/5 flex justify-between items-center bg-black/35 px-4 py-2.5 rounded-xl mt-auto">
                        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Value:</span>
                        <span className="font-mono text-base font-black text-cyan-400">
                          💎 {Math.round(dmYourOfferGems + dmYourOfferItems.reduce((acc, item) => acc + (item.unit?.gems === -1 ? 0 : (item.unit?.gems || 0)) * (1 + (item.sign?.percent || 0) / 100) * item.qty, 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Their Request */}
                  <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[420px]">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black tracking-widest text-zinc-300 flex items-center gap-2 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                          THEIR OFFER
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setDmTheirOfferItems([]);
                            setDmTheirOfferGems(0);
                          }}
                          className="text-[10px] font-black uppercase text-zinc-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      
                      {/* Grid of added items and gems */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[240px] content-start scrollbar-thin mb-3 p-1">
                        {dmTheirOfferGems > 0 && (
                          <div className="relative group bg-[#050505]/80 border border-cyan-500/30 rounded-2xl p-2.5 text-center flex flex-col items-center justify-center gap-1 shadow-lg select-none min-h-[120px]">
                            <button
                              type="button"
                              onClick={() => setDmTheirOfferGems(0)}
                              className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 cursor-pointer border border-white/20 transition-all active:scale-90"
                              title="Remove gems"
                            >
                              <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                            </button>
                            <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-8 h-8 object-contain" />
                            <span className="font-black text-cyan-400 font-mono text-[10px] truncate max-w-full">
                              {dmTheirOfferGems.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {dmTheirOfferItems.map((item, idx) => {
                          const hasSign = item.sign?.name && item.sign.name !== "None";
                          const rStyle = rarityClasses[item.unit?.rarity] || rarityClasses.Basic;

                          return (
                            <div
                              key={`dm-their-modal-${idx}`}
                              className={`relative group ${rStyle.bg} border ${rStyle.border} ${rStyle.shadow} rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                                hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                              } hover:border-white/30 transition-all duration-300 shadow-md`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qty > 1) {
                                    setDmTheirOfferItems(dmTheirOfferItems.map((it, i) => i === idx ? { ...it, qty: it.qty - 1 } : it));
                                  } else {
                                    setDmTheirOfferItems(dmTheirOfferItems.filter((_, i) => i !== idx));
                                  }
                                }}
                                className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 cursor-pointer border border-white/20 transition-all active:scale-90"
                                title={item.qty > 1 ? "Decrement quantity" : "Remove unit"}
                              >
                                <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                              </button>
                              <span className="absolute -top-1.5 -right-1.5 bg-[#252730] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                                x{item.qty}
                              </span>
                              <div className="w-11 h-11 shrink-0 overflow-hidden rounded-xl bg-black/40 flex items-center justify-center p-0.5 shadow-inner">
                                <img src={item.unit?.img} className="w-full h-full object-contain scale-110" alt={item.unit?.name || ""} loading="lazy" />
                              </div>
                              <div className="min-w-0 w-full mt-1 flex flex-col items-center">
                                <div className="h-7 flex items-center justify-center w-full min-w-0">
                                  <div className="text-[10.5px] font-extrabold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                    {item.unit?.name}
                                  </div>
                                </div>
                                {hasSign && (
                                  <div
                                    className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                    style={{
                                      background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                      borderColor: item.sign.color,
                                      color: item.sign.color,
                                      boxShadow: `0 0 8px ${item.sign.color}20`
                                    }}
                                    title={`Signature: ${item.sign.name}`}
                                  >
                                    ✍️ {item.sign.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {dmTheirOfferItems.length === 0 && dmTheirOfferGems === 0 && (
                          <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                            <Gem className="w-5 h-5 opacity-40 text-white/50" />
                            <span className="text-[10px] text-zinc-500 italic">Their offer is empty. Add Units or Gems below!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-3 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPickerContext('dm-proposal');
                            setUnitPickerSide('their');
                            setPickerSearchQuery('');
                            setPickerRarityFilter('All');
                            setPickerSelectedUnit(null);
                            setPickerSelectedSign(signatures.find(s => s.name === "None") || signatures[0]);
                            setPickerSelectedQty(1);
                          }}
                          className="flex-1 bg-zinc-800 border border-white/10 hover:bg-zinc-700 hover:scale-[1.01] active:scale-[0.99] text-white font-black py-3 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider select-none cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> ADD UNIT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPickerContext('dm-proposal');
                            setGemsModalSide('their');
                            setGemsInputValue(dmTheirOfferGems > 0 ? String(dmTheirOfferGems) : "");
                            setIsGemsConfigOpen(true);
                          }}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          💎 Gems
                        </button>
                      </div>

                      <div className="border border-white/5 flex justify-between items-center bg-black/35 px-4 py-2.5 rounded-xl mt-auto">
                        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Value:</span>
                        <span className="font-mono text-base font-black text-cyan-400">
                          💎 {Math.round(dmTheirOfferGems + dmTheirOfferItems.reduce((acc, item) => acc + (item.unit?.gems === -1 ? 0 : (item.unit?.gems || 0)) * (1 + (item.sign?.percent || 0) / 100) * item.qty, 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Offer message input */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add custom note or details</label>
                  <input
                    type="text"
                    value={dmCustomNote}
                    onChange={(e) => setDmCustomNote(e.target.value)}
                    placeholder="e.g. Let's trade in lobby 4! My Roblox username is..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-white/30 placeholder-slate-600 font-medium transition duration-200"
                  />
                </div>

                <button 
                  type="button" 
                  onClick={handleSendTradeProposal}
                  className="bg-white hover:bg-zinc-200 text-black active:scale-[0.99] font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-widest transition w-full mt-2 cursor-pointer shadow-lg"
                >
                  SEND PROPOSAL TO CHAT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Counter Offer Configurator Modal Overlay */}
      <AnimatePresence>
        {isCounterOfferModalOpen && counterOfferTradeId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[#18181b] border border-white/10 text-zinc-300 flex flex-col rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full relative max-h-[95vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-zinc-400" /> CONFIGURE INTERACTIVE COUNTER OFFER
                </h2>
                <button 
                  type="button"
                  onClick={() => setIsCounterOfferModalOpen(false)} 
                  className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Column: Your Offer (GIVE) */}
                  <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[420px]">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black tracking-widest text-zinc-300 flex items-center gap-2 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                          YOUR OFFER (GIVE)
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setCoYourOfferItems([]);
                            setCoYourOfferGems(0);
                          }}
                          className="text-[10px] font-black uppercase text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      
                      {/* Grid of added items and gems */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[240px] content-start scrollbar-thin mb-3 p-1">
                        {coYourOfferGems > 0 && (
                          <div className="relative group bg-[#050505]/80 border border-cyan-500/30 rounded-2xl p-2.5 text-center flex flex-col items-center justify-center gap-1 shadow-lg select-none min-h-[120px]">
                            <button
                              type="button"
                              onClick={() => setCoYourOfferGems(0)}
                              className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 cursor-pointer border border-white/20 transition-all active:scale-90"
                              title="Remove gems"
                            >
                              <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                            </button>
                            <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-8 h-8 object-contain" />
                            <span className="font-black text-cyan-400 font-mono text-[10px] truncate max-w-full">
                              {coYourOfferGems.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {coYourOfferItems.map((item, idx) => {
                          const hasSign = item.sign?.name && item.sign.name !== "None";

                          return (
                            <div
                              key={`co-your-modal-${idx}`}
                              className={`relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                                hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                              } hover:border-white/30 transition-all duration-300 shadow-md`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qty > 1) {
                                    setCoYourOfferItems(coYourOfferItems.map((it, i) => i === idx ? { ...it, qty: it.qty - 1 } : it));
                                  } else {
                                    setCoYourOfferItems(coYourOfferItems.filter((_, i) => i !== idx));
                                  }
                                }}
                                className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 cursor-pointer border border-white/20 transition-all active:scale-90"
                                title={item.qty > 1 ? "Decrement quantity" : "Remove unit"}
                              >
                                <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                              </button>
                              <div className="absolute -top-1.5 -right-1.5 bg-[#252730] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                                x{item.qty}
                              </div>
                              <div className="flex flex-col items-center gap-1 w-full min-w-0">
                                <div className="relative group/img overflow-hidden rounded-xl w-11 h-11 bg-black/40 flex items-center justify-center p-0.5 shadow-inner shrink-0">
                                  <img
                                    src={item.unit?.img}
                                    alt={item.unit?.name}
                                    className="relative w-full h-full object-contain scale-110 group-hover/img:scale-125 transition-transform duration-300 z-10"
                                  />
                                </div>
                                <div className="flex flex-col items-center w-full min-w-0">
                                  <div className="h-7 flex items-center justify-center w-full min-w-0 mt-1">
                                    <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                      {item.unit?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {hasSign && (
                                <div
                                  className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                  style={{
                                    background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                    borderColor: item.sign.color,
                                    color: item.sign.color,
                                    boxShadow: `0 0 8px ${item.sign.color}20`
                                  }}
                                  title={`Signature: ${item.sign.name}`}
                                >
                                  ✍️ {item.sign.name}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {coYourOfferItems.length === 0 && coYourOfferGems === 0 && (
                          <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                            <Gem className="w-5 h-5 opacity-40 text-white/50" />
                            <span className="text-[10px] text-zinc-500 italic">Your offer is empty. Add Units or Gems below!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-3 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setUnitPickerSide('your');
                            setPickerSearchQuery('');
                            setPickerRarityFilter('All');
                            setPickerSelectedUnit(null);
                            setPickerSelectedSign(signatures.find(s => s.name === "None") || signatures[0]);
                            setPickerSelectedQty(1);
                            setPickerContext('counter-offer');
                          }}
                          className="flex-1 bg-white hover:bg-zinc-200 hover:scale-[1.01] active:scale-[0.99] text-black font-black py-3 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider select-none cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> ADD UNIT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGemsModalSide('your');
                            setGemsInputValue(coYourOfferGems > 0 ? String(coYourOfferGems) : "");
                            setPickerContext('counter-offer');
                            setIsGemsConfigOpen(true);
                          }}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          💎 Gems
                        </button>
                      </div>

                      <div className="border border-white/5 flex justify-between items-center bg-black/35 px-4 py-2.5 rounded-xl mt-auto">
                        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Value:</span>
                        <span className="font-mono text-base font-black text-zinc-300">
                          💎 {Math.round(coYourOfferGems + coYourOfferItems.reduce((acc, item) => acc + (item.unit?.gems === -1 ? 0 : (item.unit?.gems || 0)) * (1 + (item.sign?.percent || 0) / 100) * item.qty, 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Their Offer (RECEIVE) */}
                  <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[420px]">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black tracking-widest text-zinc-300 flex items-center gap-2 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                          THEIR OFFER (RECEIVE)
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setCoTheirOfferItems([]);
                            setCoTheirOfferGems(0);
                          }}
                          className="text-[10px] font-black uppercase text-zinc-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Grid of added items and gems */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[240px] content-start scrollbar-thin mb-3 p-1">
                        {coTheirOfferGems > 0 && (
                          <div className="relative group bg-[#050505]/80 border border-cyan-500/30 rounded-2xl p-2.5 text-center flex flex-col items-center justify-center gap-1 shadow-lg select-none min-h-[120px]">
                            <button
                              type="button"
                              onClick={() => setCoTheirOfferGems(0)}
                              className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 cursor-pointer border border-white/20 transition-all active:scale-90"
                              title="Remove gems"
                            >
                              <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                            </button>
                            <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-8 h-8 object-contain" />
                            <span className="font-black text-cyan-400 font-mono text-[10px] truncate max-w-full">
                              {coTheirOfferGems.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {coTheirOfferItems.map((item, idx) => {
                          const hasSign = item.sign?.name && item.sign.name !== "None";

                          return (
                            <div
                              key={`co-their-modal-${idx}`}
                              className={`relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-2.5 text-center flex flex-col items-center justify-between ${
                                hasSign ? "min-h-[142px] pb-3" : "min-h-[116px]"
                              } hover:border-white/30 transition-all duration-300 shadow-md`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.qty > 1) {
                                    setCoTheirOfferItems(coTheirOfferItems.map((it, i) => i === idx ? { ...it, qty: it.qty - 1 } : it));
                                  } else {
                                    setCoTheirOfferItems(coTheirOfferItems.filter((_, i) => i !== idx));
                                  }
                                }}
                                className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 cursor-pointer border border-white/20 transition-all active:scale-90"
                                title={item.qty > 1 ? "Decrement quantity" : "Remove unit"}
                              >
                                <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                              </button>
                              <div className="absolute -top-1.5 -right-1.5 bg-[#252730] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                                x{item.qty}
                              </div>
                              <div className="flex flex-col items-center gap-1 w-full min-w-0">
                                <div className="relative group/img overflow-hidden rounded-xl w-11 h-11 bg-black/40 flex items-center justify-center p-0.5 shadow-inner shrink-0">
                                  <img
                                    src={item.unit?.img}
                                    alt={item.unit?.name}
                                    className="relative w-full h-full object-contain scale-110 group-hover/img:scale-125 transition-transform duration-300 z-10"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="flex flex-col items-center w-full min-w-0">
                                  <div className="h-7 flex items-center justify-center w-full min-w-0 mt-1">
                                    <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit?.name}>
                                      {item.unit?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {hasSign && (
                                <div
                                  className="text-[9.5px] font-black px-1.5 py-1 rounded-lg border w-full text-center uppercase tracking-normal leading-tight shadow-md mt-1.5 transition-all duration-300 select-none flex items-center justify-center gap-1 shrink-0"
                                  style={{
                                    background: item.sign.color.includes("gradient") ? item.sign.color : "#09090b",
                                    borderColor: item.sign.color,
                                    color: item.sign.color,
                                    boxShadow: `0 0 8px ${item.sign.color}20`
                                  }}
                                  title={`Signature: ${item.sign.name}`}
                                >
                                  ✍️ {item.sign.name}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {coTheirOfferItems.length === 0 && coTheirOfferGems === 0 && (
                          <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                            <Gem className="w-5 h-5 opacity-40 text-white/50" />
                            <span className="text-[10px] text-zinc-500 italic">Their offer is empty. Add Units or Gems below!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-3 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setUnitPickerSide('their');
                            setPickerSearchQuery('');
                            setPickerRarityFilter('All');
                            setPickerSelectedUnit(null);
                            setPickerSelectedSign(signatures.find(s => s.name === "None") || signatures[0]);
                            setPickerSelectedQty(1);
                            setPickerContext('counter-offer');
                          }}
                          className="flex-1 bg-zinc-800 border border-white/10 hover:bg-zinc-700 hover:scale-[1.01] active:scale-[0.99] text-white font-black py-3 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider select-none cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> ADD UNIT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGemsModalSide('their');
                            setGemsInputValue(coTheirOfferGems > 0 ? String(coTheirOfferGems) : "");
                            setPickerContext('counter-offer');
                            setIsGemsConfigOpen(true);
                          }}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          💎 Gems
                        </button>
                      </div>

                      <div className="border border-white/5 flex justify-between items-center bg-black/35 px-4 py-2.5 rounded-xl mt-auto">
                        <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Value:</span>
                        <span className="font-mono text-base font-black text-cyan-400">
                          💎 {Math.round(coTheirOfferGems + coTheirOfferItems.reduce((acc, item) => acc + (item.unit?.gems === -1 ? 0 : (item.unit?.gems || 0)) * (1 + (item.sign?.percent || 0) / 100) * item.qty, 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Offer message input */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add custom note or details</label>
                  <input
                    type="text"
                    value={coCustomNote}
                    onChange={(e) => setCoCustomNote(e.target.value)}
                    placeholder="e.g. Let's trade in lobby 4! My Roblox username is..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-white/30 placeholder-slate-600 font-medium transition duration-200"
                  />
                </div>

                <button 
                  type="button" 
                  onClick={() => handleSendStructuredCounterOffer(counterOfferTradeId)}
                  className="bg-white hover:bg-zinc-200 text-black active:scale-[0.99] font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-widest transition w-full mt-2 cursor-pointer shadow-lg"
                >
                  SUBMIT INTERACTIVE COUNTER OFFER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Custom Nested Unit Picker Modal Overlay (Stand on top of Add Trade Modal) */}
      <AnimatePresence>
        {unitPickerSide !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row w-full max-w-3xl h-[78vh] shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setUnitPickerSide(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 hover:bg-white/5 rounded-full transition cursor-pointer z-50 select-none"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Left Column: Rarity sidebar matching Trade Calculator style */}
              <div className="w-full md:w-[150px] bg-white/[0.01] border-b md:border-b-0 md:border-r border-white/5 p-3 overflow-y-auto flex md:flex-col gap-1.5 shrink-0 select-none scrollbar-thin">
                <span className="hidden md:block text-[8px] font-black tracking-widest text-[#a855f7] uppercase mb-1.5 border-b border-white/5 pb-1 select-none">Rarities</span>
                {rarityTabs.map(rarityName => {
                  const rTheme = rarityClasses[rarityName] || rarityClasses.All;
                  const isSelected = pickerRarityFilter === rarityName;
                  const rDot =
                    rarityName === "All" ? "bg-blue-400" :
                    rarityName === "Basic" ? "bg-zinc-400" :
                    rarityName === "Uncommon" ? "bg-emerald-400" :
                    rarityName === "Rare" ? "bg-sky-400" :
                    rarityName === "Epic" ? "bg-purple-400" :
                    rarityName === "Legendary" ? "bg-yellow-400" :
                    rarityName === "Mythic" ? "bg-rose-400" :
                    rarityName === "Exclusive" ? "bg-indigo-400" : "bg-amber-600";

                  return (
                    <button
                      key={`picker-rarity-${rarityName}`}
                      type="button"
                      onClick={() => {
                        setPickerRarityFilter(rarityName);
                        setPickerSelectedUnit(null); // Reset selected unit when filter changes
                      }}
                      className={`text-left text-[10px] md:text-[11px] font-black uppercase tracking-wider py-1.5 px-2 rounded-lg transition-all duration-200 select-none cursor-pointer border flex items-center justify-between gap-1 shadow-sm group shrink-0 ${
                        isSelected
                          ? `${rTheme.bg} ${rTheme.text} ${rTheme.activeBorder} ${rTheme.shadow} scale-[1.01]`
                          : "border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-white hover:border-white/10"
                      }`}
                    >
                      <span>{rarityName}</span>
                      <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isSelected ? `${rDot} animate-pulse shadow-[0_0_8px_currentColor]` : "bg-slate-700 opacity-60 group-hover:opacity-100 group-hover:bg-slate-500"}`} />
                    </button>
                  );
                })}
              </div>

              {/* Center Column: Unit search & list */}
              <div className="flex-1 p-5 flex flex-col overflow-hidden bg-[#07080d]/45">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <PlusCircle className={`w-4.5 h-4.5 text-white animate-pulse`} />
                      SELECT UNIT FOR {unitPickerSide === 'your' ? 'YOUR OFFER' : 'THEIR OFFER'}
                    </h3>
                    <p className="text-[10px] text-slate-500">Pick a character, signature type, and quantity</p>
                  </div>
                </div>

                {/* Search field */}
                <div className="relative mb-4 pr-8 md:pr-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={pickerSearchQuery}
                    onChange={(e) => {
                      setPickerSearchQuery(e.target.value);
                      setPickerSelectedUnit(null); // Reset when query changes
                    }}
                    placeholder="Search units by name..." 
                    className="w-full bg-[#050505]/80 border border-white/10 focus:border-white/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none transition placeholder-slate-600 font-semibold"
                  />
                </div>

                {/* Grid container */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1 content-start scrollbar-thin">
                  {filteredPickerUnits.map(unit => {
                    return (
                      <button
                        key={unit.name}
                        type="button"
                        onClick={() => {
                          setPickerSelectedUnit(unit);
                          setPickerSelectedSign(signatures.find(s => s.name === "None") || signatures[0]);
                          setPickerSelectedQty(1);
                          setIsConfigureUnitOpen(true);
                          setIsPickerSignDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 bg-[#09090b]/40 hover:bg-[#18181b]/85 border border-white/5 hover:border-white/10 p-2 rounded-xl text-left transition duration-200 active:scale-[0.98] select-none cursor-pointer"
                      >
                        <div className="w-10 h-10 shrink-0 overflow-hidden rounded-lg bg-black/30"><img src={unit.img} className="w-full h-full object-contain scale-110" alt="" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10.5px] font-extrabold text-white leading-tight truncate w-full">{unit.name}</div>
                          <div className="flex gap-1 items-center mt-0.5">
                            <span className="text-[9px] font-black text-cyan-400 font-mono">{unit.gems === -1 ? "N/A" : `💎 ${unit.gems.toLocaleString()}`}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {filteredPickerUnits.length === 0 && (
                    <div className="col-span-full text-center py-12 text-xs text-slate-600 italic">No matching units found.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Unit Customization & Addition modal (Nested centered modal overlay) */}
      <AnimatePresence>
        {isConfigureUnitOpen && pickerSelectedUnit && (
          <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-zinc-950/95 border border-white/10 p-6 rounded-3xl w-full max-w-sm flex flex-col gap-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
            >
              <button
                type="button"
                onClick={() => setIsConfigureUnitOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition select-none cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center flex flex-col items-center mt-2">
                <div className="w-24 h-24 mb-3 overflow-hidden rounded-2xl shadow-xl"><img src={pickerSelectedUnit.img} alt={pickerSelectedUnit.name} className="w-full h-full object-contain scale-110" /></div>
                <h4 className="text-lg font-black text-white tracking-wide">{pickerSelectedUnit.name}</h4>
                <span className={`text-[9px] font-black uppercase tracking-widest py-1 px-3.5 rounded-full mt-2 border
                  ${pickerSelectedUnit.rarity === "Basic" ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" :
                    pickerSelectedUnit.rarity === "Uncommon" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]" :
                    pickerSelectedUnit.rarity === "Rare" ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]" :
                    pickerSelectedUnit.rarity === "Epic" ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_8px_rgba(147,51,234,0.15)]" :
                    pickerSelectedUnit.rarity === "Legendary" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.15)]" :
                    pickerSelectedUnit.rarity === "Mythic" ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(225,29,72,0.15)]" :
                    pickerSelectedUnit.rarity === "Exclusive" ? "bg-white/5 text-white border-white/10 shadow-[0_0_8px_rgba(79,70,229,0.15)]" :
                    pickerSelectedUnit.rarity === "Crate" ? "bg-amber-600/10 text-amber-550 border-amber-600/20 shadow-[0_0_8px_rgba(217,119,6,0.15)]" :
                    "bg-white/5 text-slate-400 border-white/5"}`}
                >
                  {pickerSelectedUnit.rarity}
                </span>
              </div>

              {/* Signature Dropdown Select */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-wider">Select Custom Signature</label>
                <button
                  type="button"
                  onClick={() => setIsPickerSignDropdownOpen(!isPickerSignDropdownOpen)}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-[0.99] border border-white/10 rounded-xl p-3 text-left font-bold text-white text-xs flex justify-between items-center focus:outline-none select-none cursor-pointer hover:border-white/20 transition-all duration-300"
                >
                  <span
                    style={{
                      background: pickerSelectedSign.color.includes("gradient") ? pickerSelectedSign.color : undefined,
                      color: pickerSelectedSign.color.includes("gradient") ? "#fff" : pickerSelectedSign.color,
                      WebkitBackgroundClip: pickerSelectedSign.color.includes("gradient") ? "text" : undefined,
                      WebkitTextFillColor: pickerSelectedSign.color.includes("gradient") ? "transparent" : undefined
                    }}
                    className={pickerSelectedSign.color.includes("gradient") ? "font-black" : "font-semibold"}
                  >
                    ✍️ {pickerSelectedSign.name} {pickerSelectedSign.percent > 0 ? `(+${pickerSelectedSign.percent}%)` : ""}
                  </span>
                  <span className="text-xs text-slate-400">▼</span>
                </button>
                {isPickerSignDropdownOpen && (
                  <div className="absolute bottom-[102%] left-0 right-0 max-h-[160px] overflow-y-auto bg-black border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col scrollbar-thin">
                    {signatures.map(sign => (
                      <button
                        key={sign.name}
                        type="button"
                        onClick={() => {
                          setPickerSelectedSign(sign);
                          setIsPickerSignDropdownOpen(false);
                        }}
                        className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 text-xs flex justify-between items-center select-none cursor-pointer"
                      >
                        <span
                          style={{
                            background: sign.color.includes("gradient") ? sign.color : "transparent",
                            color: sign.color.includes("gradient") ? "#fff" : sign.color,
                            WebkitBackgroundClip: sign.color.includes("gradient") ? "text" : undefined,
                            WebkitTextFillColor: sign.color.includes("gradient") ? "transparent" : undefined
                          }}
                          className={sign.color.includes("gradient") ? "font-black" : "font-semibold"}
                        >
                          ✍️ {sign.name}
                        </span>
                        <span className="text-[10px] text-[#a855f7] font-mono font-bold">{sign.percent > 0 ? `+${sign.percent}%` : ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity config */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Specify Quantity</label>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setPickerSelectedQty(Math.max(1, (Number(pickerSelectedQty) || 1) - 1))}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 hover:border-white/20 active:scale-95 transition flex items-center justify-center select-none cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={pickerSelectedQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setPickerSelectedQty("");
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setPickerSelectedQty(Math.max(1, parsed));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (pickerSelectedQty === "" || pickerSelectedQty < 1) {
                        setPickerSelectedQty(1);
                      }
                    }}
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white text-base text-center focus:outline-none focus:border-white/50/30 transition font-black"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerSelectedQty((Number(pickerSelectedQty) || 1) + 1)}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 hover:border-white/20 active:scale-95 transition flex items-center justify-center select-none cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 p-3 rounded-xl text-center text-xs font-black text-white font-mono tracking-wide shadow-sm">
                Combined Value: {pickerSelectedUnit.gems === -1 ? "N/A" : `💎 ${Math.round(pickerSelectedUnit.gems * (1 + pickerSelectedSign.percent / 100) * (Number(pickerSelectedQty) || 1)).toLocaleString()}`}
              </div>

              <button
                type="button"
                onClick={() => {
                  const finalQty = Number(pickerSelectedQty) || 1;
                  const newItem: TradeOfferItem = {
                    unit: pickerSelectedUnit,
                    sign: pickerSelectedSign,
                    qty: finalQty
                  };
                  if (pickerContext === "dm-proposal") {
                    if (unitPickerSide === 'your') {
                      const existingIdx = dmYourOfferItems.findIndex(
                        item => item.unit?.name === pickerSelectedUnit.name && item.sign?.name === pickerSelectedSign.name
                      );
                      if (existingIdx > -1) {
                        const updated = [...dmYourOfferItems];
                        updated[existingIdx].qty += finalQty;
                        setDmYourOfferItems(updated);
                      } else {
                        setDmYourOfferItems([...dmYourOfferItems, newItem]);
                      }
                    } else {
                      const existingIdx = dmTheirOfferItems.findIndex(
                        item => item.unit?.name === pickerSelectedUnit.name && item.sign?.name === pickerSelectedSign.name
                      );
                      if (existingIdx > -1) {
                        const updated = [...dmTheirOfferItems];
                        updated[existingIdx].qty += finalQty;
                        setDmTheirOfferItems(updated);
                      } else {
                        setDmTheirOfferItems([...dmTheirOfferItems, newItem]);
                      }
                    }
                  } else if (pickerContext === "counter-offer") {
                    if (unitPickerSide === 'your') {
                      const existingIdx = coYourOfferItems.findIndex(
                        item => item.unit?.name === pickerSelectedUnit.name && item.sign?.name === pickerSelectedSign.name
                      );
                      if (existingIdx > -1) {
                        const updated = [...coYourOfferItems];
                        updated[existingIdx].qty += finalQty;
                        setCoYourOfferItems(updated);
                      } else {
                        setCoYourOfferItems([...coYourOfferItems, newItem]);
                      }
                    } else {
                      const existingIdx = coTheirOfferItems.findIndex(
                        item => item.unit?.name === pickerSelectedUnit.name && item.sign?.name === pickerSelectedSign.name
                      );
                      if (existingIdx > -1) {
                        const updated = [...coTheirOfferItems];
                        updated[existingIdx].qty += finalQty;
                        setCoTheirOfferItems(updated);
                      } else {
                        setCoTheirOfferItems([...coTheirOfferItems, newItem]);
                      }
                    }
                  } else {
                    if (unitPickerSide === 'your') {
                      const existingIdx = yourOfferItems.findIndex(
                        item => item.unit?.name === pickerSelectedUnit.name && item.sign?.name === pickerSelectedSign.name
                      );
                      if (existingIdx > -1) {
                        const updated = [...yourOfferItems];
                        updated[existingIdx].qty += finalQty;
                        setYourOfferItems(updated);
                      } else {
                        setYourOfferItems([...yourOfferItems, newItem]);
                      }
                    } else {
                      const existingIdx = theirOfferItems.findIndex(
                        item => item.unit?.name === pickerSelectedUnit.name && item.sign?.name === pickerSelectedSign.name
                      );
                      if (existingIdx > -1) {
                        const updated = [...theirOfferItems];
                        updated[existingIdx].qty += finalQty;
                        setTheirOfferItems(updated);
                      } else {
                        setTheirOfferItems([...theirOfferItems, newItem]);
                      }
                    }
                  }
                  setIsConfigureUnitOpen(false);
                  setUnitPickerSide(null);
                }}
                className="w-full py-4 bg-white hover:bg-zinc-200 text-black active:scale-[0.98] font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-none transition-all duration-200 select-none cursor-pointer"
              >
                ADD TO {unitPickerSide === 'your' ? "YOUR OFFER" : "THEIR OFFER"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Gems Configuration Modal */}
      <AnimatePresence>
        {isGemsConfigOpen && (
          <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-zinc-950/95 border border-white/10 p-6 rounded-3xl w-full max-w-sm flex flex-col gap-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
            >
              <button
                type="button"
                onClick={() => setIsGemsConfigOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition select-none cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center flex flex-col items-center mt-2">
                <div className="relative group/glow">
                  <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="relative w-20 h-20 object-contain filter drop-shadow-md mb-3" />
                </div>
                <h4 className="text-lg font-black text-white tracking-wide uppercase">CONFIGURE GEMS</h4>
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-1">
                  FOR {gemsModalSide === 'your' ? "YOUR OFFER" : "THEIR OFFER"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount of Gems</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg select-none">💎</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter gems amount..."
                    value={gemsInputValue}
                    onChange={(e) => setGemsInputValue(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-white/50/50 rounded-2xl py-3.5 pl-11 pr-4 text-white text-base text-center font-mono font-black focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmGems}
                className="w-full py-4 bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-none transition-all duration-200 select-none cursor-pointer"
              >
                APPLY GEMS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Report User/Message Modal */}
      <AnimatePresence>
        {reportingMessage && (
          <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#12131a] border border-[#2b2d35]/60 p-6 rounded-3xl w-full max-w-md flex flex-col gap-5 shadow-[0_0_50px_rgba(0,0,0,0.85)] relative text-left"
            >
              <button
                type="button"
                onClick={() => { setReportingMessage(null); setReportingChat(null); }}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition select-none cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-white/5 pb-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Submit Community Complaint</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Reporting message from <span className="text-white font-bold">{reportingMessage.senderName}</span></p>
                </div>
              </div>

              {/* Message Context */}
              <div className="bg-black/35 border border-white/5 rounded-xl p-3.5 text-xs">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider font-mono block mb-1">Message Content:</span>
                <p className="text-slate-300 font-medium leading-relaxed italic">"{reportingMessage.text}"</p>
              </div>

              {/* Select Reason */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason for Complaint</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Spamming", "Forbidden Word Bypass", "Scam/Deceptive Offer", "Insults / Toxicity", "Other"].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReportReason(r)}
                      className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold transition text-left cursor-pointer ${
                        reportReason === r 
                          ? "bg-white/10 border-white/40 text-white" 
                          : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Area */}
              {reportReason === "Other" && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex justify-between">
                    <span>Provide details</span>
                    <span className={customReportReason.length >= 250 ? "text-zinc-400" : "text-slate-500"}>
                      {customReportReason.length}/250
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={250}
                    placeholder="Provide specific details about this violation..."
                    value={customReportReason}
                    onChange={(e) => setCustomReportReason(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-white/50 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none transition-all duration-200 resize-none font-semibold"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => { setReportingMessage(null); setReportingChat(null); }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  disabled={!reportReason || (reportReason === "Other" && !customReportReason.trim())}
                  className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black disabled:opacity-40 font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-none"
                >
                  Submit Complaint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
