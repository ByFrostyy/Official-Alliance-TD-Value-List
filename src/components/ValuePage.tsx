import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ArrowUpDown, Swords, Sparkles, Plus, Trash2, ShieldAlert, Award, X, BadgePercent, Zap, Flame, Calendar, Star } from "lucide-react";
import { Yl } from "../data";
import { Unit, Upgrade } from "../types";

const rarityClasses: Record<string, { bg: string; text: string; shadow: string; border: string; activeBorder: string; hoverBg: string; hoverText: string; accentGlow: string }> = {
  All: { bg: "bg-blue-600/5", text: "text-blue-400", shadow: "shadow-sm", border: "border-blue-500/20", activeBorder: "border-blue-500/50", hoverBg: "hover:bg-blue-600/10", hoverText: "hover:text-blue-300", accentGlow: "rgba(37,99,235,0.4)" },
  Basic: { bg: "bg-zinc-500/5", text: "text-zinc-400", shadow: "shadow-sm", border: "border-zinc-500/20", activeBorder: "border-zinc-400/50", hoverBg: "hover:bg-zinc-600/10", hoverText: "hover:text-zinc-300", accentGlow: "rgba(113,113,122,0.2)" },
  Common: { bg: "bg-slate-500/5", text: "text-slate-400", shadow: "shadow-sm", border: "border-slate-500/20", activeBorder: "border-slate-400/50", hoverBg: "hover:bg-slate-600/10", hoverText: "hover:text-slate-300", accentGlow: "rgba(148,163,184,0.3)" },
  Uncommon: { bg: "bg-emerald-600/10", text: "text-emerald-400", shadow: "shadow-sm", border: "border-emerald-500/30", activeBorder: "border-emerald-500/60", hoverBg: "hover:bg-emerald-600/15", hoverText: "hover:text-emerald-300", accentGlow: "rgba(16,185,129,0.4)" },
  Rare: { bg: "bg-sky-600/10", text: "text-sky-400", shadow: "shadow-sm", border: "border-sky-500/30", activeBorder: "border-sky-500/60", hoverBg: "hover:bg-sky-500/15", hoverText: "hover:text-sky-300", accentGlow: "rgba(14,165,233,0.4)" },
  Epic: { bg: "bg-purple-600/10", text: "text-purple-400", shadow: "shadow-sm", border: "border-purple-500/30", activeBorder: "border-purple-500/60", hoverBg: "hover:bg-purple-600/15", hoverText: "hover:text-purple-300", accentGlow: "rgba(147,51,234,0.45)" },
  Legendary: { bg: "bg-yellow-500/10", text: "text-yellow-400", shadow: "shadow-sm", border: "border-yellow-500/30", activeBorder: "border-yellow-500/60", hoverBg: "hover:bg-yellow-500/15", hoverText: "hover:text-yellow-300", accentGlow: "rgba(234,179,8,0.5)" },
  Mythic: { bg: "bg-rose-600/5", text: "text-rose-400", shadow: "shadow-sm", border: "border-rose-500/20", activeBorder: "border-rose-500/50", hoverBg: "hover:bg-rose-600/10", hoverText: "hover:text-rose-300", accentGlow: "rgba(225,29,72,0.6)" },
  Exclusive: { bg: "bg-indigo-600/5", text: "text-indigo-400", shadow: "shadow-sm", border: "border-indigo-500/20", activeBorder: "border-indigo-500/50", hoverBg: "hover:bg-indigo-600/10", hoverText: "hover:text-indigo-300", accentGlow: "rgba(79,70,229,0.6)" },
  Godly: { bg: "bg-cyan-600/5", text: "text-cyan-400", shadow: "shadow-sm", border: "border-cyan-500/25", activeBorder: "border-cyan-500/60", hoverBg: "hover:bg-cyan-600/10", hoverText: "hover:text-cyan-300", accentGlow: "rgba(6,182,212,0.7)" },
  Crate: { bg: "bg-zinc-650/5", text: "text-zinc-400", shadow: "shadow-sm", border: "border-zinc-500/20", activeBorder: "border-zinc-500/50", hoverBg: "hover:bg-zinc-600/10", hoverText: "hover:text-zinc-300", accentGlow: "rgba(113,113,122,0.3)" }
};

