import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Flame, Hourglass, Sparkles, Calendar, Timer } from "lucide-react";
import { CountdownConfig } from "../types";

interface CountdownProps {
  config?: CountdownConfig;
}

export default function Countdown({ config: propConfig }: CountdownProps) {
  const [countdownData, setCountdownData] = useState<CountdownConfig | null>(propConfig || null);
  const [loading, setLoading] = useState(!propConfig);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (propConfig) {
      setCountdownData(propConfig);
      setLoading(false);
      return;
    }

    const fetchCountdown = async () => {
      try {
        const res = await fetch("/api/countdown");
        if (res.ok) {
          const data = await res.json();
          if (data.countdown) {
            setCountdownData(data.countdown);
          }
        }
      } catch (err) {
        console.error("Error fetching countdown:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountdown();
  }, [propConfig]);

  useEffect(() => {
    if (!countdownData || !countdownData.targetDate) return;

    // Helper to robustly parse various date string formats
    const parseDateString = (str: string): number => {
      if (!str) return NaN;
      // 1. Try default Date constructor
      let parsed = new Date(str).getTime();
      if (!isNaN(parsed)) return parsed;

      // 2. Try replacing space with 'T' e.g. "2026-08-02 21:00" -> "2026-08-02T21:00"
      const tFormat = str.trim().replace(" ", "T");
      parsed = new Date(tFormat).getTime();
      if (!isNaN(parsed)) return parsed;

      // 3. Try parsing "Aug 02 2026 21:00" or similar
      const parts = str.trim().split(/\s+/);
      if (parts.length >= 4) {
        // e.g. ["Aug", "02", "2026", "21:00"]
        const dateStr = `${parts[0]} ${parts[1]}, ${parts[2]} ${parts[3]}`;
        parsed = new Date(dateStr).getTime();
        if (!isNaN(parsed)) return parsed;
      }

      return NaN;
    };

    const targetTime = parseDateString(countdownData.targetDate);

    const tick = () => {
      if (isNaN(targetTime)) {
        setTimeLeft(0);
        return;
      }

      const now = Date.now();
      const diff = targetTime - now;
      setTimeLeft(diff);

      const startTime = countdownData.startDate ? parseDateString(countdownData.startDate) : targetTime - 7 * 86400000;
      const validStartTime = isNaN(startTime) ? targetTime - 7 * 86400000 : startTime;

      const totalDuration = targetTime - validStartTime;
      const elapsed = now - validStartTime;
      let percentage = Math.floor((elapsed / Math.max(1, totalDuration)) * 100);
      percentage = Math.max(0, Math.min(100, percentage));
      setProgress(percentage);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [countdownData]);

  if (loading) return null;

  if (!countdownData || !countdownData.enabled) return null;

  const formatUnit = (value: number) => {
    if (isNaN(value) || value < 0) return "00";
    return String(Math.floor(value)).padStart(2, "0");
  };

  if (timeLeft <= 0) {
    return (
      <div id="countdown-released-section" className="flex flex-col items-center justify-center p-8 bg-[#08090f] border border-emerald-500/20 hover:border-emerald-500/40 transition-all rounded-[2rem] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden min-h-[250px] my-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <Flame className="w-16 h-16 text-emerald-400 animate-bounce mb-4" />
        <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-wider uppercase">
          {countdownData.title || "UPDATE IS OUT!"}
        </h3>
        <p className="text-slate-300 font-semibold mt-3 max-w-lg">
          {countdownData.description || "Hop into Alliance: TD and enjoy the new features!"}
        </p>

        {countdownData.bannerImage && (
          <div className="mt-6 w-full max-w-3xl rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl">
            <img src={countdownData.bannerImage} alt="Update Released Banner" className="w-full h-auto object-contain max-h-[500px]" />
          </div>
        )}
      </div>
    );
  }

  const safeTimeLeft = isNaN(timeLeft) || timeLeft < 0 ? 0 : timeLeft;
  const days = Math.floor(safeTimeLeft / 86400000);
  const hours = Math.floor((safeTimeLeft % 86400000) / 3600000);
  const minutes = Math.floor((safeTimeLeft % 3600000) / 60000);
  const seconds = Math.floor((safeTimeLeft % 60000) / 1000);

  const countdownUnits = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" }
  ];

  return (
    <div id="countdown-active-section" className="flex flex-col items-center justify-center p-6 md:p-10 max-w-5xl mx-auto w-full my-4 bg-[#080910] border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Header Info */}
      <div className="text-center flex flex-col items-center gap-2 mb-6 w-full">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-slate-300 text-xs font-bold uppercase tracking-wider">
          <Hourglass className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "8s" }} />
          <span>Upcoming Update Countdown</span>
        </div>

        <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wider mt-2 flex items-center justify-center gap-2 text-center">
          {countdownData.title || "🔨 Crafts + Secret Units UPDATE"}
        </h3>


        {countdownData.description && (
          <p className="text-slate-300 text-sm md:text-base max-w-2xl text-center mt-1.5 leading-relaxed">
            {countdownData.description}
          </p>
        )}
      </div>

      {/* Main Banner Image Preview if available */}
      {countdownData.bannerImage && (
        <div className="w-full max-w-4xl mb-8 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl relative group">
          <img
            src={countdownData.bannerImage}
            alt="Update Preview Banner"
            className="w-full h-auto max-h-[500px] object-contain sm:object-cover group-hover:scale-[1.01] transition-transform duration-500 rounded-2xl"
          />
        </div>
      )}

      {/* Timer Cards with Stopwatch Icons on Left and Right */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 w-full max-w-4xl px-4">
        {/* Left Stopwatch Decorative Element */}
        <motion.div 
          initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex items-center justify-center p-2.5 sm:p-4 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] shrink-0 animate-pulse"
        >
          <Timer className="w-6 h-6 sm:w-11 sm:h-11 animate-spin" style={{ animationDuration: "10s" }} />
        </motion.div>

        {/* Timer Cards */}
        <div className="flex justify-center flex-wrap gap-2.5 sm:gap-4 flex-1 max-w-xl">
          {countdownUnits.map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              className="flex-1 min-w-[65px] sm:min-w-[105px] bg-black/80 border border-white/15 rounded-2xl py-3.5 sm:py-5 px-1.5 sm:px-3 text-center shadow-lg relative overflow-hidden backdrop-blur-md"
            >
              <span className="block text-xl sm:text-4xl font-black tracking-tight text-white mb-0.5 sm:mb-1 font-mono">
                {formatUnit(unit.value)}
              </span>
              <span className="block text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Right Stopwatch Decorative Element */}
        <motion.div 
          initial={{ scale: 0.8, rotate: 15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex items-center justify-center p-2.5 sm:p-4 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] shrink-0 animate-pulse"
        >
          <Timer className="w-6 h-6 sm:w-11 sm:h-11 animate-spin" style={{ animationDuration: "10s", animationDelay: "0.5s" }} />
        </motion.div>
      </div>
    </div>
  );
}
