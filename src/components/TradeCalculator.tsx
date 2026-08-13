import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Swords, Save, Search, ArrowUpDown, X, Gem, Trash2, ShieldAlert, Award, FileSpreadsheet, BadgePercent, Sparkles, History, Calendar, Copy, Check } from "lucide-react";
import { Yl, Hl } from "../data";
import { Unit, SignValue, SavedTrade, TradeOfferItem } from "../types";

// Rarity theme configuration matching value list page
const rarityClasses: Record<string, { bg: string; text: string; shadow: string; border: string; activeBorder: string; hoverBg: string; hoverText: string; accentGlow: string }> = {
  All: { bg: "bg-white/5", text: "text-zinc-200", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-white/20", hoverBg: "hover:bg-white/10", hoverText: "hover:text-white", accentGlow: "rgba(255,255,255,0.1)" },
  Basic: { bg: "bg-zinc-500/5", text: "text-zinc-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-zinc-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-zinc-300", accentGlow: "rgba(113,113,122,0.1)" },
  Uncommon: { bg: "bg-emerald-500/5", text: "text-emerald-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-emerald-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-emerald-300", accentGlow: "rgba(16,185,129,0.1)" },
  Rare: { bg: "bg-sky-500/5", text: "text-sky-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-sky-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-sky-300", accentGlow: "rgba(14,165,233,0.1)" },
  Epic: { bg: "bg-purple-500/5", text: "text-purple-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-purple-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-purple-300", accentGlow: "rgba(147,51,234,0.1)" },
  Legendary: { bg: "bg-yellow-500/5", text: "text-yellow-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-yellow-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-yellow-300", accentGlow: "rgba(234,179,8,0.1)" },
  Mythic: { bg: "bg-rose-500/5", text: "text-rose-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-rose-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-rose-300", accentGlow: "rgba(225,29,72,0.1)" },
  Exclusive: { bg: "bg-indigo-500/5", text: "text-white", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-indigo-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-indigo-300", accentGlow: "rgba(79,70,229,0.1)" },
  Godly: { bg: "bg-cyan-500/5", text: "text-cyan-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-cyan-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-cyan-300", accentGlow: "rgba(6,182,212,0.1)" },
  Crate: { bg: "bg-zinc-500/5", text: "text-zinc-400", shadow: "shadow-none", border: "border-white/5", activeBorder: "border-zinc-500/30", hoverBg: "hover:bg-zinc-800/50", hoverText: "hover:text-zinc-300", accentGlow: "rgba(113,113,122,0.1)" }
};



export default function TradeCalculator({ units: propUnits, signatures: propSignatures }: { units?: Unit[]; signatures?: SignValue[] }) {
  const units = propUnits || Yl;
  const signatures = propSignatures || Hl;

  const [yourOffer, setYourOffer] = useState<TradeOfferItem[]>(() => {
    try {
      const saved = localStorage.getItem("lttd_your_offer");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [theirOffer, setTheirOffer] = useState<TradeOfferItem[]>(() => {
    try {
      const saved = localStorage.getItem("lttd_their_offer");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [yourGems, setYourGems] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("lttd_your_gems");
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [theirGems, setTheirGems] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("lttd_their_gems");
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [savedTrades, setSavedTrades] = useState<SavedTrade[]>(() => {
    try {
      const saved = localStorage.getItem("lttd_saved_trades");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal open states
  const [isSavesModalOpen, setIsSavesModalOpen] = useState(false);
  const [isSaveTradeOpen, setIsSaveTradeOpen] = useState(false);
  const [tradeLabel, setTradeLabel] = useState("");
  const [validationError, setValidationError] = useState("");

  const [activeOfferSide, setActiveOfferSide] = useState<"your" | "their">("your");
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [rarityFilter, setRarityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");

  const [isConfigureUnitOpen, setIsConfigureUnitOpen] = useState(false);
  const [activeConfigUnit, setActiveConfigUnit] = useState<Unit | null>(null);
  const [configSign, setConfigSign] = useState<SignValue>(signatures.find(item => item.name === "None") || signatures[0]);
  const [configQty, setConfigQty] = useState<number | "">(1);

  // Dropdown open states
  const [isSignDropdownOpen, setIsSignDropdownOpen] = useState(false);

  // Gems configuration modal
  const [isGemsModalOpen, setIsGemsModalOpen] = useState(false);
  const [gemsInputValue, setGemsInputValue] = useState("");

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("lttd_your_offer", JSON.stringify(yourOffer));
  }, [yourOffer]);

  useEffect(() => {
    localStorage.setItem("lttd_their_offer", JSON.stringify(theirOffer));
  }, [theirOffer]);

  useEffect(() => {
    localStorage.setItem("lttd_your_gems", String(yourGems));
  }, [yourGems]);

  useEffect(() => {
    localStorage.setItem("lttd_their_gems", String(theirGems));
  }, [theirGems]);

  useEffect(() => {
    localStorage.setItem("lttd_saved_trades", JSON.stringify(savedTrades));
  }, [savedTrades]);

  // Trade History / Recent Calculations State
  const [recentCalculations, setRecentCalculations] = useState<SavedTrade[]>(() => {
    try {
      const saved = localStorage.getItem("lttd_recent_calculations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedToDiscord, setCopiedToDiscord] = useState(false);

  // Auto-save trades to calculation history (last 5 calculations)
  useEffect(() => {
    if (yourOffer.length === 0 && theirOffer.length === 0 && yourGems === 0 && theirGems === 0) return;
    
    const timer = setTimeout(() => {
      // Save if there is at least something on both sides to represent a complete calculation
      if ((yourOffer.length > 0 || yourGems > 0) && (theirOffer.length > 0 || theirGems > 0)) {
        setRecentCalculations(prev => {
          // Check if current state is exactly equal to the latest history item to prevent spamming duplicates
          const currentKey = JSON.stringify({ yourOffer, theirOffer, yourGems, theirGems });
          if (prev.length > 0) {
            const latestKey = JSON.stringify({
              yourOffer: prev[0].yourOffer,
              theirOffer: prev[0].theirOffer,
              yourGems: prev[0].yourGems,
              theirGems: prev[0].theirGems
            });
            if (currentKey === latestKey) return prev;
          }

          // Generate a user-friendly name with timestamp
          const nowStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const newCalc: SavedTrade = {
            id: String(Date.now()),
            name: `Расчет в ${nowStr}`,
            yourOffer: [...yourOffer],
            theirOffer: [...theirOffer],
            yourGems,
            theirGems,
            yourTotal: calculateTotal(yourOffer, yourGems),
            theirTotal: calculateTotal(theirOffer, theirGems),
            date: new Date().toLocaleDateString("ru-RU") + " " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
          };

          const updated = [newCalc, ...prev].slice(0, 5);
          localStorage.setItem("lttd_recent_calculations", JSON.stringify(updated));
          return updated;
        });
      }
    }, 2500); // 2.5 seconds debounce to wait for user to finish editing
    
    return () => clearTimeout(timer);
  }, [yourOffer, theirOffer, yourGems, theirGems]);

  const copyTradeToDiscord = () => {
    let text = "**📥 YOUR OFFER:**\n";
    if (yourOffer.length === 0 && yourGems === 0) {
      text += "• Empty\n";
    } else {
      yourOffer.forEach(item => {
        const signText = item.sign.name !== "None" ? ` (Signature: ${item.sign.name})` : "";
        const eachGemsText = item.unit.gems === -1 ? "N/A" : `💎 ${(item.unit.gems * (1 + item.sign.percent / 100)).toLocaleString("en-US")}`;
        text += `• ${item.qty}x **${item.unit.name}**${signText} (${eachGemsText} each)\n`;
      });
      if (yourGems > 0) {
        text += `• 💰 **${yourGems.toLocaleString("en-US")}** Gems\n`;
      }
    }
    text += `👉 *Total Value:* 💎 **${yourTotal.toLocaleString("en-US")}** Gems\n\n`;

    text += "**📤 THEIR OFFER:**\n";
    if (theirOffer.length === 0 && theirGems === 0) {
      text += "• Empty\n";
    } else {
      theirOffer.forEach(item => {
        const signText = item.sign.name !== "None" ? ` (Signature: ${item.sign.name})` : "";
        const eachGemsText = item.unit.gems === -1 ? "N/A" : `💎 ${(item.unit.gems * (1 + item.sign.percent / 100)).toLocaleString("en-US")}`;
        text += `• ${item.qty}x **${item.unit.name}**${signText} (${eachGemsText} each)\n`;
      });
      if (theirGems > 0) {
        text += `• 💰 **${theirGems.toLocaleString("en-US")}** Gems\n`;
      }
    }
    text += `👉 *Total Value:* 💎 **${theirTotal.toLocaleString("en-US")}** Gems\n\n`;

    text += "**⚖️ TRADE BALANCE:**\n";
    const diff = theirTotal - yourTotal;
    if (yourTotal === 0 && theirTotal === 0) {
      text += "⚖️ Waiting for offers...";
    } else if (diff > 0) {
      text += `📈 **Win!** You are gaining 💎 **+${diff.toLocaleString("en-US")}** Gems (Win!).`;
    } else if (diff < 0) {
      text += `📉 **Loss!** You are losing 💎 **-${Math.abs(diff).toLocaleString("en-US")}** Gems (Overpay!).`;
    } else {
      text += "⚖️ **Fair Trade!** The trade is completely even and fair.";
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedToDiscord(true);
      setTimeout(() => setCopiedToDiscord(false), 2000);
    });
  };

  const rarityTabs = ["All", "Basic", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Exclusive", "Crate"];

  // Helper values calculation
  const calculateTotal = (offer: { unit: Unit; sign: SignValue; qty: number }[], gems: number) => {
    return offer.reduce((sum, item) => {
      const signMultiplier = 1 + item.sign.percent / 100;
      const baseGems = item.unit.gems === -1 ? 0 : item.unit.gems;
      return sum + Math.round(baseGems * signMultiplier) * item.qty;
    }, 0) + gems;
  };

  const yourTotal = useMemo(() => calculateTotal(yourOffer, yourGems), [yourOffer, yourGems]);
  const theirTotal = useMemo(() => calculateTotal(theirOffer, theirGems), [theirOffer, theirGems]);

  const tradeOutcome = useMemo(() => {
    if (yourTotal === 0 && theirTotal === 0) {
      return { text: "Waiting for Offers...", color: "text-zinc-400 border-zinc-800 bg-zinc-900/10", icon: "⚖️" };
    }
    const diff = theirTotal - yourTotal;
    if (diff > 0) {
      return {
        text: `Win (+${diff.toLocaleString()} Gems)`,
        color: "text-white border-white/20 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]",
        icon: "📈"
      };
    } else if (diff < 0) {
      return {
        text: `Loss (${diff.toLocaleString()} Gems)`,
        color: "text-zinc-400 border-white/5 bg-zinc-900/50 shadow-none",
        icon: "📉"
      };
    }
    return { text: "Fair Trade", color: "text-white border-zinc-700 bg-zinc-800/10", icon: "⚖️" };
  }, [yourTotal, theirTotal]);

  const balanceSuggestions = useMemo(() => {
    const diff = theirTotal - yourTotal;
    if (diff === 0) return [];
    
    const targetDiff = Math.abs(diff);
    // Find units that have values close to targetDiff, sorted by how close they are
    const candidates = [...units]
      .filter(u => u.gems > 0 && u.gems <= targetDiff * 2.5)
      .map(u => ({
        unit: u,
        closeness: Math.abs(u.gems - targetDiff)
      }))
      .sort((a, b) => a.closeness - b.closeness)
      .slice(0, 3)
      .map(item => item.unit);
      
    return candidates;
  }, [yourTotal, theirTotal, units]);

  const handleAddSuggestedUnit = (unit: Unit, side: "your" | "their") => {
    const setTargetList = side === "your" ? setYourOffer : setTheirOffer;
    const targetList = side === "your" ? yourOffer : theirOffer;
    const matchedIdx = targetList.findIndex(
      item => item.unit.name === unit.name && item.sign.name === "None"
    );
    if (matchedIdx > -1) {
      setTargetList(prev => {
        const copy = [...prev];
        copy[matchedIdx].qty += 1;
        return copy;
      });
    } else {
      const defaultSign = signatures.find(s => s.name === "None") || { name: "None", percent: 0, color: "text-zinc-400" };
      setTargetList(prev => [...prev, { unit, sign: defaultSign, qty: 1 }]);
    }
  };

  const handleOpenSaveDialog = () => {
    if (yourOffer.length === 0 && yourGems === 0 && theirOffer.length === 0 && theirGems === 0) {
      setValidationError("Offer lists are empty. Build a trade first before saving!");
      setTradeLabel("");
    } else {
      setValidationError("");
      const nowTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const nowDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const yourCount = yourOffer.reduce((sum, item) => sum + item.qty, 0);
      const theirCount = theirOffer.reduce((sum, item) => sum + item.qty, 0);
      let preview = "";

      if (yourCount > 0 || yourGems > 0) {
        preview += `You: ${yourGems > 0 ? "💰" + yourGems.toLocaleString() : ""}${yourCount > 0 ? (yourGems > 0 ? " + " : "") + yourCount + " Unit" + (yourCount > 1 ? "s" : "") : ""}`;
      }
      if (theirCount > 0 || theirGems > 0) {
        if (preview) preview += " ⇄ ";
        preview += `Them: ${theirGems > 0 ? "💰" + theirGems.toLocaleString() : ""}${theirCount > 0 ? (theirGems > 0 ? " + " : "") + theirCount + " Unit" + (theirCount > 1 ? "s" : "") : ""}`;
      }
      if (!preview) preview = "Empty Trade";

      setTradeLabel(`${preview} (${nowDate} ${nowTime})`);
    }
    setIsSaveTradeOpen(true);
  };

  const handleConfirmSave = () => {
    if (yourOffer.length === 0 && yourGems === 0 && theirOffer.length === 0 && theirGems === 0) {
      setValidationError("Offer lists are empty. Build a trade first before saving!");
      return;
    }
    if (savedTrades.length >= 10) {
      setValidationError("You reached the limit of 10 saved trades. Delete an old trade first!");
      return;
    }

    const title = tradeLabel.trim() || `Trade #${savedTrades.length + 1}`;
    const newSave: SavedTrade = {
      id: String(Date.now()),
      name: title,
      yourOffer: [...yourOffer],
      theirOffer: [...theirOffer],
      yourGems,
      theirGems,
      yourTotal,
      theirTotal,
      date: new Date().toLocaleDateString("en-US") + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };

    setSavedTrades(prev => [newSave, ...prev]);
    setIsSaveTradeOpen(false);
    setTradeLabel("");
    setValidationError("");
  };

  const handleLoadSaved = (saved: SavedTrade) => {
    setYourOffer(saved.yourOffer || []);
    setTheirOffer(saved.theirOffer || []);
    setYourGems(saved.yourGems || 0);
    setTheirGems(saved.theirGems || 0);
    setIsSavesModalOpen(false);
  };

  const handleDeleteSaved = (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setSavedTrades(prev => prev.filter(item => item.id !== id));
  };

  const handleClearSide = (side: "your" | "their") => {
    if (side === "your") {
      setYourOffer([]);
      setYourGems(0);
    } else {
      setTheirOffer([]);
      setTheirGems(0);
    }
  };

  const handleRemoveItem = (side: "your" | "their", index: number) => {
    if (side === "your") {
      setYourOffer(prev => {
        const item = prev[index];
        if (item && item.qty > 1) {
          return prev.map((it, idx) => idx === index ? { ...it, qty: it.qty - 1 } : it);
        }
        return prev.filter((_, idx) => idx !== index);
      });
    } else {
      setTheirOffer(prev => {
        const item = prev[index];
        if (item && item.qty > 1) {
          return prev.map((it, idx) => idx === index ? { ...it, qty: it.qty - 1 } : it);
        }
        return prev.filter((_, idx) => idx !== index);
      });
    }
  };

  const handleOpenAddUnit = (side: "your" | "their") => {
    setActiveOfferSide(side);
    setIsAddUnitOpen(true);
    setSearchQuery("");
    setRarityFilter("All");
    setSortOption("default");
  };

  const handleSelectUnit = (unit: Unit) => {
    setActiveConfigUnit(unit);
    setConfigSign(signatures.find(item => item.name === "None") || signatures[0]);
    setConfigQty(1);
    setIsConfigureUnitOpen(true);
  };

  const handleConfirmAddToOffer = () => {
    if (!activeConfigUnit) return;

    const finalQty = Number(configQty) || 1;

    const newItem: TradeOfferItem = {
      unit: activeConfigUnit,
      sign: configSign,
      qty: finalQty
    };

    const targetList = activeOfferSide === "your" ? yourOffer : theirOffer;
    const setTargetList = activeOfferSide === "your" ? setYourOffer : setTheirOffer;

    const matchedIdx = targetList.findIndex(
      item =>
        item.unit.name === activeConfigUnit.name &&
        item.sign.name === configSign.name
    );

    if (matchedIdx > -1) {
      setTargetList(prev => {
        const copy = [...prev];
        copy[matchedIdx].qty += finalQty;
        return copy;
      });
    } else {
      setTargetList(prev => [...prev, newItem]);
    }

    setIsConfigureUnitOpen(false);
    setIsAddUnitOpen(false);
    setActiveConfigUnit(null);
  };

  const handleOpenGemsConfig = (side: "your" | "their") => {
    setActiveOfferSide(side);
    const gemsValue = side === "your" ? yourGems : theirGems;
    setGemsInputValue(gemsValue > 0 ? String(gemsValue) : "");
    setIsGemsModalOpen(true);
  };

  const handleConfirmGems = () => {
    const gems = Math.max(0, parseInt(gemsInputValue, 10) || 0);
    if (activeOfferSide === "your") {
      setYourGems(gems);
    } else {
      setTheirGems(gems);
    }
    setIsGemsModalOpen(false);
  };

  // Process filters for selectable list of units
  const addableUnitsList = useMemo(() => {
    let list = [...units];
    if (rarityFilter !== "All") {
      list = list.filter(u => u.rarity.toLowerCase() === rarityFilter.toLowerCase());
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q));
    }

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

    if (sortOption === "price-desc") {
      list.sort((a, b) => {
        const valA = a.gems === -1 ? -Infinity : a.gems;
        const valB = b.gems === -1 ? -Infinity : b.gems;
        return valB - valA;
      });
    } else if (sortOption === "price-asc") {
      list.sort((a, b) => {
        const valA = a.gems === -1 ? Infinity : a.gems;
        const valB = b.gems === -1 ? Infinity : b.gems;
        return valA - valB;
      });
    } else if (sortOption === "demand-desc") {
      list.sort((a, b) => b.demand - a.demand);
    } else {
      list.sort((a, b) => {
        const rA = getRarityIndex(a.rarity);
        const rB = getRarityIndex(b.rarity);
        if (rA !== rB) return rA - rB;
        const valA = a.gems === -1 ? Infinity : a.gems;
        const valB = b.gems === -1 ? Infinity : b.gems;
        return valA - valB;
      });
    }
    return list;
  }, [rarityFilter, searchQuery, sortOption]);

  const singleUnitCombinedValue = useMemo(() => {
    if (!activeConfigUnit) return 0;
    const baseValue = activeConfigUnit.gems === -1 ? 0 : activeConfigUnit.gems;
    const signBoostMultiplier = 1 + configSign.percent / 100;
    return Math.round(baseValue * signBoostMultiplier);
  }, [activeConfigUnit, configSign]);

  return (
    <div id="trading-calculator-section" className="flex flex-col gap-6 w-full relative">
      {/* Top action row */}
      <div className="bg-[#18181b] border border-white/5 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl transition-all duration-300 hover:border-zinc-700/35">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl text-zinc-300">
            <Gem className="w-5 h-5" />
          </div>
          <div className="text-left cursor-default">
            <h4 className="text-xs font-black tracking-widest text-zinc-300 uppercase">Saved Trades</h4>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsSavesModalOpen(true)}
            className="flex-1 sm:flex-initial bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.97] border border-white/10 text-zinc-300 hover:text-white text-xs font-black uppercase py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none shadow-md hover:shadow-lg"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            My Saves ({savedTrades.length}/10)
          </button>
          <button
            onClick={handleOpenSaveDialog}
            className="flex-1 sm:flex-initial bg-white text-black hover:bg-zinc-200 active:scale-[0.97] text-xs font-black uppercase py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all duration-300 cursor-pointer select-none"
          >
            <Save className="w-3.5 h-3.5" />
            Save Current
          </button>
        </div>
      </div>

      {/* Two Columns Offers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Your offer side */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black tracking-widest text-zinc-200 flex items-center gap-2 uppercase">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                YOUR OFFER
              </h3>
              <button
                onClick={() => handleClearSide("your")}
                className="text-xs font-black uppercase text-zinc-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Offer List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[250px] content-start overflow-y-auto mb-6 max-h-[350px] p-2 pr-3.5 pb-4">
              {yourGems > 0 && (
                <div className="relative group bg-[#18181b] border border-white/10 rounded-2xl p-3 pt-4 pb-3 text-center flex flex-col items-center justify-center gap-1.5 shadow-lg select-none min-h-[160px]">
                  <button
                    onClick={() => setYourGems(0)}
                    className="absolute -top-1 -left-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md z-25 select-none cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                  >
                    <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                  </button>
                  <div className="absolute -top-1 -right-1 bg-zinc-700 border border-white/10 text-white font-black text-[8px] px-2 py-0.5 rounded-lg shadow-md uppercase tracking-wider select-none z-25 font-mono">
                    GEMS
                  </div>
                  <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-14 h-14 object-contain mt-1" />
                  <span className="font-black text-zinc-300 font-mono text-xs sm:text-sm whitespace-nowrap block truncate max-w-full">
                    {yourGems.toLocaleString("en-US")}
                  </span>
                </div>
              )}

              {yourOffer.map((item, idx) => {
                const hasSign = item.sign.name !== "None";
                const isDecorated = hasSign;
                const rStyle = rarityClasses[item.unit.rarity] || rarityClasses.Basic;

                return (
                  <div
                    key={`your-calc-${idx}`}
                    className={`relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-3 text-center flex flex-col items-center justify-between ${
                      hasSign ? "min-h-[148px]" : "min-h-[116px]"
                    } hover:border-zinc-500/60 hover:scale-[1.02] transition-all duration-300 shadow-md`}
                  >
                    <button
                      onClick={() => handleRemoveItem("your", idx)}
                      className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 select-none cursor-pointer border border-white/20 transition-all active:scale-90"
                      title="Remove unit"
                    >
                      <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                    </button>
                    <div className="absolute -top-1.5 -right-1.5 bg-[#22242c] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                      x{item.qty}
                    </div>

                    <div className="flex flex-col items-center gap-1 w-full min-w-0">
                      <div className="relative group/img overflow-hidden rounded-xl w-12 h-12 bg-[#050505] shadow-inner shrink-0 flex items-center justify-center p-0.5">
                        <img 
                          src={item.unit.img} 
                          alt={item.unit.name} 
                          className="relative w-full h-full object-contain scale-110 group-hover/img:scale-125 transition-transform duration-300 z-10" 
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col items-center w-full min-w-0 mt-0.5">
                        <div className="h-7 flex items-center justify-center w-full min-w-0">
                          <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit.name}>
                            {item.unit.name}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">D: {item.unit.demand}/10</span>
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

              {yourOffer.length === 0 && yourGems === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Gem className="w-8 h-8 opacity-40 text-zinc-500" />
                  <span>Your offer is empty. Add Units or Gems below!</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => handleOpenAddUnit("your")}
                className="flex-1 bg-white hover:bg-zinc-200 text-black font-black py-3 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest select-none cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Unit
              </button>
              <button
                onClick={() => handleOpenGemsConfig("your")}
                className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-black py-3 px-5 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-xs uppercase tracking-widest select-none cursor-pointer"
              >
                <Gem className="w-4 h-4" />
                Gems
              </button>
            </div>

            <div className="border border-white/5 pt-4 flex justify-between items-center bg-black/25 px-4 py-3 rounded-2xl">
              <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wider">Total Value:</span>
              <span className="font-sans text-xl sm:text-2xl font-black text-white flex items-center gap-1">
                💎 {yourTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Their offer side */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black tracking-widest text-zinc-200 flex items-center gap-2 uppercase">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                THEIR OFFER
              </h3>
              <button
                onClick={() => handleClearSide("their")}
                className="text-xs font-black uppercase text-zinc-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all duration-200 select-none cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Offer List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[250px] content-start overflow-y-auto mb-6 max-h-[350px] p-2 pr-3.5 pb-4">
              {theirGems > 0 && (
                <div className="relative group bg-[#18181b] border border-white/10 rounded-2xl p-3 pt-4 pb-3 text-center flex flex-col items-center justify-center gap-1.5 shadow-lg select-none min-h-[160px]">
                  <button
                    onClick={() => setTheirGems(0)}
                    className="absolute -top-1 -left-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md z-25 select-none cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                  >
                    <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                  </button>
                  <div className="absolute -top-1 -right-1 bg-zinc-700 border border-white/10 text-white font-black text-[8px] px-2 py-0.5 rounded-lg shadow-md uppercase tracking-wider select-none z-25 font-mono">
                    GEMS
                  </div>
                  <img src="https://i.postimg.cc/qR8yjnQD/toilet-tower-defense-currency.webp" alt="gems" className="w-14 h-14 object-contain mt-1" />
                  <span className="font-black text-zinc-300 font-mono text-xs sm:text-sm whitespace-nowrap block truncate max-w-full">
                    {theirGems.toLocaleString("en-US")}
                  </span>
                </div>
              )}

              {theirOffer.map((item, idx) => {
                const hasSign = item.sign.name !== "None";
                const isDecorated = hasSign;
                const rStyle = rarityClasses[item.unit.rarity] || rarityClasses.Basic;

                return (
                  <div
                    key={`their-calc-${idx}`}
                    className={`relative group bg-[#161619] border border-white/10 rounded-2xl p-2.5 pt-3.5 pb-3 text-center flex flex-col items-center justify-between ${
                      hasSign ? "min-h-[148px]" : "min-h-[116px]"
                    } hover:border-zinc-500/60 hover:scale-[1.02] transition-all duration-300 shadow-md`}
                  >
                    <button
                      onClick={() => handleRemoveItem("their", idx)}
                      className="absolute -top-1.5 -left-1.5 bg-zinc-800 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] shadow-md z-20 select-none cursor-pointer border border-white/20 transition-all active:scale-90"
                      title="Remove unit"
                    >
                      <X className="w-2.5 h-2.5" strokeWidth={3.5} />
                    </button>
                    <div className="absolute -top-1.5 -right-1.5 bg-[#22242c] border border-white/20 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md select-none z-20">
                      x{item.qty}
                    </div>

                    <div className="flex flex-col items-center gap-1 w-full min-w-0">
                      <div className="relative group/img overflow-hidden rounded-xl w-12 h-12 bg-[#050505] shadow-inner shrink-0 flex items-center justify-center p-0.5">
                        <img 
                          src={item.unit.img} 
                          alt={item.unit.name} 
                          className="relative w-full h-full object-contain scale-110 group-hover/img:scale-125 transition-transform duration-300 z-10" 
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col items-center w-full min-w-0 mt-0.5">
                        <div className="h-7 flex items-center justify-center w-full min-w-0">
                          <span className="text-[10.5px] font-bold text-white leading-tight text-center break-words line-clamp-2 px-0.5" title={item.unit.name}>
                            {item.unit.name}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">D: {item.unit.demand}/10</span>
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

              {theirOffer.length === 0 && theirGems === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Gem className="w-8 h-8 opacity-40 text-zinc-500" />
                  <span>Their offer is empty. Add Units or Gems below!</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => handleOpenAddUnit("their")}
                className="flex-1 bg-white hover:bg-zinc-200 text-black font-black py-3 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest select-none cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Unit
              </button>
              <button
                onClick={() => handleOpenGemsConfig("their")}
                className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-black py-3 px-5 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-xs uppercase tracking-widest select-none cursor-pointer"
              >
                <Gem className="w-4 h-4" />
                Gems
              </button>
            </div>

            <div className="border border-white/5 pt-4 flex justify-between items-center bg-black/25 px-4 py-3 rounded-2xl">
              <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wider">Total Value:</span>
              <span className="font-sans text-xl sm:text-2xl font-black text-white flex items-center gap-1">
                💎 {theirTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Alliance TD Balance Centerpiece */}
      <div className="bg-[#18181b] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden mt-6 transition-all duration-300 hover:border-zinc-700/35">
        
        {/* Top Header */}
        <div className="flex justify-between items-center text-slate-500 font-mono text-[9px] tracking-widest uppercase mb-4">
          <span>⚖️ Trade Balance Dashboard</span>
          <div className="flex items-center gap-3">
            <button
              onClick={copyTradeToDiscord}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-300 cursor-pointer ${
                copiedToDiscord
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {copiedToDiscord ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span className="text-[9px] font-black uppercase">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#5865F2]" />
                  <span className="text-[9px] font-black uppercase">Copy Discord</span>
                </>
              )}
            </button>
            <span className="text-zinc-400">Alliance: TD Trade Analytics</span>
          </div>
        </div>

        {/* Huge Result Indicator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Your Total & Proportion */}
          <div className="text-center md:text-left">
            <span className="block text-[9px] text-slate-500 font-black uppercase tracking-wider">YOUR OFFER VALUE</span>
            <span className="block text-2xl font-black text-white mt-1">💎 {yourTotal.toLocaleString()}</span>
            <span className="block text-xs font-semibold text-slate-400 mt-0.5">
              {yourTotal + theirTotal > 0 ? `${(yourTotal / (yourTotal + theirTotal) * 100).toFixed(0)}% of Trade` : "0%"}
            </span>
          </div>

          {/* Center: Major Badge */}
          <div className="flex flex-col items-center justify-center">
            {yourTotal === 0 && theirTotal === 0 ? (
              <div className="bg-zinc-500/10 border border-zinc-800 text-zinc-400 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <span>Waiting for Offers</span>
              </div>
            ) : (
              (() => {
                const diff = theirTotal - yourTotal;
                let outcomeLabel = "FAIR";
                let outcomeBg = "bg-zinc-800/40 border-white/10 text-zinc-300 shadow-none";
                let percentText = "";

                if (diff > 0) {
                  outcomeLabel = "WIN";
                  outcomeBg = "bg-white/10 border-white/20 text-white shadow-[0_0_25px_rgba(255,255,255,0.05)]";
                  if (yourTotal > 0) {
                    outcomeLabel = "BIG WIN";
                    percentText = `+${((theirTotal / yourTotal) * 100 - 100).toFixed(0)}% Overpay`;
                  }
                } else if (diff < 0) {
                  outcomeLabel = "LOSS";
                  outcomeBg = "bg-zinc-900/50 border-white/5 text-zinc-400 shadow-none";
                  if (theirTotal > 0) {
                    outcomeLabel = "BIG LOSS";
                    percentText = `-${((yourTotal / theirTotal) * 100 - 100).toFixed(0)}% Underpay`;
                  }
                }

                return (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`px-8 py-3.5 rounded-2xl border font-black text-lg sm:text-xl uppercase tracking-widest ${outcomeBg} flex items-center gap-2`}>
                      <span>{outcomeLabel}</span>
                      <span className="text-xl">{diff > 0 ? "📈" : diff < 0 ? "📉" : "⚖️"}</span>
                    </div>
                    {percentText && (
                      <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider mt-1">
                        {percentText}
                      </span>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          {/* Right: Their Total & Proportion */}
          <div className="text-center md:text-right">
            <span className="block text-[9px] text-slate-500 font-black uppercase tracking-wider">THEIR OFFER VALUE</span>
            <span className="block text-2xl font-black text-white mt-1">💎 {theirTotal.toLocaleString()}</span>
            <span className="block text-xs font-semibold text-slate-400 mt-0.5">
              {yourTotal + theirTotal > 0 ? `${(theirTotal / (yourTotal + theirTotal) * 100).toFixed(0)}% of Trade` : "0%"}
            </span>
          </div>
        </div>

        {/* Simple Balance Sliding Meter */}
        <div className="mt-8 border-t border-white/5 pt-6">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2 select-none">
            <span className="text-zinc-500">YOUR OVERPAY</span>
            <span className="text-zinc-400">BALANCED</span>
            <span className="text-white">THEIR OVERPAY</span>
          </div>

          <div className="relative h-3 bg-black/40 border border-white/10 rounded-full overflow-hidden">
            {/* Split balanced center marker */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white/20 pointer-events-none z-10" />

            {/* Filled bar representing the trade balance ratio */}
            {yourTotal + theirTotal > 0 && (
              (() => {
                const ratio = (theirTotal / (yourTotal + theirTotal)) * 100;
                return (
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-zinc-800 via-zinc-600 to-white rounded-full opacity-80"
                    initial={{ width: "50%" }}
                    animate={{ width: `${ratio}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                );
              })()
            )}
          </div>

          {/* Centered message underneath */}
          <div className="text-center mt-4">
            {yourTotal === 0 && theirTotal === 0 ? (
              <span className="text-slate-400 font-bold text-xs">
                Add items to both sides to compute precise trade balance logs.
              </span>
            ) : (
              (() => {
                const diff = theirTotal - yourTotal;
                if (diff === 0) {
                  return (
                    <span className="text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1">
                      ⚖️ Absolutely Equal Exchange (Fair Trade)
                    </span>
                  );
                }
                const percentDiff = yourTotal > 0 ? (diff / yourTotal) * 100 : 100;
                if (diff > 0) {
                  if (percentDiff > 35) {
                    return (
                      <span className="text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5">
                        ✦ BIG WIN (+{diff.toLocaleString()} 💎) • AMAZING OFFER!
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-zinc-200 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5">
                        📈 WINNING TRADE (+{diff.toLocaleString()} 💎) • GOOD TRADE!
                      </span>
                    );
                  }
                } else {
                  if (Math.abs(percentDiff) > 35) {
                    return (
                      <span className="text-zinc-400 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 animate-pulse">
                        ⚠️ BIG LOSS (-{Math.abs(diff).toLocaleString()} 💎) • CAREFUL, OVERPAYING!
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-zinc-500 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5">
                        ⚠️ SMALL LOSS (-{Math.abs(diff).toLocaleString()} 💎) • SLIGHT UNDERPAY
                      </span>
                    );
                  }
                }
              })()
            )}
          </div>
        </div>
      </div>

      {/* Add Unit Modal */}
      <AnimatePresence>
        {isAddUnitOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-3xl h-[72vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <button
                onClick={() => setIsAddUnitOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition z-50 select-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-1 overflow-hidden">
                {/* Modal Rarity filters */}
                <div className="hidden sm:flex sm:flex-col w-[150px] bg-white/[0.01] border-r border-white/5 p-2.5 overflow-y-auto gap-1.5 shrink-0 select-none">
                  <span className="text-[8px] font-black tracking-widest text-[#a855f7] uppercase mb-1.5 block border-b border-white/5 pb-1 select-none">Rarities</span>
                  {rarityTabs.map(rarityName => {
                    const rTheme = rarityClasses[rarityName] || rarityClasses.All;
                    const isSelected = rarityFilter === rarityName;
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
                        key={`modal-rarity-${rarityName}`}
                        onClick={() => setRarityFilter(rarityName)}
                        className={`text-left text-[10px] sm:text-[11px] font-black uppercase tracking-wider py-1.5 px-2 rounded-lg transition-all duration-200 select-none cursor-pointer border flex items-center justify-between gap-1 shadow-sm group ${
                          isSelected
                            ? `${rTheme.bg} ${rTheme.text} ${rTheme.activeBorder} ${rTheme.shadow} scale-[1.01]`
                            : "border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-white hover:border-white/10"
                        }`}
                      >
                        <span>{rarityName}</span>
                        <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${isSelected ? `${rDot} animate-pulse shadow-[0_0_8px_currentColor]` : "bg-slate-700 opacity-60 group-hover:opacity-100 group-hover:bg-slate-500"}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Units List */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col overflow-hidden">
                  <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider mb-3.5 block">CHOOSE ALLIANCE: TD UNIT</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    <div className="sm:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search units by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white/50 transition-all font-semibold placeholder:text-slate-500"
                      />
                    </div>
                    <select
                      value={sortOption}
                      onChange={e => setSortOption(e.target.value)}
                      className="bg-[#050505] border border-white/10 rounded-xl py-2 px-2.5 text-xs text-slate-300 focus:outline-none focus:border-white/50 transition-all select-none cursor-pointer"
                    >
                      <option value="default">Default Sorting</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="demand-desc">Demand Max</option>
                    </select>
                  </div>

                  {/* Quick Rarity Tag Chips */}
                  <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-2 mb-3 select-none no-scrollbar scroll-smooth">
                    {rarityTabs.map(rarityName => {
                      const isSelected = rarityFilter === rarityName;
                      const rTheme = rarityClasses[rarityName] || rarityClasses.All;
                      return (
                        <button
                          key={`quick-chip-${rarityName}`}
                          onClick={() => setRarityFilter(rarityName)}
                          className={`shrink-0 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? `${rTheme.bg} ${rTheme.text} ${rTheme.activeBorder} shadow-[0_0_10px_rgba(255,255,255,0.05)] scale-102`
                              : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/5"
                          }`}
                        >
                          {rarityName}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pr-1.5 content-start">
                    {addableUnitsList.map(unit => (
                      <button
                        key={unit.name}
                        onClick={() => handleSelectUnit(unit)}
                        className="flex items-center gap-2.5 bg-white/[0.01] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 p-2 rounded-xl text-left transition duration-200 active:scale-[0.98] select-none cursor-pointer"
                      >
                        <div className="w-10 h-10 shrink-0 overflow-hidden rounded-lg bg-black/30"><img src={unit.img} alt={unit.name} className="w-full h-full object-contain scale-110" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-white text-[11px] leading-tight truncate">{unit.name}</div>
                          <div className="flex gap-1.5 items-center mt-0.5">
                            <span className={`text-[8px] font-black py-0 px-1.5 rounded uppercase border select-none
                              ${unit.rarity === "Basic" ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" :
                                unit.rarity === "Uncommon" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]" :
                                unit.rarity === "Rare" ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]" :
                                unit.rarity === "Epic" ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_8px_rgba(147,51,234,0.15)]" :
                                unit.rarity === "Legendary" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.15)]" :
                                unit.rarity === "Mythic" ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(225,29,72,0.15)]" :
                                unit.rarity === "Exclusive" ? "bg-white/5 text-white border-white/10 shadow-[0_0_8px_rgba(79,70,229,0.15)]" :
                                unit.rarity === "Crate" ? "bg-amber-600/10 text-amber-550 border-amber-600/20 shadow-[0_0_8px_rgba(217,119,6,0.15)]" :
                                "bg-white/5 text-slate-400 border-white/5"}`}
                            >
                              {unit.rarity}
                            </span>
                            <span className="text-[9px] font-black text-cyan-400 font-mono">{unit.gems === -1 ? "N/A" : `💎 ${unit.gems.toLocaleString()}`}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    {addableUnitsList.length === 0 && (
                      <div className="col-span-full text-center py-12 text-slate-500 text-xs font-mono">
                        No units match your searching criteria.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unit Customization & Addition modal */}
      <AnimatePresence>
        {isConfigureUnitOpen && activeConfigUnit && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-zinc-950/95 border border-white/10 p-6 rounded-3xl w-full max-w-sm flex flex-col gap-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
            >
              <button
                onClick={() => setIsConfigureUnitOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition select-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center flex flex-col items-center mt-2">
                <div className="w-24 h-24 mb-3 overflow-hidden rounded-2xl shadow-xl"><img src={activeConfigUnit.img} alt={activeConfigUnit.name} className="w-full h-full object-contain scale-110" /></div>
                <h4 className="text-lg font-black text-white tracking-wide">{activeConfigUnit.name}</h4>
                <span className="text-[10px] bg-white/5 border border-white/10 text-slate-300 py-1 px-3 rounded-full mt-2 font-mono font-bold tracking-widest uppercase">
                  DEMAND: {activeConfigUnit.demand}/10
                </span>
              </div>

              {/* Sign Dropdown */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-wider">Select Custom Signature</label>
                <button
                  type="button"
                  onClick={() => setIsSignDropdownOpen(!isSignDropdownOpen)}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-[0.99] border border-white/10 rounded-xl p-3 text-left font-bold text-white text-sm flex justify-between items-center focus:outline-none select-none cursor-pointer hover:border-white/20 transition-all duration-300"
                >
                  <span
                    style={{
                      background: configSign.color.includes("gradient") ? configSign.color : undefined,
                      color: configSign.color.includes("gradient") ? "#fff" : configSign.color,
                      WebkitBackgroundClip: configSign.color.includes("gradient") ? "text" : undefined,
                      WebkitTextFillColor: configSign.color.includes("gradient") ? "transparent" : undefined
                    }}
                    className={configSign.color.includes("gradient") ? "font-black" : "font-semibold"}
                  >
                    ✍ {configSign.name} (+{configSign.percent}%)
                  </span>
                  <span className="text-xs text-slate-400">▼</span>
                </button>
                {isSignDropdownOpen && (
                  <div className="absolute bottom-[102%] left-0 right-0 max-h-[160px] overflow-y-auto bg-black border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col scrollbar-thin">
                    {signatures.map(sign => (
                      <button
                        key={sign.name}
                        onClick={() => {
                          setConfigSign(sign);
                          setIsSignDropdownOpen(false);
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
                          ✍ {sign.name}
                        </span>
                        <span className="text-[10px] text-[#a855f7] font-mono font-bold">+{sign.percent}%</span>
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
                    onClick={() => setConfigQty(Math.max(1, (Number(configQty) || 1) - 1))}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 hover:border-white/20 active:scale-95 transition flex items-center justify-center select-none cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={configQty}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "") {
                        setConfigQty("");
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setConfigQty(Math.max(1, parsed));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (configQty === "" || configQty < 1) {
                        setConfigQty(1);
                      }
                    }}
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white text-base text-center focus:outline-none focus:border-amber-500/50 transition font-black"
                  />
                  <button
                    type="button"
                    onClick={() => setConfigQty((Number(configQty) || 1) + 1)}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 hover:border-white/20 active:scale-95 transition flex items-center justify-center select-none cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center text-xs font-black text-blue-400 font-mono tracking-wide shadow-[0_2px_12px_rgba(59,130,246,0.05),inset_0_1px_2px_rgba(59,130,246,0.1)]">
                💎 Value: {activeConfigUnit?.gems === -1 ? "N/A" : (singleUnitCombinedValue * (Number(configQty) || 1)).toLocaleString()}
              </div>

              <button
                onClick={handleConfirmAddToOffer}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.25)] transition-all duration-200 select-none cursor-pointer"
              >
                ADD TO OFFER
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gems input modal */}
      <AnimatePresence>
        {isGemsModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#050505] border border-white/10 p-6 rounded-3xl w-full max-w-sm flex flex-col gap-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsGemsModalOpen(false)}
                className="absolute top-5 right-5 text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition select-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center flex flex-col items-center">
                <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-3">
                  <Gem className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-base font-black text-white uppercase tracking-widest">Configure Gems</h4>
                <p className="text-xs text-slate-400 mt-1">Specify gems quantity to add to trade option</p>
              </div>

              <input
                type="number"
                placeholder="0"
                value={gemsInputValue}
                onChange={e => setGemsInputValue(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center font-mono text-2xl font-black text-cyan-400 focus:outline-none focus:border-white/50 transition-all"
              />

              <button
                onClick={handleConfirmGems}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:scale-[1.02] hover:brightness-110 transition-all duration-300 select-none cursor-pointer"
              >
                Apply Gems Value
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save current trade modal dialog */}
      <AnimatePresence>
        {isSaveTradeOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#050505] border border-white/10 p-6 rounded-3xl w-full max-w-md flex flex-col gap-6 shadow-2xl relative text-left"
            >
              <button
                onClick={() => {
                  setIsSaveTradeOpen(false);
                  setValidationError("");
                }}
                className="absolute top-5 right-5 text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition select-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.15)] mb-3 text-white">
                  <Save className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-white uppercase tracking-widest">Save Current Trade</h4>
                <p className="text-xs text-slate-400 mt-1">Specify a unique title to memorize this balance setup</p>
              </div>

              {validationError && (
                <div className="bg-zinc-900/50 border border-white/5 px-4 py-3 rounded-xl text-xs font-semibold text-zinc-300 text-center">
                  ⚠️ {validationError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Trade Label Name</label>
                <input
                  type="text"
                  placeholder="E.g., Overpay offer, Trade #3"
                  value={tradeLabel}
                  onChange={e => setTradeLabel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/50 transition font-medium"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleConfirmSave}
                  disabled={yourOffer.length === 0 && yourGems === 0 && theirOffer.length === 0 && theirGems === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all duration-300 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  Confirm & Save Trade Preset
                </button>
                <button
                  onClick={() => {
                    setIsSaveTradeOpen(false);
                    setValidationError("");
                  }}
                  className="w-full py-2.5 bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-wide rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Trades history listing modal */}
      <AnimatePresence>
        {isSavesModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050505] border border-white/10 rounded-3xl w-full max-w-2xl h-[75vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <button
                onClick={() => setIsSavesModalOpen(false)}
                className="absolute top-5 right-5 text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition z-50 select-none cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <div className="p-2.5 bg-white/5 border border-indigo-500/25 rounded-xl text-white">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black text-white uppercase tracking-wider">Your Saved Presets</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Select a trade to instantly load it into the active calculator</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pr-4 flex flex-col gap-3 content-start">
                {savedTrades.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadSaved(item)}
                    className="group bg-white/[0.02] hover:bg-slate-900 border border-white/5 hover:border-indigo-500/40 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 cursor-pointer text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs sm:text-sm text-slate-200 truncate group-hover:text-amber-300 transition-colors">{item.name}</div>
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-white" />
                          {item.date}
                        </span>
                        <span className="text-zinc-300 font-black">You: 💰 {item.yourTotal ? item.yourTotal.toLocaleString() : 0}</span>
                        <span className="text-white font-black">Them: 💰 {item.theirTotal ? item.theirTotal.toLocaleString() : 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[9px] font-black uppercase text-white/80 bg-white/5 border border-white/10 py-1.5 px-3 rounded-lg group-hover:bg-white group-hover:text-white transition duration-200 select-none">
                        Load Setup
                      </span>
                      <button
                        onClick={(e) => handleDeleteSaved(item.id, e)}
                        className="bg-transparent hover:bg-white/10 text-slate-500 hover:text-white p-2 text-center rounded-xl transition-all duration-200 select-none cursor-pointer"
                        title="Delete saved preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {savedTrades.length === 0 && (
                  <div className="flex-1 py-16 flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-3 font-mono">
                    <History className="w-10 h-10 opacity-30 text-white" />
                    <div>
                      <div>No saved trade logs found.</div>
                      <div className="text-[10px] text-slate-600 mt-1">Configure active offers and click "Save Current" above to insert.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 text-center bg-black/40 text-[10px] text-slate-500 font-mono">
                Storage: {savedTrades.length}/10 slots used.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