export default function ValuePage({ units: propUnits }: { units?: Unit[] }) {
  const units = propUnits && propUnits.length > 0 ? propUnits : Yl;
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("lttd_favorites_list");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (unitName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(unitName);
      const updated = isFav ? prev.filter(name => name !== unitName) : [...prev, unitName];
      localStorage.setItem("lttd_favorites_list", JSON.stringify(updated));
      return updated;
    });
  };

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparedUnits, setComparedUnits] = useState<Unit[]>([]);
  const [isComparedViewOpen, setIsComparedViewOpen] = useState(false);

  
  const [activeDropdownUnit, setActiveDropdownUnit] = useState<string | null>(null);

  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);
  
  

  // Close specs details dropdowns when active unit details opens
  useEffect(() => {
    
    
  }, [detailUnit]);

  // Team builder state
  const [team, setTeam] = useState<( Unit | null)[]>([null, null, null, null, null]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("savedTeamBuilder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as any[];
        const mapped = parsed.map(item => {
          if (!item) return null;
          const unitName = typeof item === 'string' ? item : item.unitName;
          const matchedUnit = units.find(u => u.name === unitName);
          return matchedUnit || null;
        });
        setTeam(mapped);
      } catch (err) {
        console.error("Failed to load saved team", err);
      }
    }
  }, []);

  const saveTeam = (newTeam: ( Unit | null)[]) => {
    setTeam(newTeam);
    const simplified = newTeam.map(item =>
      item ? { unitName: item.name } : null
    );
    localStorage.setItem("savedTeamBuilder", JSON.stringify(simplified));
  };

  const handleAddToTeam = (unit: Unit, e: React.MouseEvent) => {
    e.stopPropagation();
    if (team.some(item => item && item.name === unit.name)) {
      alert(`${unit.name} is already in your Team Builder!`);
      return;
    }
    const emptyIdx = team.findIndex(item => item === null);
    if (emptyIdx === -1) {
      alert("Team Builder is full! Remove a unit first.");
      return;
    }
    const updated = [...team];
    updated[emptyIdx] = unit;
    saveTeam(updated);
  };

  const handleRemoveFromTeam = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...team];
    updated[idx] = null;
    saveTeam(updated);
  };

  const clearTeam = () => {
    saveTeam([null, null, null, null, null]);
  };

  // Select unit for comparison or specs view
  const handleUnitClick = (unit: Unit) => {
    if (isCompareMode) {
      if (comparedUnits.some(u => u.name === unit.name)) return;
      const updated = [...comparedUnits, unit];
      setComparedUnits(updated);
      if (updated.length === 2) {
        setIsComparedViewOpen(true);
        setIsCompareMode(false);
      }
    } else {
      setDetailUnit(unit);
    }
  };

  // Combined metrics for Team Builder
  const teamMetrics = useMemo(() => {
    let totalGems = 0;
    let placeCost = 0;
    let upgradeCost = 0;
    let dps = 0;
    let income = 0;
    let spawnerHp = 0;

    team.forEach(unit => {
      if (!unit) return;
      totalGems += (unit.gems === -1 ? 0 : unit.gems);
      placeCost += unit.placeCost;

      if (unit.upgrades && unit.upgrades.length > 0) {
        unit.upgrades.forEach(lvl => {
          if (lvl.cost && lvl.cost !== "Place") {
            const parsedCost = parseInt(lvl.cost.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(parsedCost)) {
              upgradeCost += parsedCost;
            }
          }
        });

        const maxLvl = unit.upgrades[unit.upgrades.length - 1];
        if (maxLvl.dmg && maxLvl.cd) {
          dps += maxLvl.dmg / maxLvl.cd;
        }
        if (maxLvl.income) {
          income += maxLvl.income;
        }
        if (maxLvl.hp) {
          spawnerHp += maxLvl.hp;
        }
      }
    });

    return {
      gems: totalGems,
      place: placeCost,
      upgrade: upgradeCost,
      dps: Math.round(dps),
      income,
      hp: spawnerHp
    };
  }, [team]);

  // Value list array filtered and sorted
  const sortedUnits = useMemo(() => {
    let list = [...units];
    if (selectedRarity === "favorites") {
      list = list.filter(u => favorites.includes(u.name));
    } else if (selectedRarity !== "all") {
      list = list.filter(u => {
        const uRar = u.rarity.toLowerCase();
        const selRar = selectedRarity.toLowerCase();
        if (uRar === selRar) return true;
        if (uRar + "s" === selRar) return true;
        if (selRar + "s" === uRar) return true;
        if (selRar === "legendaries" && uRar === "legendary") return true;
        if (selRar === "legendary" && uRar === "legendaries") return true;
        if (selRar === "exclusives" && uRar === "exclusive") return true;
        if (selRar === "exclusive" && uRar === "exclusives") return true;
        return false;
      });
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

    if (sortBy === "gems_desc") {
      list.sort((a, b) => {
        const valA = a.gems === -1 ? -Infinity : a.gems;
        const valB = b.gems === -1 ? -Infinity : b.gems;
        return valB - valA;
      });
    } else if (sortBy === "gems_asc") {
      list.sort((a, b) => {
        const valA = a.gems === -1 ? Infinity : a.gems;
        const valB = b.gems === -1 ? Infinity : b.gems;
        return valA - valB;
      });
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
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
  }, [selectedRarity, searchQuery, sortBy, units, favorites]);

  // Crate drops calculations
  const crateLoot = useMemo(() => {
    if (!detailUnit) return null;
    const isCrate = detailUnit.rarity.toLowerCase() === "crate" || detailUnit.name.toLowerCase().includes("crate") || (detailUnit.crateDrops && detailUnit.crateDrops.length > 0);
    if (!isCrate) return null;

    if (detailUnit.crateDrops && detailUnit.crateDrops.length > 0) {
      return detailUnit.crateDrops.map(drop => {
        const u = units.find(item => item.name.toLowerCase() === drop.name.toLowerCase());
        return {
          name: drop.name,
          rarity: drop.rarity || u?.rarity || "Exclusive",
          img: drop.img || u?.img || "https://i.postimg.cc/mD8zQyY7/toilet-tower-defense-default.webp",
          gems: u ? u.gems : -1,
          chance: drop.chance,
          chanceNum: drop.chanceNum,
          barColor: drop.barColor || (drop.chanceNum < 1 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" : drop.chanceNum < 20 ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]")
        };
      });
    }

    const lowerName = detailUnit.name.toLowerCase();
    let drops: { name: string; chance: string; chanceNum: number; barColor: string; rarity?: string; img?: string }[] = [];

    if (lowerName.includes("party")) {
      drops = [
        { name: "Party Camera Man", chance: "50%", chanceNum: 50, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Event" },
        { name: "Jester Speaker Man", chance: "40%", chanceNum: 40, barColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]", rarity: "Event" },
        { name: "Party Titan TV Man", chance: "10%", chanceNum: 10, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Event" },
      ];
    } else if (lowerName.includes("summer")) {
      drops = [
        { name: "Titan Speaker Man", chance: "70%", chanceNum: 70, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Legendary" },
        { name: "Titan TV Man", chance: "29%", chanceNum: 29, barColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]", rarity: "Legendary" },
        { name: "Titan Camera Man", chance: "1%", chanceNum: 1, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Exclusive" },
      ];
    } else if (lowerName.includes("free scientist")) {
      drops = [
        { name: "Scientist Camera Man", chance: "60%", chanceNum: 60, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Exclusive" },
        { name: "Large Scientist Camera Man", chance: "39.9%", chanceNum: 39.9, barColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]", rarity: "Exclusive" },
        { name: "Engineer Camera Man", chance: "0.1%", chanceNum: 0.1, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Exclusive" },
      ];
    } else if (lowerName.includes("scientist")) {
      drops = [
        { name: "Scientist Camera Man", chance: "60%", chanceNum: 60, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Exclusive" },
        { name: "Large Scientist Camera Man", chance: "39%", chanceNum: 39, barColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]", rarity: "Exclusive" },
        { name: "Engineer Camera Man", chance: "1%", chanceNum: 1, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Exclusive" },
      ];
    } else {
      drops = [
        { name: "Speaker Man", chance: "50%", chanceNum: 50, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Basic" },
        { name: "Camera Man", chance: "35%", chanceNum: 35, barColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]", rarity: "Uncommon" },
        { name: "TV Man", chance: "10%", chanceNum: 10, barColor: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.3)]", rarity: "Rare" },
        { name: "Titan TV Man", chance: "5%", chanceNum: 5, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Legendary" },
      ];
    }

    return drops.map(drop => {
      const u = units.find(item => item.name.toLowerCase() === drop.name.toLowerCase());
      return {
        name: drop.name,
        rarity: drop.rarity || u?.rarity || "Exclusive",
        img: drop.img || u?.img || "https://i.postimg.cc/mD8zQyY7/toilet-tower-defense-default.webp",
        gems: u ? u.gems : -1,
        chance: drop.chance,
        chanceNum: drop.chanceNum,
        barColor: drop.barColor
      };
    });
  }, [detailUnit, units]);

  const renderTrendStatus = (stability: string) => {
    const s = stability.toLowerCase();
    if (s.includes("rising") || s.includes("hype")) {
      return <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">Rising 📈</span>;
    } else if (s.includes("dropping") || s.includes("unwanted") || s.includes("useless") || s.includes("underpaid")) {
      return <span className="text-rose-400 font-extrabold flex items-center gap-0.5">Dropping 📉</span>;
    } else if (s.includes("fluct")) {
      return <span className="text-cyan-400 font-extrabold flex items-center gap-0.5">Fluctuating 🔄</span>;
    }
    return <span className="text-amber-400 font-extrabold flex items-center gap-0.5">Stable ⚖️</span>;
  };

  const getUpgradesList = (unit: Unit) => {
    if (!unit.upgrades) return [];
    return unit.upgrades.map(lvl => {
      const numDmg = typeof lvl.dmg === "number" ? lvl.dmg : (typeof lvl.dmg === "string" && !isNaN(Number(lvl.dmg)) ? Number(lvl.dmg) : 0);
      const dps = numDmg && lvl.cd ? Math.round(numDmg / lvl.cd) : 0;
      return { ...lvl, dps };
    });
  };

  // Compare overlay render details
  const renderCompareOverlay = useMemo(() => {
    if (!isComparedViewOpen || comparedUnits.length !== 2) return null;
    const [u1, u2] = comparedUnits;

    const u1Upgrades = getUpgradesList(u1);
    const u2Upgrades = getUpgradesList(u2);

    const max1 = u1Upgrades.length > 0 ? u1Upgrades[u1Upgrades.length - 1] : null;
    const max2 = u2Upgrades.length > 0 ? u2Upgrades[u2Upgrades.length - 1] : null;

    // Base stats
    const u1Dmg = max1 && typeof max1.dmg === "number" ? max1.dmg : 0;
    const u2Dmg = max2 && typeof max2.dmg === "number" ? max2.dmg : 0;

    const u1Dps = max1 && u1Dmg && max1.cd ? Math.round(u1Dmg / max1.cd) : 0;
    const u2Dps = max2 && u2Dmg && max2.cd ? Math.round(u2Dmg / max2.cd) : 0;

    const u1Cd = max1 && max1.cd ? Number((max1.cd).toFixed(2)) : 0;
    const u2Cd = max2 && max2.cd ? Number((max2.cd).toFixed(2)) : 0;

    const u1Range = max1 && max1.range ? max1.range : 0;
    const u2Range = max2 && max2.range ? max2.range : 0;

    const getComparisonClass = (val1: number, val2: number, invert = false) => {
      if (val1 === val2) return "text-zinc-300 font-semibold";
      const isVal1Better = invert ? val1 < val2 : val1 > val2;
      return isVal1Better ? "text-emerald-400 font-black" : "text-rose-400";
    };

    const cls1 = rarityClasses[u1.rarity] || rarityClasses.Basic;
    const cls2 = rarityClasses[u2.rarity] || rarityClasses.Basic;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative">
        {/* Floating VS connector */}
        <div className="hidden sm:block absolute top-[200px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none select-none">
          <div className="relative flex items-center justify-center">
            <span className="absolute animate-ping inline-flex h-12 w-12 rounded-full bg-blue-500/20 opacity-75" />
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold italic w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 border-[#070709] flex items-center justify-center text-base sm:text-lg shadow-[0_0_25px_rgba(59,130,246,0.5)]">
              VS
            </div>
          </div>
        </div>

        {/* Unit 1 Details */}
        <div className={`bg-gradient-to-b ${cls1.bg.replace("15", "10")} to-slate-950/90 border ${cls1.border} p-5 sm:p-6 rounded-2xl flex flex-col items-center transition-all duration-300 relative overflow-hidden backdrop-blur-md group hover:border-indigo-500/40 shadow-2xl`}>
          <div className={`relative mb-4 p-1 rounded-2xl bg-black/40 border border-white/10 ${cls1.shadow}`}>
            <img src={u1.img} alt={u1.name} className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-black/30 rounded-xl border border-white/5" />
          </div>
          <h5 className="font-extrabold text-white text-sm sm:text-base mb-1 text-center truncate w-full group-hover:text-indigo-300 transition-colors">{u1.name}</h5>
          <span className={`text-[9px] sm:text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border bg-black/40 ${cls1.text} ${cls1.border} tracking-widest mb-4`}>{u1.rarity}</span>



          {/* Stats Evaluation */}
          <div className="w-full flex flex-col gap-3.5 bg-black/50 p-4 rounded-xl border border-white/5 text-xs sm:text-sm">
            <h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Market Evaluation
            </h6>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Market Value:</span>
              <div className="flex items-center gap-1.5">
                {u1.gems !== -1 && u2.gems !== -1 && u1.gems > u2.gems && (
                  <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">
                    +{Math.abs(u1.gems - u2.gems).toLocaleString()}
                  </span>
                )}
                <span className={`font-mono font-black ${u1.gems === -1 || u2.gems === -1 ? "text-slate-300" : getComparisonClass(u1.gems, u2.gems)}`}>
                  {u1.gems === -1 ? "N/A" : `💎 ${u1.gems.toLocaleString()}`}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Demand:</span>
              <div className="flex items-center gap-1.5">
                {u1.demand !== -1 && u2.demand !== -1 && u1.demand > u2.demand && (
                  <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">
                    +{Math.abs(u1.demand - u2.demand)}
                  </span>
                )}
                <span className={`font-mono font-black ${u1.demand === -1 || u2.demand === -1 ? "text-slate-300" : getComparisonClass(u1.demand, u2.demand)}`}>
                  {u1.demand === -1 ? "N/A" : `${u1.demand}/10`}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Stability Trend:</span>
              <span>{renderTrendStatus(u1.stability)}</span>
            </div>
          </div>

          {/* Combat Evaluation */}
          <div className="w-full flex flex-col gap-3.5 bg-black/50 p-4 rounded-xl border border-white/5 text-xs sm:text-sm mt-4">
            <h6 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Max Level Combat
            </h6>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Damage:</span>
              <div className="flex items-center gap-1.5">
                {u1Dmg > u2Dmg && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">+{u1Dmg - u2Dmg}</span>}
                <span className={`font-mono font-black ${getComparisonClass(u1Dmg, u2Dmg)}`}>{u1Dmg || "-"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">DPS Rate:</span>
              <div className="flex items-center gap-1.5">
                {u1Dps > u2Dps && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">+{u1Dps - u2Dps}</span>}
                <span className={`font-mono font-black ${getComparisonClass(u1Dps, u2Dps)}`}>{u1Dps || "-"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Cooldown:</span>
              <div className="flex items-center gap-1.5">
                {u1Cd < u2Cd && u1Cd > 0 && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">-{Number((u2Cd - u1Cd).toFixed(2))}s</span>}
                <span className={`font-mono font-bold ${getComparisonClass(u1Cd, u2Cd, true)}`}>{u1Cd ? u1Cd + "s" : "-"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Range:</span>
              <div className="flex items-center gap-1.5">
                {u1Range > u2Range && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">+{u1Range - u2Range}</span>}
                <span className={`font-mono font-black ${getComparisonClass(u1Range, u2Range)}`}>{u1Range || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unit 2 Details */}
        <div className={`bg-gradient-to-b ${cls2.bg.replace("15", "10")} to-slate-950/90 border ${cls2.border} p-5 sm:p-6 rounded-2xl flex flex-col items-center transition-all duration-300 relative overflow-hidden backdrop-blur-md group hover:border-indigo-500/40 shadow-2xl`}>
          <div className={`relative mb-4 p-1 rounded-2xl bg-black/40 border border-white/10 ${cls2.shadow}`}>
            <img src={u2.img} alt={u2.name} className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-black/30 rounded-xl border border-white/5" />
          </div>
          <h5 className="font-extrabold text-white text-sm sm:text-base mb-1 text-center truncate w-full group-hover:text-indigo-300 transition-colors">{u2.name}</h5>
          <span className={`text-[9px] sm:text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border bg-black/40 ${cls2.text} ${cls2.border} tracking-widest mb-4`}>{u2.rarity}</span>



          {/* Stats Evaluation */}
          <div className="w-full flex flex-col gap-3.5 bg-black/50 p-4 rounded-xl border border-white/5 text-xs sm:text-sm">
            <h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Market Evaluation
            </h6>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Market Value:</span>
              <div className="flex items-center gap-1.5">
                {u1.gems !== -1 && u2.gems !== -1 && u2.gems > u1.gems && (
                  <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">
                    +{Math.abs(u2.gems - u1.gems).toLocaleString()}
                  </span>
                )}
                <span className={`font-mono font-black ${u1.gems === -1 || u2.gems === -1 ? "text-slate-300" : getComparisonClass(u2.gems, u1.gems)}`}>
                  {u2.gems === -1 ? "N/A" : `💎 ${u2.gems.toLocaleString()}`}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Demand:</span>
              <div className="flex items-center gap-1.5">
                {u1.demand !== -1 && u2.demand !== -1 && u2.demand > u1.demand && (
                  <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">
                    +{Math.abs(u2.demand - u1.demand)}
                  </span>
                )}
                <span className={`font-mono font-black ${u1.demand === -1 || u2.demand === -1 ? "text-slate-300" : getComparisonClass(u2.demand, u1.demand)}`}>
                  {u2.demand === -1 ? "N/A" : `${u2.demand}/10`}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">Stability Trend:</span>
              <span>{renderTrendStatus(u2.stability)}</span>
            </div>
          </div>

          {/* Combat Evaluation */}
          <div className="w-full flex flex-col gap-3.5 bg-black/50 p-4 rounded-xl border border-white/5 text-xs sm:text-sm mt-4">
            <h6 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Max Level Combat
            </h6>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Damage:</span>
              <div className="flex items-center gap-1.5">
                {u2Dmg > u1Dmg && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">+{u2Dmg - u1Dmg}</span>}
                <span className={`font-mono font-black ${getComparisonClass(u2Dmg, u1Dmg)}`}>{u2Dmg || "-"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">DPS Rate:</span>
              <div className="flex items-center gap-1.5">
                {u2Dps > u1Dps && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">+{u2Dps - u1Dps}</span>}
                <span className={`font-mono font-black ${getComparisonClass(u2Dps, u1Dps)}`}>{u2Dps || "-"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Cooldown:</span>
              <div className="flex items-center gap-1.5">
                {u2Cd < u1Cd && u2Cd > 0 && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">-{Number((u1Cd - u2Cd).toFixed(2))}s</span>}
                <span className={`font-mono font-bold ${getComparisonClass(u2Cd, u1Cd, true)}`}>{u2Cd ? u2Cd + "s" : "-"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 text-xs">Range:</span>
              <div className="flex items-center gap-1.5">
                {u2Range > u1Range && <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 select-none">+{u2Range - u1Range}</span>}
                <span className={`font-mono font-black ${getComparisonClass(u2Range, u1Range)}`}>{u2Range || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isComparedViewOpen, comparedUnits, activeDropdownUnit]);

  return (
    <div id="value-page-section" className="flex flex-col gap-6 w-full relative">
      {/* Top Search & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-indigo-400/70" />
          <input
            type="text"
            placeholder="Search characters or units..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#07080e]/90 hover:bg-[#0a0c14] focus:bg-[#0a0c14] border border-white/5 focus:border-indigo-500/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none placeholder:text-slate-500 transition-all duration-300"
          />
        </div>
        <div className="lg:col-span-3 relative font-sans">
          <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/70 pointer-events-none" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full bg-[#07080e]/90 hover:bg-[#0a0c14] border border-white/5 focus:border-indigo-500/40 rounded-2xl py-3.5 pl-11 pr-8 text-sm text-slate-200 focus:outline-none transition-all duration-300 appearance-none cursor-pointer"
          >
            <option value="default" className="bg-[#050609] text-slate-400">Default Sort Order</option>
            <option value="gems_desc" className="bg-[#050609] text-slate-400">Value: Gems High to Low</option>
            <option value="gems_asc" className="bg-[#050609] text-slate-400">Value: Gems Low to High</option>
            <option value="name" className="bg-[#050609] text-slate-400">Name: Alphabetical A to Z</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
        </div>
        <div className="lg:col-span-3">
          <button
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              setComparedUnits([]);
            }}
            className={`w-full py-3.5 rounded-2xl border font-black text-xs tracking-wider uppercase transition-all duration-300 select-none cursor-pointer flex items-center justify-center gap-2.5 ${
              isCompareMode
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-indigo-500/50 shadow-2xl"
                : "bg-[#07080e]/90 text-slate-300 border-white/5 hover:border-indigo-500/40 hover:bg-[#0a0c14] hover:text-white hover:shadow-2xl"
            }`}
          >
            <Swords className="w-4 h-4" />
            {isCompareMode ? "CLICK UNITS TO COMPARE" : "⚔️ COMPARE UNITS"}
          </button>
        </div>
      </div>

      {/* Rarity Tabs */}
      <div className="flex gap-2.5 pb-2 overflow-x-auto hide-scrollbar self-center justify-start max-w-full">
        <button
          onClick={() => setSelectedRarity("favorites")}
          className={`text-[10px] font-black uppercase py-2.5 px-4 rounded-xl shrink-0 border flex items-center gap-2 transition-all duration-300 select-none cursor-pointer ${
            selectedRarity === "favorites"
              ? "bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-sm scale-[1.02]"
              : "bg-white/[0.02] text-amber-400/80 border-white/5 hover:text-amber-300 hover:bg-white/[0.05] hover:border-white/10"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${selectedRarity === "favorites" ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
          <span>Favorites ({favorites.length})</span>
        </button>
        {["All", "Basics", "Commons", "Uncommons", "Rares", "Epics", "Legendaries", "Mythics", "Exclusives", "Crates", "Events"].map(rarity => {
          let key = rarity;
          if (rarity === "Basics") key = "Basic";
          else if (rarity === "Commons") key = "Common";
          else if (rarity === "Uncommons") key = "Uncommon";
          else if (rarity === "Rares") key = "Rare";
          else if (rarity === "Epics") key = "Epic";
          else if (rarity === "Legendaries") key = "Legendary";
          else if (rarity === "Mythics") key = "Mythic";
          else if (rarity === "Exclusives") key = "Exclusive";
          else if (rarity === "Crates") key = "Crate";
          else if (rarity === "Events") key = "Event";

          const matchedRarity = rarityClasses[key] || rarityClasses.All;
          const isSelected = selectedRarity === rarity.toLowerCase() || (rarity === "All" && selectedRarity === "all") || (rarity === "Crates" && selectedRarity === "crate") || (rarity === "Events" && selectedRarity === "event");
          const rGlow =
            rarity === "All" ? "bg-blue-400" :
            rarity === "Basics" ? "bg-zinc-400" :
            rarity === "Commons" ? "bg-slate-400" :
            rarity === "Uncommons" ? "bg-emerald-400" :
            rarity === "Rares" ? "bg-sky-400" :
            rarity === "Epics" ? "bg-purple-400" :
            rarity === "Legendaries" ? "bg-yellow-400" :
            rarity === "Mythics" ? "bg-rose-400" :
            rarity === "Exclusives" ? "bg-indigo-400" :
            rarity === "Crates" ? "bg-amber-400" :
            rarity === "Events" ? "bg-pink-400" :
            "bg-zinc-400";

          return (
            <button
              key={`rarity-${rarity}`}
              onClick={() => setSelectedRarity(rarity.toLowerCase() === "all" ? "all" : rarity.toLowerCase() === "crates" ? "crate" : rarity.toLowerCase() === "events" ? "event" : rarity.toLowerCase())}
              className={`text-[10px] font-black uppercase py-2.5 px-4 rounded-xl shrink-0 border flex items-center gap-2 transition-all duration-300 select-none cursor-pointer ${
                isSelected
                  ? "bg-white/[0.06] text-white border-zinc-500 shadow-sm scale-[1.02]"
                  : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white hover:bg-white/[0.05] hover:border-white/10"
              }`}
            >
              <span>{rarity}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? `${rGlow} animate-pulse shadow-[0_0_8px_currentColor]` : "bg-slate-700"}`} />
            </button>
          );
        })}
      </div>

      {/* Team Builder Bar */}
      <div className="bg-[#08090f]/90 border border-white/5 p-6 rounded-3xl shadow-2xl relative w-full mb-6 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-md">
        <div className="flex justify-between items-center mb-5">
          <span className="text-xs uppercase tracking-widest font-black text-indigo-400 flex items-center gap-2 leading-none">
            💼 LOADOUT BUILDER
          </span>
          <button
            onClick={clearTeam}
            className="text-[9px] uppercase font-black tracking-widest py-2 px-4 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500 hover:text-white transition duration-200 select-none cursor-pointer"
          >
            Clear Team
          </button>
        </div>

        {/* Team Slots */}
        <div className="flex gap-4.5 justify-center flex-wrap mb-6">
          {team.map((slot, idx) => {
            const hasUnit = !!slot;
            return (
              <div key={`slot-container-${idx}`} className="flex flex-col items-center gap-2 relative">
                <div
                  className={`w-18 h-18 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative bg-[#040508] overflow-hidden transition-all duration-300 group ${
                    hasUnit ? "border-solid border-indigo-500/50 bg-white/[0.02] shadow-[0_0_20px_rgba(99,102,241,0.1)] scale-105" : "hover:border-indigo-500/30"
                  }`}
                >
                  {hasUnit ? (
                    <>
                      <button
                        onClick={(e) => handleRemoveFromTeam(idx, e)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 border border-red-500/20 text-white rounded-lg w-5 h-5 flex items-center justify-center shadow-lg shadow-black/80 z-15 opacity-0 group-hover:opacity-100 transition-all duration-200 select-none cursor-pointer active:scale-90"
                        title="Remove unit"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <img
                        src={slot.img}
                        alt={slot.name}
                        className="w-full h-full object-contain bg-black/30 rounded-xl cursor-help"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailUnit(slot);
                        }}
                        title={`${slot.name} (Click to view full specs)`}
                      />
                    </>
                  ) : (
                    <Plus className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Team Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center bg-[#040508]/85 p-5 border border-white/5 rounded-2xl shadow-inner">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Total Value</span>
            <span className="font-mono text-xs sm:text-sm font-black text-cyan-400">💎 {teamMetrics.gems.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Place Cost</span>
            <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">${teamMetrics.place.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Max Upgrades</span>
            <span className="font-mono text-xs sm:text-sm font-black text-rose-400">${teamMetrics.upgrade.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Combined DPS</span>
            <span className="font-mono text-xs sm:text-sm font-black text-amber-400">{teamMetrics.dps.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Wave Income</span>
            <span className="font-mono text-xs sm:text-sm font-black text-cyan-400">+${teamMetrics.income.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Spawner HP</span>
            <span className="font-mono text-xs sm:text-sm font-black text-red-500">❤️ {teamMetrics.hp.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Value list grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {sortedUnits.map((unit, index) => {
          const matchedRarity = rarityClasses[unit.rarity] || rarityClasses.Basic;
          const isSelectedForCompare = comparedUnits.some(cu => cu.name === unit.name);

          return (
            <motion.div
              key={`val-unit-${unit.name}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => handleUnitClick(unit)}
              className={`bg-gradient-to-b from-[#0a0c16] to-[#06070c] border ${
                isCompareMode
                  ? isSelectedForCompare
                    ? "border-amber-500 bg-amber-500/10 scale-[1.03]"
                    : "border-blue-500/60 animate-pulse bg-blue-500/5"
                  : "border-white/5 hover:border-zinc-600/50 hover:shadow-2xl"
              } rounded-2xl overflow-hidden cursor-pointer relative group hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-3 p-4`}
            >
              {isCompareMode && (
                <div className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-2xl transition-all duration-200 select-none
                  ${isSelectedForCompare ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-blue-600/95 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"}`}>
                  <Swords className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                  <span>{isSelectedForCompare ? "1ST SELECTED" : "SELECT TO VS"}</span>
                </div>
              )}

              {!isCompareMode && (
                <>
                  <button
                    onClick={(e) => toggleFavorite(unit.name, e)}
                    className="absolute top-4 left-4 z-20 w-[26px] h-[26px] rounded-lg bg-[#0c0d14]/80 backdrop-blur-md border border-white/10 hover:border-amber-400 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center transition-all duration-300 select-none cursor-pointer hover:scale-110 active:scale-90"
                    title={favorites.includes(unit.name) ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Star className={`w-3.5 h-3.5 ${favorites.includes(unit.name) ? "fill-amber-400 text-amber-400" : "text-amber-400/75"}`} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => handleAddToTeam(unit, e)}
                    className="absolute top-4 right-4 z-20 w-[26px] h-[26px] rounded-lg bg-[#0c0d14]/80 backdrop-blur-md border border-white/10 hover:border-indigo-400 hover:bg-indigo-600 hover:shadow-[0_0_12px_rgba(99,102,241,0.5)] text-white flex items-center justify-center transition-all duration-300 select-none cursor-pointer hover:scale-110 active:scale-90"
                    title="Add to Team Loadout"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                </>
              )}

              {/* Redesigned Card Header: Name and Rarity/Category */}
              <div className="text-center flex flex-col gap-0.5 z-10 px-7">
                <span className="font-black text-white text-xs sm:text-sm tracking-tight block leading-tight min-h-[32px] sm:min-h-[40px] flex items-center justify-center" title={unit.name}>
                  {unit.name}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider block
                  ${unit.rarity.toLowerCase().includes("legendary") ? "text-yellow-400" :
                    unit.rarity.toLowerCase().includes("epic") ? "text-purple-400" :
                    unit.rarity.toLowerCase().includes("rare") ? "text-sky-400" :
                    unit.rarity.toLowerCase().includes("uncommon") ? "text-emerald-400" :
                    unit.rarity.toLowerCase().includes("basic") ? "text-zinc-400" :
                    unit.rarity.toLowerCase().includes("monster") ? "text-orange-400" :
                    unit.rarity.toLowerCase().includes("staff") ? "text-cyan-400" :
                    unit.rarity.toLowerCase().includes("general") ? "text-blue-400" :
                    unit.rarity.toLowerCase().includes("exclusive") ? "text-indigo-400" :
                    unit.rarity.toLowerCase().includes("mythic") ? "text-rose-400" : "text-yellow-400"}`}
                >
                  {unit.rarity}
                </span>
              </div>

              {/* Redesigned Card Image Box: Flat dark background, NO glowing backlights */}
              <div className="aspect-square relative overflow-hidden bg-black/40 border border-white/5 rounded-xl shrink-0">
                <img src={unit.img} alt={unit.name} className="relative w-full h-full object-contain bg-black/20 group-hover:scale-105 transition duration-500 shrink-0 z-10" />
              </div>

              {/* Redesigned Card Info Table: Clean, professional layout */}
              <div className="flex flex-col gap-1.5 text-[10px] sm:text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-white/[0.02]">
                  <span className="text-slate-500 font-medium">Value</span>
                  <span className="font-sans font-black text-white">
                    {unit.gems === -1 ? "N/A" : (unit.gems === 0 ? "0/C" : unit.gems.toLocaleString())}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/[0.02]">
                  <span className="text-slate-500 font-medium">Demand</span>
                  <span className="font-mono font-black text-slate-200">
                    {unit.demand}/10
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Stability</span>
                  <span className={`font-black uppercase text-[9px] tracking-wider
                    ${unit.stability.toLowerCase() === "stable" ? "text-emerald-400" :
                      unit.stability.toLowerCase() === "fluctuating" ? "text-amber-400" :
                      unit.stability.toLowerCase() === "unstable" ? "text-orange-400" :
                      unit.stability.toLowerCase() === "hyped" ? "text-rose-400" : "text-yellow-400"}`}
                  >
                    {unit.stability}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {sortedUnits.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs font-mono">
            No units found matching criteria.
          </div>
        )}
      </div>

      {/* VS Comparison Modal Details */}
      <AnimatePresence>
        {isComparedViewOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#07080e]/95 border border-white/5 p-6 sm:p-8 rounded-3xl w-full max-w-2xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] backdrop-blur-md relative my-auto"
            >
              <button
                onClick={() => {
                  setIsComparedViewOpen(false);
                  setComparedUnits([]);
                }}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.06] active:scale-90 rounded-xl transition-all duration-200 z-50 select-none cursor-pointer group shadow-lg"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300 ease-out" />
              </button>

              <h4 className="text-base font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <Swords className="w-5 h-5 text-indigo-400 animate-pulse" />
                Specifications Duel
              </h4>

              {renderCompareOverlay}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Single Unit Details Modal Specs */}
      <AnimatePresence>
        {detailUnit && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-45 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#07080e]/95 border border-white/5 p-6 sm:p-8 rounded-3xl w-full max-w-2xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] backdrop-blur-md relative my-auto text-left"
            >
              <button
                onClick={() => setDetailUnit(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.06] active:scale-90 rounded-xl transition-all duration-200 z-50 select-none cursor-pointer group shadow-lg"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300 ease-out" />
              </button>

              {/* Grid Top Part */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="relative group/glow w-full max-w-[280px] sm:max-w-[320px] md:max-w-none aspect-square">
                    <img src={detailUnit.img} alt={detailUnit.name} className="relative w-full h-full object-contain bg-black/40 rounded-2xl border border-white/10 shadow-2xl" />
                  </div>
                </div>

                <div className="flex flex-col justify-center h-full pr-12 md:pr-0">
                  <h4 className="text-xl font-black text-white mb-1 leading-none">{detailUnit.name}</h4>
                  <span className="text-[10px] uppercase font-black text-rose-400 mb-4 tracking-widest block">Rarity: {detailUnit.rarity}</span>

                  <div className="flex flex-col gap-3 bg-white/[0.01] p-4 rounded-xl border border-white/5 w-full text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Value:</span>
                      <span className="font-mono font-black text-cyan-400">
                        {detailUnit.gems === -1 ? "N/A" : `💎 ${detailUnit.gems.toLocaleString()} Gems`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Demand:</span>
                      <span className="font-extrabold text-white">
                        {detailUnit.demand === -1 ? "N/A" : `${detailUnit.demand}/10`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Status:</span>
                      <span>{renderTrendStatus(detailUnit.stability)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Placement Cost:</span>
                      <span className="font-mono font-bold text-emerald-400">${detailUnit.placeCost}</span>
                    </div>
                  </div>

                  <div className="bg-[#040508]/65 border border-white/5 p-3 rounded-xl text-[10px] font-mono text-slate-400 mt-4 leading-normal">
                    <span className="font-black text-slate-300 block mb-1 uppercase tracking-wider">🎯 How to Obtain:</span>
                    {detailUnit.obtain}
                  </div>


                </div>
              </div>

              {/* Lower Details Table (Upgrades or Crate drop) */}
              <div className="w-full">
                {crateLoot && crateLoot.length > 0 ? (
                  <>
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#a855f7] block mb-3">Crate Loot drops and chances</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {crateLoot?.map(drop => (
                        <div key={drop.name} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 p-3.5 rounded-2xl flex flex-col items-center text-center transition-all duration-200 select-none group relative overflow-hidden">
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-black bg-blue-600/20 border border-blue-500/35 text-blue-400 font-mono">
                            {drop.chance}
                          </div>
                          <img src={drop.img} alt={drop.name} className="w-16 h-16 object-contain bg-black/30 rounded-xl border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300 mb-2 shrink-0" />
                          <div className="min-w-0 w-full">
                            <h5 className="font-extrabold text-white text-[11px] leading-tight truncate group-hover:text-blue-400 transition-colors">{drop.name}</h5>
                            <span className="text-[8px] font-black uppercase tracking-wider text-rose-400 block mt-0.5">{drop.rarity}</span>
                            <span className="font-mono text-[9px] font-black text-cyan-400 block mt-1">
                              {drop.gems === -1 ? "N/A" : `💎 ${drop.gems.toLocaleString()} Gems`}
                            </span>
                            <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden p-[1px] border border-white/[0.03]">
                              <div className={`h-full rounded-full ${drop.barColor}`} style={{ width: `${Math.max(3, drop.chanceNum)}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#a855f7] block mb-2">Upgrades list</span>
                    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                      {(() => {
                        const ups = getUpgradesList(detailUnit);
                        const isIncomeUnit = ups.some(lvl => lvl.income !== undefined) && !ups.some(lvl => (typeof lvl.dmg === "number" && lvl.dmg > 0) || (typeof lvl.dmg === "string" && Number(lvl.dmg) > 0) || lvl.dmgBuff || lvl.rangeBuff || lvl.speedBuff || lvl.buff);
                        const isBoosterUnit = ups.some(lvl => (lvl.dmgBuff !== undefined && lvl.dmgBuff !== "") || (lvl.rangeBuff !== undefined && lvl.rangeBuff !== "") || (lvl.speedBuff !== undefined && lvl.speedBuff !== "") || (lvl.buff !== undefined && lvl.buff !== ""));
                        
                        if (isIncomeUnit) {
                          return (
                            <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
                              <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                  <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Tier</th>
                                  <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Upgrade Cost</th>
                                  <th className="p-3 font-semibold text-[8px] uppercase text-emerald-400">Income / wave</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ups.map((lvl, index) => {
                                  return (
                                    <tr key={`ups-${index}`} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                      <td className="p-3 font-black text-white text-xs">Lvl {lvl.lvl}</td>
                                      <td className="p-3 font-bold text-emerald-400 font-mono">{lvl.cost}</td>
                                      <td className="p-3 font-black text-emerald-400 font-mono text-xs">
                                          <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                                            +${lvl.income?.toLocaleString()}
                                          </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        }

                        if (isBoosterUnit) {
                          return (
                            <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
                              <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                  <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Tier</th>
                                  <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Upgrade Cost</th>
                                  <th className="p-3 font-semibold text-[8px] uppercase text-red-400">⚔️ Dmg Buff</th>
                                  <th className="p-3 font-semibold text-[8px] uppercase text-blue-400">🎯 Range Buff</th>
                                  <th className="p-3 font-semibold text-[8px] uppercase text-amber-400">⚡ Atk Spd Buff</th>
                                  <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Range</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ups.map((lvl, index) => {
                                  return (
                                    <tr key={`booster-ups-${index}`} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                      <td className="p-3 font-black text-white text-xs">Lvl {lvl.lvl}</td>
                                      <td className="p-3 font-bold text-emerald-400 font-mono">{lvl.cost}</td>
                                      <td className="p-3">
                                        {lvl.dmgBuff ? (
                                          <span className="inline-flex items-center gap-1 font-sans text-xs font-black text-red-300 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-lg shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                            ⚔️ {lvl.dmgBuff.startsWith("+") ? lvl.dmgBuff : `+${lvl.dmgBuff}`}
                                          </span>
                                        ) : lvl.buff ? (
                                          <span className="text-purple-300 font-sans text-xs font-black bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                                            {lvl.buff}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600 font-mono">-</span>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        {lvl.rangeBuff ? (
                                          <span className="inline-flex items-center gap-1 font-sans text-xs font-black text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-lg shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                                            🎯 {lvl.rangeBuff.startsWith("+") ? lvl.rangeBuff : `+${lvl.rangeBuff}`}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600 font-mono">-</span>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        {lvl.speedBuff ? (
                                          <span className="inline-flex items-center gap-1 font-sans text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                                            ⚡ {lvl.speedBuff.startsWith("+") ? lvl.speedBuff : `+${lvl.speedBuff}`}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600 font-mono">-</span>
                                        )}
                                      </td>
                                      <td className="p-3 font-medium text-slate-300 font-mono">
                                        {lvl.range ? <span>{lvl.range}</span> : "-"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        }

                        // Combat Unit Upgrades Table
                        return (
                          <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Tier</th>
                                <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Upgrade Cost</th>
                                <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Base Dmg / Hp</th>
                                <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Cooldown</th>
                                <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Dps</th>
                                <th className="p-3 font-semibold text-[8px] uppercase text-slate-500">Range</th>
                              </tr>
                            </thead>
                              <tbody>
                                {ups.map((lvl, index) => {
                                  const numDmg = typeof lvl.dmg === "number" ? lvl.dmg : (typeof lvl.dmg === "string" && !isNaN(Number(lvl.dmg)) ? Number(lvl.dmg) : null);
                                  const baseDps = numDmg && lvl.cd ? Math.round(numDmg / lvl.cd) : 0;

                                  return (
                                    <tr key={`combat-ups-${index}`} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                      <td className="p-3 font-black text-white text-xs">Lvl {lvl.lvl}</td>
                                      <td className="p-3 font-bold text-emerald-400 font-mono">{lvl.cost}</td>
                                      <td className="p-3 font-bold text-slate-200">
                                        {lvl.dmg !== undefined ? (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-mono">{lvl.dmg}</span>
                                            {lvl.hp !== undefined && (
                                              <span className="text-[#f43f5e] font-sans text-[10px] uppercase font-black bg-[#f43f5e]/10 border border-[#f43f5e]/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-[0_0_8px_rgba(244,63,94,0.1)] self-center leading-none ml-1">
                                                HP: {lvl.hp.toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                        ) : lvl.hp !== undefined ? (
                                          <span className="text-[#f43f5e] font-sans text-[10px] uppercase font-black bg-[#f43f5e]/10 border border-[#f43f5e]/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-[0_0_8px_rgba(244,63,94,0.1)]">
                                            HP: {lvl.hp.toLocaleString()}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                      <td className="p-3 font-medium text-slate-300 font-mono">
                                        {lvl.cd ? (
                                          <span>{lvl.cd}s</span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                      <td className="p-3 font-mono font-black text-slate-200">
                                        {numDmg && lvl.cd ? (
                                          <span>{baseDps.toLocaleString()}</span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                      <td className="p-3 font-medium text-slate-300 font-mono">
                                        {lvl.range ? (
                                          <span>{lvl.range}</span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
