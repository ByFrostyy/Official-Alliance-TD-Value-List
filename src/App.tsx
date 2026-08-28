import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AdminPanel } from "./components/AdminPanel";
import { Gem, History, Map, Calendar, Swords, TrendingUp, Sparkles, Compass, ShieldAlert, ArrowRightLeft, Wrench, Lock, Unlock, AlertTriangle, Volume2, VolumeX, Music, Upload, Trash2, ExternalLink, Info, FileText, Clock } from "lucide-react";
import ValuePage from "./components/ValuePage";
import TradeCalculator from "./components/TradeCalculator";
import UpdatesLog from "./components/UpdatesLog";
import Countdown from "./components/Countdown";
import CommunityTrades from "./components/CommunityTrades";
import LinksPage from "./components/LinksPage";
import { UpdatesRoadmap } from "./components/UpdatesRoadmap";
import { startAmbientMusic, stopAmbientMusic, setAmbientMusicVolume, playGlobalClick } from "./utils/audio";
import { Unit, SignValue } from "./types";

type TabId = "value-list" | "calculator" | "updates-log" | "roadmap" | "countdown" | "community-trades" | "links";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      const saved = localStorage.getItem("lttd_active_tab");
      return (saved as TabId) || "links";
    } catch {
      return "links";
    }
  });

  const [utcTime, setUtcTime] = useState("");
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isBypassed, setIsBypassed] = useState(() => {
    try {
      return localStorage.getItem("origin_admin_bypass") === "true";
    } catch {
      return false;
    }
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminNicknameInput, setAdminNicknameInput] = useState(() => localStorage.getItem("origin_admin_nickname") || "");
  const [adminError, setAdminError] = useState("");
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [loggedTradeUser, setLoggedTradeUser] = useState<any | null>(null);

  const checkUserSession = useCallback(async () => {
    const token = localStorage.getItem("lttd_rb_session");
    if (!token) {
      setIsAdminUser(false);
      setLoggedTradeUser(null);
      return;
    }
    try {
      const res = await fetch("/api/roblox/session-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isBanned) {
          setIsBanned(true);
          setBanReason(data.banReason || "Violation of rules");
          setIsAdminUser(false);
          setLoggedTradeUser(null);
        } else if (data.valid && data.user) {
          setLoggedTradeUser(data.user);
          const isAdm = !!data.user.isAdmin;
          setIsAdminUser(isAdm);
          setIsBanned(false);
        } else {
          setIsAdminUser(false);
          setIsBanned(false);
          setLoggedTradeUser(null);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkUserSession();
    const interval = setInterval(checkUserSession, 4000);
    return () => clearInterval(interval);
  }, [checkUserSession]);

  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem("origin_music_volume");
      return saved !== null ? parseFloat(saved) : 0.5;
    } catch {
      return 0.5;
    }
  });

  const [clickVolume, setClickVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem("origin_click_volume");
      return saved !== null ? parseFloat(saved) : 0.5;
    } catch {
      return 0.5;
    }
  });

  const handleClickVolumeChange = (newVol: number) => {
    setClickVolumeState(newVol);
    try {
      localStorage.setItem("origin_click_volume", String(newVol));
    } catch {}
  };

  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [serverMusicUrl, setServerMusicUrl] = useState<string>("");
  const [serverClickSoundUrl, setServerClickSoundUrl] = useState<string>("");
  const [dynamicUnits, setDynamicUnits] = useState<Unit[]>([]);
  const [dynamicSignatures, setDynamicSignatures] = useState<SignValue[]>([]);

  const fetchDynamicData = async () => {
    try {
      const resU = await fetch("/api/units");
      if (resU.ok) {
        const dataU = await resU.json();
        setDynamicUnits(dataU.units || []);
      }
      const resS = await fetch("/api/signatures");
      if (resS.ok) {
        const dataS = await resS.json();
        setDynamicSignatures(dataS.signatures || []);
      }
    } catch (err) {
      console.error("Failed to fetch dynamic units/signatures:", err);
    }
  };

  const customAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const activePlayUrl = customAudioUrl || serverMusicUrl;

  const handleCustomAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (customAudioUrl) {
        URL.revokeObjectURL(customAudioUrl);
      }
      const url = URL.createObjectURL(file);
      setCustomAudioFile(file);
      setCustomAudioUrl(url);
      stopAmbientMusic();
    }
  };

  const handleClearCustomAudio = () => {
    if (customAudioUrl) {
      URL.revokeObjectURL(customAudioUrl);
    }
    setCustomAudioFile(null);
    setCustomAudioUrl(null);
  };

  const handleVolumeChange = (newVol: number) => {
    setMusicVolumeState(newVol);
    setAmbientMusicVolume(newVol);
    if (customAudioRef.current) {
      customAudioRef.current.volume = newVol;
    }
  };

  const [musicEnabled, setMusicEnabled] = useState(() => {
    try {
      return localStorage.getItem("origin_music_enabled") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const fetchGlobalMusic = async () => {
      try {
        const res = await fetch("/api/music/config");
        if (res.ok) {
          const data = await res.json();
          if (data.globalMusicUrl) {
            setServerMusicUrl(data.globalMusicUrl === "/api/music/file" ? `${data.globalMusicUrl}?t=${Date.now()}` : data.globalMusicUrl);
          }
        }
      } catch (err) {
        console.error("Failed to load global music config:", err);
      }
    };
    const fetchClickSound = async () => {
      try {
        const res = await fetch("/api/click-sound/config");
        if (res.ok) {
          const data = await res.json();
          if (data.globalClickSoundUrl) {
            setServerClickSoundUrl(data.globalClickSoundUrl === "/api/click-sound/file" ? `${data.globalClickSoundUrl}?t=${Date.now()}` : data.globalClickSoundUrl);
          } else {
            setServerClickSoundUrl("");
          }
        }
      } catch (err) {
        console.error("Failed to load click sound config:", err);
      }
    };
    fetchGlobalMusic();
    fetchClickSound();
    fetchDynamicData();
  }, [isAdminPanelOpen]);

  useEffect(() => {
    const handleGlobalWindowClick = () => {
      playGlobalClick(serverClickSoundUrl, clickVolume);
    };
    window.addEventListener("click", handleGlobalWindowClick);
    return () => {
      window.removeEventListener("click", handleGlobalWindowClick);
    };
  }, [serverClickSoundUrl, clickVolume]);

  useEffect(() => {
    if (customAudioRef.current) {
      customAudioRef.current.volume = musicVolume;
    }
  }, [musicVolume, activePlayUrl]);

  useEffect(() => {
    localStorage.setItem("origin_music_enabled", String(musicEnabled));
    if (musicEnabled && activePlayUrl) {
      stopAmbientMusic();
      
      const handleInteraction = () => {
        if (customAudioRef.current) {
          customAudioRef.current.volume = musicVolume;
          customAudioRef.current.play().catch(err => console.log("Blocked custom play:", err));
        }
        window.removeEventListener("click", handleInteraction);
        window.removeEventListener("keydown", handleInteraction);
      };
      window.addEventListener("click", handleInteraction);
      window.addEventListener("keydown", handleInteraction);
      
      if (customAudioRef.current) {
        customAudioRef.current.volume = musicVolume;
        customAudioRef.current.play().catch(err => console.log("Blocked custom play:", err));
      }
      
      return () => {
        window.removeEventListener("click", handleInteraction);
        window.removeEventListener("keydown", handleInteraction);
      };
    } else {
      stopAmbientMusic();
      if (customAudioRef.current) {
        customAudioRef.current.pause();
      }
    }
  }, [musicEnabled, activePlayUrl]);

  useEffect(() => {
    localStorage.setItem("lttd_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem("lttd_rb_session");
        if (token) {
          const res = await fetch("/api/roblox/session-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: token })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.valid && data.user) {
              // Check if user is admin (strictly by isAdmin property)
              const isUserAdmin = !!data.user.isAdmin;
              if (isUserAdmin) {
                localStorage.setItem("origin_admin_bypass", "true");
                setIsBypassed(true);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to check admin status", err);
      }
    };
    checkAdminStatus();

    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current maintenance status and parse URL parameters
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const res = await fetch("/api/maintenance/status");
        if (res.ok) {
          const data = await res.json();
          setMaintenanceActive(data.active);
        }
      } catch (err) {
        console.error("Failed to load maintenance status:", err);
      }
    };
    fetchMaintenanceStatus();

    // Check for query parameters for admin bypass
    const params = new URLSearchParams(window.location.search);
    const bypassParam = params.get("bypass") || params.get("admin") || params.get("dev") || params.get("admin_key");
    if (bypassParam) {
      if (bypassParam === "aK9#mP2$vL8!qZ5@wN3&rY7*bT1^uJ4%xV6#Qm9$") {
        try {
          fetch("/api/maintenance/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: bypassParam, active: false })
          }).then(res => res.json()).then(data => {
            if (data.sessionToken) {
              localStorage.setItem("lttd_rb_session", data.sessionToken);
            }
          }).catch(console.error);

          localStorage.setItem("origin_admin_bypass", "true");
          localStorage.setItem("origin_admin_password", "aK9#mP2$vL8!qZ5@wN3&rY7*bT1^uJ4%xV6#Qm9$");
          setIsBypassed(true);
          setIsAdminPanelOpen(true);
          // Clean up the URL query params
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleDiscordLoginForAdmin = async () => {
    try {
      setAdminError("");
      const res = await fetch("/api/discord/oauth-start");
      const data = await res.json();
      if (data.authUrl && data.state) {
        const win = window.open(data.authUrl, "_blank");

        // Fast state polling (works seamlessly across iframe / popup boundaries)
        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/discord/oauth-poll?state=${data.state}`);
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.completed && pollData.sessionToken) {
                clearInterval(pollInterval);
                localStorage.setItem("lttd_rb_session", pollData.sessionToken);
                setLoggedTradeUser(pollData.user);
                setIsAdminUser(!!pollData.user?.isAdmin);
                if (win && !win.closed) {
                  try { win.close(); } catch(e){}
                }
                checkUserSession();
              }
            }
          } catch {}
        }, 700);

        // postMessage listener fallback
        const handler = (e: MessageEvent) => {
          if (e.data.type === "OAUTH_AUTH_SUCCESS") {
            const token = e.data.sessionToken;
            localStorage.setItem("lttd_rb_session", token);
            window.removeEventListener("message", handler);
            clearInterval(pollInterval);
            if (win && !win.closed) {
              try { win.close(); } catch(e){}
            }
            checkUserSession();
          }
        };
        window.addEventListener("message", handler);

        // Stop polling after 3 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          window.removeEventListener("message", handler);
        }, 180000);
      }
    } catch (err) {
      console.error("Discord OAuth Start error:", err);
      setAdminError("Failed to initiate Discord authorization");
    }
  };

  const handleAdminLogout = async () => {
    try {
      const token = localStorage.getItem("lttd_rb_session");
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({ sessionToken: token })
      });
    } catch (e) {
      console.error("Admin logout error:", e);
    }
    localStorage.removeItem("origin_admin_bypass");
    localStorage.removeItem("origin_admin_password");
    localStorage.removeItem("origin_admin_nickname");
    localStorage.removeItem("lttd_rb_session");
    setIsBypassed(false);
    setIsAdminUser(false);
    setIsAdminPanelOpen(false);
    setLoggedTradeUser(null);
    setShowAdminForm(false);
    checkUserSession();
  };

  const handleAdminBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    const token = localStorage.getItem("lttd_rb_session");
    if (!loggedTradeUser || !loggedTradeUser.discordId) {
      setAdminError("Please connect your Discord account first!");
      return;
    }

    if (!adminPasswordInput) {
      setAdminError("Please enter the admin password!");
      return;
    }

    try {
      const res = await fetch("/api/maintenance/toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({ 
          password: adminPasswordInput, 
          userSessionToken: token || undefined,
          active: maintenanceActive 
        })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("origin_admin_bypass", "true");
        localStorage.setItem("origin_admin_password", adminPasswordInput);
        if (data.sessionToken) {
          localStorage.setItem("lttd_rb_session", data.sessionToken);
          setIsAdminUser(true);
        }
        setIsBypassed(true);
        setIsAdminPanelOpen(true);
        setShowAdminForm(false);
        setAdminError("");
        checkUserSession();
      } else {
        const data = await res.json();
        setAdminError(data.error || "Invalid admin credentials!");
      }
    } catch (err) {
      setAdminError("Server connection error");
    }
  };

  const handleToggleMaintenance = async (newVal: boolean) => {
    setIsUpdatingMode(true);
    const password = localStorage.getItem("origin_admin_password") || "aK9#mP2$vL8!qZ5@wN3&rY7*bT1^uJ4%xV6#Qm9$";
    const adminNickname = adminNicknameInput || localStorage.getItem("origin_admin_nickname") || "Admin";
    const userSessionToken = localStorage.getItem("lttd_rb_session");
    try {
      const res = await fetch("/api/maintenance/toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": userSessionToken || ""
        },
        body: JSON.stringify({ 
          password, 
          active: newVal,
          adminNickname,
          userSessionToken
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceActive(data.active);
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "Failed to update maintenance status. Invalid admin password.";
        setAdminError(errMsg);
        alert(errMsg);
      }
    } catch (err) {
      alert("Failed to update maintenance status on the server.");
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const tabs = [
    { id: "links" as TabId, label: "Main Page", icon: Sparkles, color: "text-zinc-300", activeGlow: "border-zinc-500 bg-white/[0.04]" },
    { id: "updates-log" as TabId, label: "Updates Log", icon: History, color: "text-zinc-300", activeGlow: "border-zinc-500 bg-white/[0.04]" },
    { id: "roadmap" as TabId, label: "Updates Roadmap", icon: Map, color: "text-zinc-300", activeGlow: "border-zinc-500 bg-white/[0.04]" },
    { id: "countdown" as TabId, label: "Countdown", icon: Clock, color: "text-zinc-300", activeGlow: "border-zinc-500 bg-white/[0.04]" },
    { id: "value-list" as TabId, label: "Value List", icon: Compass, color: "text-zinc-300", activeGlow: "border-zinc-500 bg-white/[0.04]" },
    { id: "calculator" as TabId, label: "Trade Calculator", icon: Swords, color: "text-zinc-300", activeGlow: "border-zinc-500 bg-white/[0.04]" },
    { id: "community-trades" as TabId, label: "Community Trades", icon: ArrowRightLeft, color: "text-zinc-300", activeGlow: "border-zinc-500 bg-white/[0.04]" }
  ];

  if (isBanned) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center relative p-6 font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-lg w-full bg-[#08080f]/95 border border-rose-500/30 rounded-[32px] p-8 sm:p-10 shadow-2xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-8">
            <ShieldAlert className="w-3.5 h-3.5" />
            Account Suspended
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4 flex flex-col gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-600">
              Permanently Banned
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto mb-8 font-medium">
            Your account has been permanently suspended from accessing this service.
          </p>
          <div className="bg-black/50 border border-rose-500/20 p-4 rounded-2xl mb-8 text-left">
            <span className="block text-[10px] text-rose-400/70 font-black uppercase tracking-wider mb-2">Reason for Suspension</span>
            <span className="text-sm text-slate-300 font-medium">{banReason || "Violation of community guidelines."}</span>
          </div>
          <button onClick={() => { localStorage.removeItem("lttd_rb_session"); window.location.reload(); }} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm transition">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // If maintenance mode is active, and the user hasn't bypassed it, show the rework splash screen
  if (maintenanceActive && !isBypassed && !isAdminUser) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center relative p-6 font-sans overflow-hidden">
        <h1 
          className="text-3xl font-black text-white uppercase tracking-wider mb-8 cursor-default select-none"
          onDoubleClick={() => setShowAdminForm(true)}
        >
          Site Closed For Maintences
        </h1>

        {showAdminForm && (
          <div className="relative z-10 max-w-sm w-full text-center">
            <div className="border-t border-white/5 pt-5">
              <form onSubmit={handleAdminBypassSubmit} className="space-y-3 bg-[#08080f] border border-white/10 p-5 rounded-2xl shadow-2xl">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1 flex items-center gap-1.5 justify-center">
                  <Unlock className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Admin Authentication
                </div>

                {loggedTradeUser && loggedTradeUser.discordId ? (
                  <div className="text-[11px] text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl flex items-center justify-center gap-2.5">
                    <img 
                      src={loggedTradeUser.avatar || "https://img.icons8.com/color/48/discord-logo.png"} 
                      alt="" 
                      className="w-5 h-5 rounded-full border border-white/10" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left">
                      <div className="text-white font-bold leading-tight">@{loggedTradeUser.name}</div>
                      <div className="text-[9px] text-emerald-400 font-medium">Discord Authorized</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-400 font-mono">
                      🔒 <span className="text-indigo-300">Discord Login Required</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDiscordLoginForAdmin}
                      className="w-full py-2 px-3 bg-[#5865F2] hover:bg-[#4752C4] active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition duration-150 cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Sign In with Discord
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Admin Password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono text-center"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!loggedTradeUser || !loggedTradeUser.discordId}
                      className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black px-4 rounded-xl text-xs uppercase tracking-wider transition duration-150 cursor-pointer disabled:opacity-50"
                    >
                      Log In
                    </button>
                  </div>
                </div>

                {adminError && <p className="text-xs text-rose-500 font-medium">{adminError}</p>}
                <button
                  type="button"
                  onClick={() => setShowAdminForm(false)}
                  className="text-[9px] text-slate-500 hover:text-slate-400 underline uppercase tracking-wider block mx-auto cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 selection:bg-zinc-500/30 selection:text-indigo-200 antialiased relative overflow-x-hidden font-sans">
      {/* Admin Maintenance Controller Banner */}
      {isBypassed && (
        <div className="bg-blue-950/40 border-b border-blue-500/20 text-zinc-300 text-center py-2.5 px-4 relative z-50 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs font-mono select-none">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Wrench className="w-4 h-4 text-zinc-400 animate-pulse" />
            <span className="font-bold uppercase tracking-widest text-[10px] bg-zinc-600/20 text-zinc-300 px-2 py-0.5 rounded-full border border-blue-500/30">
              ADMIN BYPASS ACTIVE
            </span>
            <span className="text-slate-300">Logged in as administrator.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <span className="text-slate-400 hidden xs:inline">Maintenance for guests:</span>
            <button
              onClick={() => handleToggleMaintenance(!maintenanceActive)}
              disabled={isUpdatingMode}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition duration-200 cursor-pointer ${
                maintenanceActive
                  ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isUpdatingMode ? "Updating..." : maintenanceActive ? "ACTIVE" : "DISABLED"}
            </button>
            <button
              onClick={handleAdminLogout}
              className="text-[9px] text-rose-400 hover:text-rose-300 underline uppercase tracking-wider cursor-pointer font-bold"
            >
              Exit Admin
            </button>
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="text-[10px] text-zinc-300 hover:text-white font-bold uppercase tracking-wider cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/10 transition"
            >
              Admin Panel
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Outer Shell */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {/* Header bar */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="relative group shrink-0">
              <div className="relative bg-[#0c0d14] border border-zinc-700/30 p-2.5 sm:p-3 rounded-2xl shadow-md flex items-center justify-center">
                <Gem className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-300" />
              </div>
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-sans font-black tracking-wider text-white uppercase leading-none">
                  OFFICIAL ALLIANCE <span className="text-zinc-500">: TD VALUES</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-1.5 sm:mt-2">OFFICIAL ALLIANCE: TD MARKETPLACE & TRADING RESOURCE</p>
            </div>
          </div>

          {/* Right Side Header Controls (Settings & Clock) */}
          <div className="flex items-center gap-4 bg-[#05050a]/95 border border-white/5 p-2 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
            {/* Music Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (activePlayUrl) {
                    setMusicEnabled(!musicEnabled);
                  }
                }}
                className={`py-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all duration-150 border ${
                  musicEnabled && activePlayUrl
                    ? "bg-indigo-500/10 border-white/20/30 text-zinc-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] cursor-pointer" 
                    : activePlayUrl 
                      ? "bg-white/5 border-white/5 text-slate-400 hover:text-white cursor-pointer hover:bg-white/10"
                      : "bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed"
                }`}
                title={!activePlayUrl ? "Upload custom MP3 or configure server music to play" : musicEnabled ? "Mute music" : "Unmute music"}
                disabled={!activePlayUrl}
              >
                {musicEnabled && activePlayUrl ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-zinc-300 animate-pulse" />
                    <span>{customAudioFile ? "Custom MP3" : "Server Music"}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>{activePlayUrl ? "Music Muted" : "No Music Loaded"}</span>
                  </>
                )}
              </button>

              {musicEnabled && activePlayUrl && (
                <div className="flex flex-col gap-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-left shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-300">🔊</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={musicVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-12 sm:w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 text-indigo-500"
                      title={`Volume: ${Math.round(musicVolume * 100)}%`}
                    />
                    <span className="text-[9px] font-mono text-slate-400 w-6 text-right">{Math.round(musicVolume * 100)}%</span>
                  </div>
                  {/* Clickable volume presets */}
                  <div className="flex gap-1 justify-between mt-0.5">
                    {[0, 0.3, 0.6, 1.0].map((vol) => (
                      <button
                        key={vol}
                        onClick={() => handleVolumeChange(vol)}
                        className={`text-[8px] font-mono px-1 py-0.5 rounded transition border cursor-pointer ${
                          Math.abs(musicVolume - vol) < 0.03
                            ? "bg-indigo-500/20 border-white/20/40 text-zinc-300 font-extrabold"
                            : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {vol === 0 ? "🔇" : `${Math.round(vol * 100)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {serverClickSoundUrl && (
                <div className="flex flex-col gap-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-left shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-pink-300">⚡</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={clickVolume}
                      onChange={(e) => handleClickVolumeChange(parseFloat(e.target.value))}
                      className="w-12 sm:w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500 text-pink-500"
                      title={`Click Vol: ${Math.round(clickVolume * 100)}%`}
                    />
                    <span className="text-[9px] font-mono text-slate-400 w-6 text-right">{Math.round(clickVolume * 100)}%</span>
                  </div>
                  {/* Clickable volume presets */}
                  <div className="flex gap-1 justify-between mt-0.5">
                    {[0, 0.3, 0.6, 1.0].map((vol) => (
                      <button
                        key={vol}
                        onClick={() => handleClickVolumeChange(vol)}
                        className={`text-[8px] font-mono px-1 py-0.5 rounded transition border cursor-pointer ${
                          Math.abs(clickVolume - vol) < 0.03
                            ? "bg-pink-500/20 border-pink-500/40 text-pink-300 font-extrabold"
                            : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {vol === 0 ? "🔇" : `${Math.round(vol * 100)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Custom Audio File Button */}
              <div className="flex items-center gap-1">
                <label 
                  className={`p-1.5 rounded-xl border cursor-pointer hover:text-white transition flex items-center justify-center ${
                    customAudioFile 
                      ? "bg-indigo-500/20 border-white/20/40 text-zinc-300" 
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                  title={customAudioFile ? `Change track (current: ${customAudioFile.name})` : "Upload custom MP3 file"}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleCustomAudioChange}
                    className="hidden"
                  />
                </label>
                {customAudioFile && (
                  <button 
                    onClick={handleClearCustomAudio}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition flex items-center justify-center cursor-pointer"
                    title="Reset to server music"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Tab Selection Row */}
        <nav className="mb-8 w-full">
          <div className="w-full">
            <div className="bg-[#030407]/95 border border-white/5 p-1.5 sm:p-2 rounded-2xl grid grid-cols-2 xs:grid-cols-3 md:flex md:flex-wrap md:items-center md:justify-center gap-1 sm:gap-1.5 shadow-2xl backdrop-blur-xl">
              {tabs.map(tab => {
                const isSelected = activeTab === tab.id;
                const TabIcon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-2 px-2 xs:px-3 sm:py-3 sm:px-6 rounded-xl text-[10px] xs:text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2.5 transition duration-300 select-none cursor-pointer w-full md:w-auto ${
                      isSelected ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeTabOutline"
                        className={`absolute inset-0 rounded-xl border ${tab.activeGlow}`}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      />
                    )}
                    <TabIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 ${tab.color}`} strokeWidth={2.5} />
                    <span className="relative z-10 truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Active Content Body */}
        <AdminPanel 
          isOpen={isAdminPanelOpen} 
          onClose={() => setIsAdminPanelOpen(false)} 
          onRefreshData={fetchDynamicData} 
          onLogout={handleAdminLogout}
        />

        <main className="relative z-10 mb-8 min-h-[50vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "countdown" && <Countdown />}
              {activeTab === "value-list" && <ValuePage units={dynamicUnits} />}
              {activeTab === "calculator" && <TradeCalculator units={dynamicUnits} signatures={dynamicSignatures} />}
              {activeTab === "community-trades" && <CommunityTrades units={dynamicUnits} signatures={dynamicSignatures} />}
              {activeTab === "updates-log" && <UpdatesLog />}
              {activeTab === "roadmap" && <UpdatesRoadmap />}
              {activeTab === "links" && <LinksPage />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Contributors/Credits Section */}
        <div className="mt-8 mb-6 border-t border-white/5 pt-6 relative z-0">
          <div className="bg-[#05050a]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider font-sans">
                Info
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Site Creator */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Site Creator</span>
                <span className="text-xs font-black text-zinc-300 uppercase tracking-wide flex items-center gap-1">
                  👑 Frosty
                </span>
              </div>

              {/* Game Owner */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Game Owner</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1 font-sans">
                  🎮 DevMrUpTime
                </span>
              </div>

              {/* Site Testers */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Site Testers</span>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide font-sans">
                  Pavmez, Mamikon1122
                </span>
              </div>

              {/* Value Makers */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Value Makers</span>
                <span className="text-xs font-bold text-pink-300 uppercase tracking-wide font-sans">
                  Frosty, Maxej898, Bropksknife
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Footer with Admin Panel Link */}
        <footer className="border-t border-white/5 pt-6 flex flex-col items-center justify-between gap-4 md:flex-row text-[11px] text-slate-500 font-mono uppercase tracking-widest relative z-20">
          <div />
          <div className="flex items-center gap-6">
            {!isBypassed && !isAdminUser ? (
              <div className="flex flex-col items-center gap-2">
                {!showAdminForm ? (
                  <button
                    onClick={() => setShowAdminForm(true)}
                    className="text-[10px] text-slate-500 hover:text-zinc-400 font-mono uppercase tracking-widest transition duration-150 flex items-center gap-1.5 cursor-pointer hover:underline"
                  >
                    <Lock className="w-3 h-3" /> Admin Panel
                  </button>
                ) : (
                  <form onSubmit={handleAdminBypassSubmit} className="space-y-3 bg-[#08080f] border border-white/10 rounded-2xl p-4 w-72 shadow-2xl relative z-30">
                    <div className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mb-1 flex items-center gap-1.5 justify-center">
                      <Unlock className="w-3 h-3 text-amber-400 animate-pulse" /> Admin Panel Auth
                    </div>

                    {loggedTradeUser && loggedTradeUser.discordId ? (
                      <div className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl flex items-center justify-center gap-2">
                        <img 
                          src={loggedTradeUser.avatar || "https://img.icons8.com/color/48/discord-logo.png"} 
                          alt="" 
                          className="w-4 h-4 rounded-full border border-white/10" 
                          referrerPolicy="no-referrer"
                        />
                        <span>@{loggedTradeUser.name}</span>
                        <span className="text-[8px] text-emerald-400 font-bold px-1 py-0.2 bg-emerald-500/10 rounded">Verified</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[9px] text-slate-400 font-mono text-center">
                          🔒 Discord Auth Required
                        </div>
                        <button
                          type="button"
                          onClick={handleDiscordLoginForAdmin}
                          className="w-full py-1.5 px-2.5 bg-[#5865F2] hover:bg-[#4752C4] active:scale-95 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1.5 shadow transition duration-150 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                          Sign In with Discord
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Admin Password"
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono text-center"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!loggedTradeUser || !loggedTradeUser.discordId}
                          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold px-3 rounded-xl text-[10px] uppercase tracking-wider transition duration-150 cursor-pointer disabled:opacity-50"
                        >
                          Log In
                        </button>
                      </div>
                    </div>

                    {adminError && <p className="text-[10px] text-rose-500 font-medium text-center">{adminError}</p>}
                    <button
                      type="button"
                      onClick={() => setShowAdminForm(false)}
                      className="text-[9px] text-slate-500 hover:text-slate-400 underline uppercase tracking-wider block mx-auto cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="text-zinc-300 hover:text-white font-bold uppercase tracking-widest text-[10px] transition duration-150 flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
                >
                  <Lock className="w-3 h-3 text-amber-400" /> Admin Panel
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest text-[10px] transition duration-150 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </footer>
      </div>

      {/* Hidden HTML5 Audio Element for custom background tracks */}
      {activePlayUrl && (
        <audio
          ref={customAudioRef}
          src={activePlayUrl}
          loop
          style={{ display: "none" }}
        />
      )}
    </div>
  );
}
