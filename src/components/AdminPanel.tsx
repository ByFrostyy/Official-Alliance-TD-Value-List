import React, { useState, useEffect } from "react";
import { X, ShieldAlert, Plus, Trash2, Music, Check, Settings, Sparkles, Gem, Upload, Search, Sliders, List, Volume2, VolumeX, Flag, Ban, Calendar, Eye, Trash, ShieldCheck, ChevronDown, Info, Map, Clock, Rocket, Star, Wrench, CheckCircle2, Flame, Image as ImageIcon, ArrowUp, ArrowDown, Edit3, Save, History, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Unit, SignValue, Upgrade, RoadmapItem, CountdownConfig, UpdateLog } from "../types";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  onLogout?: () => void;
}

type AdminTab = "admins_audio" | "audit_logs" | "units" | "signatures" | "forbidden_words" | "reports" | "roadmap" | "countdown" | "updates_log";

const colorPresets = [
  { name: "Mythic Red", value: "#ef4444" },
  { name: "Exclusive Indigo", value: "#6366f1" },
  { name: "Legendary Gold", value: "#eab308" },
  { name: "Epic Purple", value: "#a855f7" },
  { name: "Emerald Sparkle", value: "#10b981" },
  { name: "Rainbow Flow", value: "linear-gradient(90deg, #ff0055 0%, #00ffcc 50%, #ffcc00 100%)" },
  { name: "Royal Gold Flow", value: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)" },
  { name: "Cosmic Dark", value: "linear-gradient(90deg, #818cf8 0%, #c084fc 100%)" },
];

export function AdminPanel({ isOpen, onClose, onRefreshData, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("admins_audio");
  
  const getAdminToken = () => {
    return localStorage.getItem("lttd_rb_session") || localStorage.getItem("origin_admin_password") || "";
  };

  const handleAdminLogout = async () => {
    try {
      const token = getAdminToken();
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token 
        },
        body: JSON.stringify({ sessionToken: token })
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("origin_admin_bypass");
    localStorage.removeItem("origin_admin_password");
    localStorage.removeItem("origin_admin_nickname");
    localStorage.removeItem("lttd_rb_session");
    if (onLogout) {
      onLogout();
    } else {
      onClose();
      window.location.reload();
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 1) {
      return `*@${domain}`;
    }
    return `${name.substring(0, 1)}${"*".repeat(name.length - 1)}@${domain}`;
  };

  // Toast System State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Custom Confirm Dialog State
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setCustomConfirm(null);
      }
    });
  };

  // Data State
  const [loading, setLoading] = useState(false);
  const [globalMusicUrl, setGlobalMusicUrl] = useState("");
  const [musicSaving, setMusicSaving] = useState(false);
  const [musicUploading, setMusicUploading] = useState(false);

  const [globalClickSoundUrl, setGlobalClickSoundUrl] = useState("");
  const [clickSoundSaving, setClickSoundSaving] = useState(false);
  const [clickSoundUploading, setClickSoundUploading] = useState(false);

  // Admin Security & Active Sessions State
  const [activeAdminSessions, setActiveAdminSessions] = useState<any[]>([]);
  const [adminLoginLogs, setAdminLoginLogs] = useState<any[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isVsnnnnn, setIsVsnnnnn] = useState(false);
  const [currentSessionToken, setCurrentSessionToken] = useState("");
  const [kickingToken, setKickingToken] = useState<string | null>(null);

  // Dynamic Content State
  const [unitsLoaded, setUnitsLoaded] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [signatures, setSignatures] = useState<SignValue[]>([]);
  const [unitsSearchQuery, setUnitsSearchQuery] = useState("");
  
  // Forbidden Words State
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);
  const [newForbiddenWord, setNewForbiddenWord] = useState("");
  const [forbiddenSearchQuery, setForbiddenSearchQuery] = useState("");

  // New Unit Form State
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitRarity, setNewUnitRarity] = useState("Exclusive");
  const [newUnitGems, setNewUnitGems] = useState(1000);
  const [newUnitDemand, setNewUnitDemand] = useState(5);
  const [newUnitStability, setNewUnitStability] = useState("Stable");
  const [newUnitImg, setNewUnitImg] = useState("");
  const [newUnitPlaceCost, setNewUnitPlaceCost] = useState(0);
  const [newUnitObtain, setNewUnitObtain] = useState("Summon");

  // Custom Select Dropdown State
  const [isRarityDropdownOpen, setIsRarityDropdownOpen] = useState(false);

  // Unit Upgrades / Levels Creator State
  const [newUnitUpgrades, setNewUnitUpgrades] = useState<Upgrade[]>([
    { lvl: 1, cost: "Place", dmg: 500, cd: 1, range: 20 }
  ]);

  // Editing Unit Upgrades Modal State
  const [editingUnitUpgrades, setEditingUnitUpgrades] = useState<Unit | null>(null);
  const [tempUpgradesList, setTempUpgradesList] = useState<Upgrade[]>([]);

  // New Signature Form State
  const [newSignName, setNewSignName] = useState("");
  const [newSignPercent, setNewSignPercent] = useState(10);
  const [newSignColor, setNewSignColor] = useState("#f59e0b");
  const [newSignRole, setNewSignRole] = useState("Partner");

  // Reports & Bans states
  const [reports, setReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("60"); // 60 mins default
  const [customDurationValue, setCustomDurationValue] = useState("30");
  const [customDurationUnit, setCustomDurationUnit] = useState("seconds"); // "seconds", "minutes", "hours", "days"
  const [banModalUser, setBanModalUser] = useState<{ userId: number, username: string, displayName: string } | null>(null);
  const [manualBanUserId, setManualBanUserId] = useState("");
  const [manualBanUsername, setManualBanUsername] = useState("");
  const [activeChatLogs, setActiveChatLogs] = useState<any[]>([]);
  const [viewingChatLogsId, setViewingChatLogsId] = useState<string | null>(null);

  const durationOptions = [
    { value: "5", label: "5 Minutes (Test / Brief)" },
    { value: "60", label: "1 Hour (Standard Warn)" },
    { value: "1440", label: "24 Hours (Severe violation)" },
    { value: "10080", label: "7 Days (Repeat offenses)" },
    { value: "permanent", label: "Permanent Ban (Forever)" },
    { value: "custom", label: "Custom Duration..." }
  ];

  const [isManualDurationOpen, setIsManualDurationOpen] = useState(false);
  const [isModalDurationOpen, setIsModalDurationOpen] = useState(false);

  // Roadmap State
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [editingRoadmapIndex, setEditingRoadmapIndex] = useState<number | null>(null);
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [roadmapStatus, setRoadmapStatus] = useState<"planned" | "in-progress" | "completed">("planned");
  const [roadmapDate, setRoadmapDate] = useState("");
  const [roadmapDescription, setRoadmapDescription] = useState("");
  const [roadmapIcon, setRoadmapIcon] = useState("Rocket");
  const [roadmapImage, setRoadmapImage] = useState("");
  const [roadmapFeaturesText, setRoadmapFeaturesText] = useState("");
  const [savingRoadmap, setSavingRoadmap] = useState(false);

  // Countdown State
  const [countdownConfig, setCountdownConfig] = useState<CountdownConfig>({
    enabled: true,
    title: "🔨 Crafts + Secret Units ✨ UPDATE",
    subtitle: "Target Release: Sun Aug 16, 2026, 18:00 (GMT+3)",
    targetDate: "2026-08-16T18:00",
    startDate: "2026-08-01T18:00",
    description: "Hop into Alliance: TD and enjoy the new upcoming features & crafts!",
    bannerImage: "https://i.postimg.cc/44b4qFry/16-20260701171125.png",
    teaserImages: [
      {
        url: "https://i.postimg.cc/44b4qFry/16-20260701171125.png",
        title: "Titan Camera Man",
        description: "Exclusive Unit"
      }
    ]
  });
  const [savingCountdown, setSavingCountdown] = useState(false);
  const [newTeaserUrl, setNewTeaserUrl] = useState("");
  const [newTeaserTitle, setNewTeaserTitle] = useState("");
  const [newTeaserDesc, setNewTeaserDesc] = useState("");

  // Update Logs State
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [editingUpdateIndex, setEditingUpdateIndex] = useState<number | null>(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDate, setUpdateDate] = useState("");
  const [updateTag, setUpdateTag] = useState("MAJOR UPDATE");
  const [updateImage, setUpdateImage] = useState("");
  const [updateIconIsSun, setUpdateIconIsSun] = useState(false);
  const [updateFeaturesText, setUpdateFeaturesText] = useState("");
  const [savingUpdateLogs, setSavingUpdateLogs] = useState(false);

  const fetchAdminSessionsAndLogs = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;
      const res = await fetch("/api/admin/sessions", {
        headers: { "Authorization": token }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSuperAdmin(!!data.isSuperAdmin);
        setIsVsnnnnn(!!data.isVsnnnnn);
        setCurrentSessionToken(data.currentSessionToken || "");
        setActiveAdminSessions(data.activeSessions || []);
        setAdminLoginLogs(data.loginLogs || []);
      } else if (res.status === 401) {
        const data = await res.json();
        if (data.kicked) {
          localStorage.removeItem("origin_admin_bypass");
          localStorage.removeItem("origin_admin_password");
          // Do NOT remove lttd_rb_session so they stay logged in as a normal user
          onClose();
          alert("Your access to the Admin Panel was revoked by the Master Admin! You can log back in with the password.");
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin sessions:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;
      const res = await fetch("/api/admin/audit-logs", {
        headers: { "Authorization": token }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const handleKickAdminSession = async (targetSessionToken: string) => {
    triggerConfirm(
      "Revoke Admin Session?",
      "Are you sure you want to revoke access for this admin session? They will need to log in again.",
      async () => {
        setKickingToken(targetSessionToken);
        try {
          const token = getAdminToken();
          const res = await fetch("/api/admin/sessions/kick", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ targetSessionToken })
          });
          if (res.ok) {
            showToast("Admin session successfully revoked!", "success");
            fetchAdminSessionsAndLogs();
            fetchAuditLogs();
          } else {
            const errData = await res.json();
            showToast(errData.error || "Failed to revoke session", "error");
          }
        } catch (err) {
          showToast("Error sending revoke request", "error");
        } finally {
          setKickingToken(null);
        }
      }
    );
  };

  const handleMarkLogsAsRead = async () => {
    try {
      const token = getAdminToken();
      await fetch("/api/admin/logs/read", {
        method: "POST",
        headers: { "Authorization": token }
      });
      setAdminLoginLogs(prev => prev.map(l => ({ ...l, unread: false })));
      showToast("All notifications marked as read", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLoginLogs = async () => {
    triggerConfirm(
      "Clear Login History?",
      "Are you sure you want to permanently clear all login notification logs? This action is restricted to Discord user vsnnnnn.",
      async () => {
        try {
          const token = getAdminToken();
          const res = await fetch("/api/admin/logs/clear", {
            method: "POST",
            headers: { "Authorization": token }
          });
          if (res.ok) {
            setAdminLoginLogs([]);
            showToast("Login notification history cleared successfully!", "success");
          } else {
            const errData = await res.json();
            showToast(errData.error || "Failed to clear login history", "error");
          }
        } catch (err) {
          showToast("Error clearing login history", "error");
        }
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setUnitsLoaded(false);
      fetchMusicConfig();
      fetchClickSoundConfig();
      fetchUnits();
      fetchSignatures();
      fetchForbiddenWords();
      fetchReports();
      fetchBannedUsers();
      fetchRoadmap();
      fetchCountdown();
      fetchUpdateLogs();
      fetchAdminSessionsAndLogs();
      fetchAuditLogs();

      const interval = setInterval(() => {
        fetchAdminSessionsAndLogs();
        fetchAuditLogs();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchUpdateLogs = async () => {
    try {
      const res = await fetch("/api/updates");
      if (res.ok) {
        const data = await res.json();
        setUpdateLogs(data.updates || []);
      }
    } catch (e) {
      console.error("Error fetching updates:", e);
    }
  };

  const handleSaveUpdateLogs = async (updatedList?: UpdateLog[]) => {
    setSavingUpdateLogs(true);
    try {
      const token = getAdminToken();
      const listToSave = updatedList || updateLogs;
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify({ updates: listToSave })
      });
      if (res.ok) {
        const data = await res.json();
        setUpdateLogs(data.updates || []);
        showToast("Update logs saved successfully!", "success");
      } else {
        showToast("Failed to save update logs.", "error");
      }
    } catch (e) {
      showToast("Error saving update logs", "error");
    } finally {
      setSavingUpdateLogs(false);
    }
  };

  const handleAddOrUpdateLogItem = () => {
    if (!updateTitle.trim()) {
      showToast("Please enter a title for the update log.", "error");
      return;
    }

    const parsedFeatures = updateFeaturesText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length >= 3) {
          return { icon: parts[0], text: parts[1], color: parts[2] };
        } else if (parts.length === 2) {
          return { icon: parts[0], text: parts[1], color: "text-indigo-400" };
        } else {
          return { icon: "✨", text: line, color: "text-indigo-400" };
        }
      });

    const newLogItem: UpdateLog = {
      id: editingUpdateIndex !== null ? updateLogs[editingUpdateIndex].id : `update-${Date.now()}`,
      title: updateTitle.trim(),
      date: updateDate.trim() || "TBA",
      tag: updateTag.trim() || "UPDATE",
      image: updateImage.trim() || "https://i.postimg.cc/44b4qFry/16-20260701171125.png",
      iconIsSun: updateIconIsSun,
      features: parsedFeatures
    };

    let updatedList: UpdateLog[];
    if (editingUpdateIndex !== null) {
      updatedList = [...updateLogs];
      updatedList[editingUpdateIndex] = newLogItem;
      setEditingUpdateIndex(null);
    } else {
      updatedList = [newLogItem, ...updateLogs];
    }

    setUpdateLogs(updatedList);
    handleSaveUpdateLogs(updatedList);

    setUpdateTitle("");
    setUpdateDate("");
    setUpdateTag("MAJOR UPDATE");
    setUpdateImage("");
    setUpdateIconIsSun(false);
    setUpdateFeaturesText("");
  };

  const handleEditUpdateLogItem = (index: number) => {
    const item = updateLogs[index];
    setEditingUpdateIndex(index);
    setUpdateTitle(item.title);
    setUpdateDate(item.date);
    setUpdateTag(item.tag || "UPDATE");
    setUpdateImage(item.image);
    setUpdateIconIsSun(!!item.iconIsSun);

    const formattedFeatures = (item.features || [])
      .map(f => `${f.icon} | ${f.text} | ${f.color || "text-indigo-400"}`)
      .join("\n");
    setUpdateFeaturesText(formattedFeatures);
  };

  const handleDeleteUpdateLogItem = (index: number) => {
    const updatedList = updateLogs.filter((_, i) => i !== index);
    setUpdateLogs(updatedList);
    handleSaveUpdateLogs(updatedList);
  };

  const handleMoveUpdateLogItem = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === updateLogs.length - 1)) return;
    const updatedList = [...updateLogs];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIdx];
    updatedList[targetIdx] = temp;
    setUpdateLogs(updatedList);
    handleSaveUpdateLogs(updatedList);
  };

  const fetchRoadmap = async () => {
    try {
      const res = await fetch("/api/roadmap");
      if (res.ok) {
        const data = await res.json();
        setRoadmapItems(data.roadmap || []);
      }
    } catch (e) {
      console.error("Error fetching roadmap:", e);
    }
  };

  const handleSaveRoadmap = async (updatedItems?: RoadmapItem[]) => {
    setSavingRoadmap(true);
    try {
      const token = getAdminToken();
      const itemsToSave = updatedItems || roadmapItems;
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify({ roadmap: itemsToSave })
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmapItems(data.roadmap || []);
        showToast("Updates Roadmap saved successfully!", "success");
        onRefreshData?.();
      } else {
        showToast("Failed to save roadmap.", "error");
      }
    } catch (err) {
      showToast("Error saving roadmap", "error");
    } finally {
      setSavingRoadmap(false);
    }
  };

  const handleAddOrUpdateRoadmapItem = () => {
    if (!roadmapTitle.trim()) {
      showToast("Please enter a title for the roadmap item.", "error");
      return;
    }

    const featuresList = roadmapFeaturesText
      .split("\n")
      .map(f => f.trim())
      .filter(Boolean);

    const newItem: RoadmapItem = {
      id: editingRoadmapIndex !== null ? roadmapItems[editingRoadmapIndex].id : Date.now().toString(),
      title: roadmapTitle.trim(),
      status: roadmapStatus,
      date: roadmapDate.trim() || "TBA",
      description: roadmapDescription.trim(),
      icon: roadmapIcon,
      image: roadmapImage.trim(),
      features: featuresList
    };

    let updatedList: RoadmapItem[] = [];
    if (editingRoadmapIndex !== null) {
      updatedList = [...roadmapItems];
      updatedList[editingRoadmapIndex] = newItem;
      setEditingRoadmapIndex(null);
    } else {
      updatedList = [...roadmapItems, newItem];
    }

    setRoadmapItems(updatedList);
    setRoadmapTitle("");
    setRoadmapDate("");
    setRoadmapDescription("");
    setRoadmapImage("");
    setRoadmapFeaturesText("");

    handleSaveRoadmap(updatedList);
  };

  const handleEditRoadmapItem = (index: number) => {
    const item = roadmapItems[index];
    setEditingRoadmapIndex(index);
    setRoadmapTitle(item.title);
    setRoadmapStatus(item.status);
    setRoadmapDate(item.date);
    setRoadmapDescription(item.description);
    setRoadmapIcon(item.icon || "Rocket");
    setRoadmapImage(item.image || "");
    setRoadmapFeaturesText(item.features ? item.features.join("\n") : "");
  };

  const handleDeleteRoadmapItem = (index: number) => {
    const updatedList = roadmapItems.filter((_, i) => i !== index);
    setRoadmapItems(updatedList);
    if (editingRoadmapIndex === index) {
      setEditingRoadmapIndex(null);
      setRoadmapTitle("");
      setRoadmapDate("");
      setRoadmapDescription("");
      setRoadmapImage("");
      setRoadmapFeaturesText("");
    }
    handleSaveRoadmap(updatedList);
  };

  const handleMoveRoadmapItem = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === roadmapItems.length - 1)) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updatedList = [...roadmapItems];
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIdx];
    updatedList[targetIdx] = temp;
    setRoadmapItems(updatedList);
    handleSaveRoadmap(updatedList);
  };

  const fetchCountdown = async () => {
    try {
      const res = await fetch("/api/countdown");
      if (res.ok) {
        const data = await res.json();
        if (data.countdown) {
          setCountdownConfig(data.countdown);
        }
      }
    } catch (e) {
      console.error("Error fetching countdown:", e);
    }
  };

  const handleSaveCountdown = async () => {
    setSavingCountdown(true);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/countdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify({ countdown: countdownConfig })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.countdown) {
          setCountdownConfig(data.countdown);
        }
        showToast("Update Countdown saved successfully!", "success");
        onRefreshData?.();
      } else {
        showToast("Failed to save countdown.", "error");
      }
    } catch (err) {
      showToast("Error saving countdown", "error");
    } finally {
      setSavingCountdown(false);
    }
  };

  const handleAddTeaserImage = () => {
    if (!newTeaserUrl.trim()) {
      showToast("Please provide an Image URL for the teaser.", "error");
      return;
    }
    const newTeasers = [
      ...(countdownConfig.teaserImages || []),
      {
        url: newTeaserUrl.trim(),
        title: newTeaserTitle.trim() || `Teaser #${(countdownConfig.teaserImages?.length || 0) + 1}`,
        description: newTeaserDesc.trim()
      }
    ];
    setCountdownConfig({ ...countdownConfig, teaserImages: newTeasers });
    setNewTeaserUrl("");
    setNewTeaserTitle("");
    setNewTeaserDesc("");
  };

  const handleRemoveTeaserImage = (index: number) => {
    const newTeasers = (countdownConfig.teaserImages || []).filter((_, i) => i !== index);
    setCountdownConfig({ ...countdownConfig, teaserImages: newTeasers });
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/reports", {
        headers: { "Authorization": token }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error("Error fetching reports:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/users/bans", {
        headers: { "Authorization": token }
      });
      if (res.ok) {
        const data = await res.json();
        setBannedUsers(data.bans || []);
      }
    } catch (e) {
      console.error("Error fetching bans:", e);
    }
  };

  const handleResolveReport = async (reportId: string, status: string = "resolved") => {
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Report marked as ${status}!`, "success");
        fetchReports();
      } else {
        showToast("Failed to update report.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating report", "error");
    }
  };

  const handleBanUser = async (
    userId: number,
    username: string,
    displayName: string,
    customReason?: string,
    customDurationStr?: string,
    valCustom?: number,
    unitCustom?: string,
    isMute?: boolean
  ) => {
    try {
      const token = getAdminToken();
      
      const finalReason = customReason !== undefined ? customReason : banReason;
      const finalDuration = customDurationStr !== undefined ? customDurationStr : banDuration;
      
      let payload: any = {
        userId,
        username,
        displayName,
        reason: finalReason || "Violation of rules",
        isMute: isMute || false
      };

      if (finalDuration === "permanent") {
        payload.durationMinutes = "permanent";
      } else if (finalDuration === "custom") {
        const value = valCustom !== undefined ? valCustom : Number(customDurationValue);
        const unit = unitCustom !== undefined ? unitCustom : customDurationUnit;
        
        let seconds = 0;
        if (unit === "seconds") {
          seconds = value;
        } else if (unit === "minutes") {
          seconds = value * 60;
        } else if (unit === "hours") {
          seconds = value * 3600;
        } else if (unit === "days") {
          seconds = value * 86400;
        }
        
        payload.durationSeconds = seconds;
        payload.durationMinutes = seconds / 60; // fallback for older clients
      } else {
        payload.durationMinutes = Number(finalDuration);
      }

      const res = await fetch("/api/users/ban", {
        method: "POST",
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`Successfully banned ${displayName}!`, "success");
        setBanReason("");
        setBanModalUser(null);
        fetchBannedUsers();
        fetchReports(); // Refresh reports list
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to ban user.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error executing ban", "error");
    }
  };

  const handleUnbanUser = async (userId: number, username?: string) => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/users/unban", {
        method: "POST",
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ userId, username })
      });
      if (res.ok) {
        showToast("User unbanned successfully!", "success");
        fetchBannedUsers();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to unban user.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error unbanning user", "error");
    }
  };

  const handleViewChatLogs = async (chatId: string) => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/chats/admin", {
        headers: { "Authorization": token }
      });
      if (res.ok) {
        const data = await res.json();
        const chat = (data.chats || []).find((c: any) => c.id === chatId);
        if (chat) {
          setActiveChatLogs(chat.messages || []);
          setViewingChatLogsId(chatId);
        } else {
          showToast("Chat context not found or already deleted.", "error");
        }
      } else {
        showToast("Failed to load chat history logs.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading chat logs", "error");
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch("/api/units");
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
        setUnitsLoaded(true);
      }
    } catch (e) {
      console.error("Error fetching units:", e);
    }
  };

  const fetchSignatures = async () => {
    try {
      const res = await fetch("/api/signatures");
      if (res.ok) {
        const data = await res.json();
        setSignatures(data.signatures || []);
      }
    } catch (e) {
      console.error("Error fetching signatures:", e);
    }
  };

  const saveUnitsToServer = async (updatedUnits: Unit[]) => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Authorization": token, "Content-Type": "application/json" },
        body: JSON.stringify({ units: updatedUnits })
      });
      if (res.ok) {
        setUnits(updatedUnits);
        if (onRefreshData) onRefreshData();
        return true;
      } else {
        showToast("Failed to save units. Ensure you are authenticated as admin.", "error");
        return false;
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving units to server", "error");
      return false;
    }
  };

  const saveSignaturesToServer = async (updatedSignatures: SignValue[]) => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Authorization": token, "Content-Type": "application/json" },
        body: JSON.stringify({ signatures: updatedSignatures })
      });
      if (res.ok) {
        setSignatures(updatedSignatures);
        if (onRefreshData) onRefreshData();
        return true;
      } else {
        showToast("Failed to save signatures. Ensure you are authenticated as admin.", "error");
        return false;
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving signatures to server", "error");
      return false;
    }
  };

  const fetchMusicConfig = async () => {
    try {
      const res = await fetch("/api/music/config");
      if (res.ok) {
        const data = await res.json();
        setGlobalMusicUrl(data.globalMusicUrl || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveMusicConfig = async () => {
    setMusicSaving(true);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/music/config", {
        method: "POST",
        headers: { "Authorization": token, "Content-Type": "application/json" },
        body: JSON.stringify({ url: globalMusicUrl.trim() })
      });
      if (res.ok) {
        showToast("Global background music link saved successfully!", "success");
        if (onRefreshData) onRefreshData();
      } else {
        showToast("Failed to save link. Make sure you are authenticated as an admin.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error communicating with server", "error");
    }
    setMusicSaving(false);
  };

  const handleMusicFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      showToast("Please select an audio file (.mp3, .ogg, etc.)", "error");
      return;
    }

    setMusicUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        const token = getAdminToken();
        const res = await fetch("/api/music/upload", {
          method: "POST",
          headers: { 
            "Authorization": token, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ base64Data: base64String })
        });
        if (res.ok) {
          showToast("Music file uploaded successfully!", "success");
          fetchMusicConfig();
          if (onRefreshData) onRefreshData();
        } else {
          const errData = await res.json();
          showToast(`Failed to upload: ${errData.error || "Unknown error"}`, "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error uploading file", "error");
      } finally {
        setMusicUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchClickSoundConfig = async () => {
    try {
      const res = await fetch("/api/click-sound/config");
      if (res.ok) {
        const data = await res.json();
        setGlobalClickSoundUrl(data.globalClickSoundUrl || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveClickSoundConfig = async () => {
    setClickSoundSaving(true);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/click-sound/config", {
        method: "POST",
        headers: { "Authorization": token, "Content-Type": "application/json" },
        body: JSON.stringify({ url: globalClickSoundUrl.trim() })
      });
      if (res.ok) {
        showToast("Global click sound link saved successfully!", "success");
        if (onRefreshData) onRefreshData();
      } else {
        showToast("Failed to save link. Make sure you are authenticated as an admin.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error communicating with server", "error");
    }
    setClickSoundSaving(false);
  };

  const handleClickSoundFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      showToast("Please select an audio file (.mp3, .ogg, .wav, etc.)", "error");
      return;
    }

    setClickSoundUploading(true);
    const tempUrl = URL.createObjectURL(file);
    const audioObj = new Audio(tempUrl);

    audioObj.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(tempUrl);
      if (audioObj.duration > 10.5) {
        showToast("Audio length exceeds the limit of 10 seconds! Please keep it 5-10s.", "error");
        setClickSoundUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          const token = getAdminToken();
          const res = await fetch("/api/click-sound/upload", {
            method: "POST",
            headers: { 
              "Authorization": token, 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify({ base64Data: base64String })
          });
          if (res.ok) {
            showToast("Click sound file uploaded successfully!", "success");
            fetchClickSoundConfig();
            if (onRefreshData) onRefreshData();
          } else {
            const errData = await res.json();
            showToast(`Failed to upload: ${errData.error || "Unknown error"}`, "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error uploading file", "error");
        } finally {
          setClickSoundUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });

    audioObj.addEventListener("error", () => {
      URL.revokeObjectURL(tempUrl);
      showToast("Could not load audio metadata. Proceeding with standard upload...", "info");
      
      // Fallback: load file directly anyway if browser fails metadata loading
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          const token = getAdminToken();
          const res = await fetch("/api/click-sound/upload", {
            method: "POST",
            headers: { 
              "Authorization": token, 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify({ base64Data: base64String })
          });
          if (res.ok) {
            showToast("Click sound file uploaded successfully!", "success");
            fetchClickSoundConfig();
            if (onRefreshData) onRefreshData();
          } else {
            const errData = await res.json();
            showToast(`Failed to upload: ${errData.error || "Unknown error"}`, "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error uploading file", "error");
        } finally {
          setClickSoundUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleResetClickSound = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/click-sound/reset", {
        method: "POST",
        headers: { "Authorization": token }
      });
      if (res.ok) {
        showToast("Click sound reset to default successfully!", "success");
        setGlobalClickSoundUrl("");
        if (onRefreshData) onRefreshData();
      } else {
        showToast("Failed to reset click sound. Ensure you are admin.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error resetting click sound", "error");
    }
  };

  const fetchForbiddenWords = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/forbidden-words", {
        headers: { "Authorization": token }
      });
      if (res.ok) {
        const data = await res.json();
        setForbiddenWords(data.forbiddenWords || []);
      }
    } catch (e) {
      console.error("Error fetching forbidden words:", e);
    }
  };

  const handleAddForbiddenWord = async () => {
    const word = newForbiddenWord.trim();
    if (!word) return;
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/forbidden-words", {
        method: "POST",
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ word })
      });
      if (res.ok) {
        const data = await res.json();
        setForbiddenWords(data.forbiddenWords || []);
        setNewForbiddenWord("");
        showToast("Banned word added successfully!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add word", "error");
      }
    } catch (e) {
      console.error("Error adding forbidden word:", e);
      showToast("Error adding forbidden word", "error");
    }
  };

  const handleDeleteForbiddenWord = async (word: string) => {
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/forbidden-words", {
        method: "DELETE",
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ word })
      });
      if (res.ok) {
        const data = await res.json();
        setForbiddenWords(data.forbiddenWords || []);
        showToast("Banned word deleted successfully!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete word", "error");
      }
    } catch (e) {
      console.error("Error deleting forbidden word:", e);
      showToast("Error deleting forbidden word", "error");
    }
  };

  // Unit Operations
  const handleUnitChange = (index: number, field: keyof Unit, value: any) => {
    const updated = [...units];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setUnits(updated);
  };

  const handleSaveAllUnits = () => {
    if (!unitsLoaded) return;
    saveUnitsToServer(units).then(success => {
      if (success) {
        showToast("All unit prices and values updated successfully!", "success");
      }
    });
  };

  const handleAddUnit = () => {
    if (!unitsLoaded) return;
    if (!newUnitName.trim()) {
      showToast("Please provide a name for the new unit", "error");
      return;
    }
    const defaultImg = "https://i.postimg.cc/mD8zQyY7/toilet-tower-defense-default.webp";
    const newUnit: Unit = {
      name: newUnitName.trim(),
      rarity: newUnitRarity,
      gems: Number(newUnitGems) || 0,
      demand: Number(newUnitDemand) || 0,
      stability: newUnitStability.trim() || "Stable",
      img: newUnitImg.trim() || defaultImg,
      placeCost: Number(newUnitPlaceCost) || 0,
      obtain: newUnitObtain.trim() || "Summon",
      upgrades: newUnitUpgrades
    };

    const updated = [newUnit, ...units];
    saveUnitsToServer(updated).then(success => {
      if (success) {
        setNewUnitName("");
        setNewUnitImg("");
        setNewUnitPlaceCost(0);
        setNewUnitObtain("Summon");
        setNewUnitUpgrades([{ lvl: 1, cost: "Place", dmg: 500, cd: 1, range: 20 }]);
        setUnits(updated);
        showToast(`Successfully added new unit: ${newUnit.name}`, "success");
      }
    });
  };

  const handleDeleteUnit = (name: string) => {
    if (!unitsLoaded) return;
    triggerConfirm(
      "Confirm Deletion",
      `Are you sure you want to delete unit: ${name}? This will instantly remove it from the value database.`,
      () => {
        const updated = units.filter(u => u.name !== name);
        saveUnitsToServer(updated).then(success => {
          if (success) {
            setUnits(updated);
            showToast("Unit deleted successfully!", "success");
          }
        });
      }
    );
  };

  // Signature Operations
  const handleSignatureChange = (index: number, field: keyof SignValue, value: any) => {
    const updated = [...signatures];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setSignatures(updated);
  };

  const handleSaveAllSignatures = () => {
    saveSignaturesToServer(signatures).then(success => {
      if (success) {
        showToast("All signatures updated successfully!", "success");
      }
    });
  };

  const handleAddSignature = () => {
    if (!newSignName.trim()) {
      showToast("Please provide a name for the new signature", "error");
      return;
    }
    const newSign: SignValue = {
      name: newSignName.trim(),
      percent: Number(newSignPercent) || 0,
      role: newSignRole.trim() || "Partner",
      color: newSignColor.trim() || "#f59e0b"
    };

    const updated = [...signatures, newSign];
    saveSignaturesToServer(updated).then(success => {
      if (success) {
        setNewSignName("");
        setSignatures(updated);
        showToast(`Successfully added signature: ${newSign.name}`, "success");
      }
    });
  };

  const handleDeleteSignature = (name: string) => {
    triggerConfirm(
      "Confirm Deletion",
      `Are you sure you want to delete signature: ${name}? This will instantly remove it from custom offers.`,
      () => {
        const updated = signatures.filter(s => s.name !== name);
        saveSignaturesToServer(updated).then(success => {
          if (success) {
            setSignatures(updated);
            showToast("Signature deleted successfully!", "success");
          }
        });
      }
    );
  };


  const filteredUnits = React.useMemo(() => {
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

    const list = units.filter(u => 
      u.name.toLowerCase().includes(unitsSearchQuery.toLowerCase()) ||
      u.rarity.toLowerCase().includes(unitsSearchQuery.toLowerCase())
    );

    return [...list].sort((a, b) => {
      const rA = getRarityIndex(a.rarity);
      const rB = getRarityIndex(b.rarity);
      if (rA !== rB) return rA - rB;
      return a.gems - b.gems;
    });
  }, [units, unitsSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans overflow-hidden">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0a0c16]/95 border border-zinc-500/25 p-6 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col gap-5 shadow-neon-zinc relative"
      >
        <div className="absolute top-5 right-5 flex items-center gap-2 z-50">
          <button
            onClick={handleAdminLogout}
            title="Log Out of Admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold font-mono transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition select-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 shrink-0">
          <div className="p-2 bg-zinc-500/10 border border-zinc-500/20 rounded-xl text-zinc-300">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black text-white uppercase tracking-wider text-glow-zinc">Admin Panel</h3>
            <p className="text-xs text-slate-400 font-mono">Real-time dynamic unit values & background audio</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap border-b border-white/5 pb-3 shrink-0 gap-2 select-none">
          <button
            onClick={() => setActiveTab("admins_audio")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeTab === "admins_audio"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>Security & Music</span>
            {adminLoginLogs.some(l => l.unread) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("audit_logs")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "audit_logs"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Audit Logs ({adminAuditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === "units"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            Manage Units ({units.length})
          </button>
          <button
            onClick={() => setActiveTab("signatures")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === "signatures"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            Manage Signatures ({signatures.length})
          </button>
          <button
            onClick={() => setActiveTab("forbidden_words")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === "forbidden_words"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            Chat Bad Words ({forbiddenWords.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${activeTab === "reports" ? "text-black" : "text-slate-400"}`} /> Complaints & Bans
            {reports.filter(r => r.status === "active").length > 0 && (
              <span className={`font-extrabold text-[9px] px-1.5 py-0.5 rounded-full ${
                activeTab === "reports" ? "bg-black text-white" : "bg-rose-500 text-white"
              }`}>
                {reports.filter(r => r.status === "active").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "roadmap"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Map className="w-3.5 h-3.5" /> Roadmap ({roadmapItems.length})
          </button>
          <button
            onClick={() => setActiveTab("countdown")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "countdown"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Countdown
          </button>
          <button
            onClick={() => setActiveTab("updates_log")}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "updates_log"
                ? "bg-white text-black border border-white shadow-sm"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Update Log ({updateLogs.length})
          </button>
        </div>

        {/* Dynamic Tab Body content */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <AnimatePresence mode="wait">
            {activeTab === "admins_audio" && (
              <motion.div
                key="admins_audio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* 1. Admin Login Notifications Card */}
                <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-red-500/20 rounded-xl text-red-400">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          Panel Login Notifications
                          {adminLoginLogs.filter(l => l.unread).length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-bounce">
                              {adminLoginLogs.filter(l => l.unread).length} NEW
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">Real-time alerts whenever an administrator logs into the Admin Panel</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {adminLoginLogs.some(l => l.unread) && (
                        <button
                          onClick={handleMarkLogsAsRead}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition cursor-pointer"
                        >
                          Mark as Read
                        </button>
                      )}
                      {isVsnnnnn && adminLoginLogs.length > 0 && (
                        <button
                          onClick={handleClearLoginLogs}
                          className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-xs font-bold text-red-200 transition cursor-pointer flex items-center gap-1.5"
                          title="Clear all login notification logs (Restricted to Discord user vsnnnnn)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear History
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-white/5 bg-black/40 border border-white/5 rounded-xl p-2 font-mono scrollbar-thin">
                    {adminLoginLogs.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">Login logs are empty. Everything is secure!</div>
                    ) : (
                      adminLoginLogs.map(log => (
                        <div key={log.id} className={`p-2.5 flex items-start justify-between gap-3 text-xs ${log.unread ? "bg-red-500/10 rounded-lg border border-red-500/20" : ""}`}>
                          <div className="flex flex-col gap-1 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                log.isSuperAdmin ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}>
                                {log.isSuperAdmin ? "Master Owner" : "Admin"}
                              </span>
                              <span className="text-white font-bold">
                                {log.adminName || log.discordTag || "Admin User"}
                              </span>
                              {log.discordTag && (
                                <span className="text-indigo-400 font-bold text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                  {log.discordTag}
                                </span>
                              )}
                              {log.unread && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                            </div>
                            <span className="text-[10px] text-slate-400">{log.text}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Active Admin Sessions & Kick Controls */}
                <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          Active Admin Sessions ({activeAdminSessions.length})
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {isVsnnnnn
                            ? "⭐ Only Discord user vsnnnnn has full authority to revoke active sessions."
                            : "🔒 Only Discord user vsnnnnn has permissions to revoke active admin sessions."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {activeAdminSessions.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500">No active admin sessions found.</div>
                    ) : (
                      activeAdminSessions.map(sess => {
                        const isCurrent = sess.sessionToken === currentSessionToken;
                        return (
                          <div
                            key={sess.sessionToken}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                              isCurrent
                                ? "bg-emerald-500/5 border-emerald-500/30"
                                : "bg-black/30 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${isCurrent ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                              <div className="flex flex-col gap-0.5 text-left font-mono">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-white">
                                    {sess.adminName || sess.discordTag || "Administrator"}
                                  </span>
                                  {sess.discordTag && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                      Discord: {sess.discordTag}
                                    </span>
                                  )}
                                  {sess.robloxName && sess.robloxName !== sess.adminName && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono">
                                      {sess.robloxName}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                                    sess.isSuperAdmin ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"
                                  }`}>
                                    {sess.isSuperAdmin ? "Master Admin" : "Administrator"}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[10px] text-emerald-400 font-bold">(Current Session)</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* KICK BUTTON (Only visible to vsnnnnn for non-current sessions) */}
                            {!isCurrent && (
                              <div>
                                {isVsnnnnn ? (
                                  <button
                                    onClick={() => handleKickAdminSession(sess.sessionToken)}
                                    disabled={kickingToken === sess.sessionToken}
                                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg cursor-pointer select-none"
                                    title="Revoke session access"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    {kickingToken === sess.sessionToken ? "Revoking..." : "Revoke Session"}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono italic">
                                    Protected (Only vsnnnnn)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Global Background Music Player */}
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-zinc-300" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Global Background Music Player</h4>
                  </div>

                  {/* Direct File Upload */}
                  <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Upload Background MP3 Audio File</label>
                    <div className="relative border-2 border-dashed border-white/10 hover:border-zinc-500/50 rounded-2xl p-6 text-center transition bg-black/30 group">
                      <input
                        type="file"
                        accept="audio/mpeg, audio/mp3"
                        onChange={handleMusicFileUpload}
                        disabled={musicUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <Upload className={`w-8 h-8 text-zinc-300 ${musicUploading ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                        <span className="text-xs font-bold text-slate-200">
                          {musicUploading ? "Uploading audio file..." : "Drag & Drop or Click to Upload MP3"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Maximum size: 50MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Fallback Direct URL */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fallback Music Direct URL (.mp3)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={globalMusicUrl}
                        onChange={(e) => setGlobalMusicUrl(e.target.value)}
                        placeholder="https://example.com/audio.mp3"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500/50 font-mono"
                      />
                      <button
                        onClick={saveMusicConfig}
                        disabled={musicSaving}
                        className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition select-none cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Save Link
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                      Current play route: <span className="text-zinc-300">{globalMusicUrl || "Muted / No Music Set"}</span>
                    </p>
                  </div>
                </div>

                {/* Global Click Sound Customizer */}
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-zinc-300" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Global Click Sound Customizer</h4>
                    </div>
                    {/* Reset Button */}
                    <button
                      onClick={handleResetClickSound}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/20 cursor-pointer transition"
                      title="Reset click sound to silence (default)"
                    >
                      Reset to Silence
                    </button>
                  </div>

                  {/* Direct Click Sound File Upload */}
                  <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Upload Click Sound Audio File (MP3)</label>
                    <div className="relative border-2 border-dashed border-white/10 hover:border-zinc-500/50 rounded-2xl p-6 text-center transition bg-black/30 group">
                      <input
                        type="file"
                        accept="audio/mpeg, audio/mp3"
                        onChange={handleClickSoundFileUpload}
                        disabled={clickSoundUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <Upload className={`w-8 h-8 text-zinc-300 ${clickSoundUploading ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                        <span className="text-xs font-bold text-slate-200">
                          {clickSoundUploading ? "Uploading sound file..." : "Drag & Drop or Click to Upload MP3 click sound (Max 5-10s)"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Maximum length: 5-10 seconds • Max size: 2MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Link Input */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Click Sound Direct URL (.mp3)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={globalClickSoundUrl}
                        onChange={(e) => setGlobalClickSoundUrl(e.target.value)}
                        placeholder="https://example.com/click.mp3"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500/50 font-mono"
                      />
                      <button
                        onClick={saveClickSoundConfig}
                        disabled={clickSoundSaving}
                        className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition select-none cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Save Link
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                      Current play route: <span className="text-zinc-300">{globalClickSoundUrl || "Muted / No Click Sound (default)"}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "audit_logs" && (
              <motion.div
                key="audit_logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                        <History className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          Admin Action Audit Logs ({adminAuditLogs.length})
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Track remote changes, additions, deletions, unit updates, and moderation actions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={auditSearchQuery}
                          onChange={(e) => setAuditSearchQuery(e.target.value)}
                          placeholder="Search logs..."
                          className="bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 font-mono"
                        />
                      </div>
                      <button
                        onClick={fetchAuditLogs}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        title="Refresh Logs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5 bg-black/40 border border-white/5 rounded-xl p-2 font-mono scrollbar-thin">
                    {adminAuditLogs.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-500">
                        No admin audit logs recorded yet. Actions taken in the admin panel will appear here.
                      </div>
                    ) : (
                      adminAuditLogs
                        .filter(log => {
                          if (!auditSearchQuery.trim()) return true;
                          const q = auditSearchQuery.toLowerCase();
                          return (
                            (log.adminName && log.adminName.toLowerCase().includes(q)) ||
                            (log.action && log.action.toLowerCase().includes(q)) ||
                            (log.details && log.details.toLowerCase().includes(q))
                          );
                        })
                        .map(log => (
                          <div key={log.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] rounded-lg transition">
                            <div className="flex flex-col gap-1 text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase">
                                  {log.adminName || "Admin"}
                                </span>
                                <span className="text-white font-black">{log.action}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 bg-black/40 p-2 rounded-lg border border-white/5 font-mono text-left break-all">
                                {log.details}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono self-start md:self-center">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "units" && (
              <motion.div
                key="units"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Create New Unit Expander */}
                <div className="bg-blue-500/5 border border-white/20 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h4 className="text-sm font-black uppercase tracking-wider">Create New Unit</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Titan TV Man"
                        value={newUnitName}
                        onChange={e => setNewUnitName(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Rarity</label>
                      <button
                        type="button"
                        onClick={() => setIsRarityDropdownOpen(!isRarityDropdownOpen)}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-semibold flex items-center justify-between text-left select-none cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            newUnitRarity === "Basic" ? "bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.5)]" :
                            newUnitRarity === "Common" ? "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]" :
                            newUnitRarity === "Uncommon" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" :
                            newUnitRarity === "Rare" ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" :
                            newUnitRarity === "Epic" ? "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]" :
                            newUnitRarity === "Legendary" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" :
                            newUnitRarity === "Mythic" ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]" :
                            newUnitRarity === "Exclusive" ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" :
                            newUnitRarity === "Godly" ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" :
                            "bg-zinc-600"
                          }`} />
                          <span>{newUnitRarity}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">▼</span>
                      </button>

                      <AnimatePresence>
                        {isRarityDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsRarityDropdownOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 max-h-60 overflow-y-auto divide-y divide-white/5 scrollbar-thin"
                            >
                              {["Basic", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Exclusive", "Godly", "Crate"].map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setNewUnitRarity(r);
                                    setIsRarityDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-xs text-left text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2 font-semibold ${
                                    newUnitRarity === r ? "bg-white/5 text-white" : ""
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${
                                    r === "Basic" ? "bg-zinc-400" :
                                    r === "Common" ? "bg-slate-400" :
                                    r === "Uncommon" ? "bg-emerald-400" :
                                    r === "Rare" ? "bg-sky-400" :
                                    r === "Epic" ? "bg-purple-400" :
                                    r === "Legendary" ? "bg-amber-400" :
                                    r === "Mythic" ? "bg-rose-400" :
                                    r === "Exclusive" ? "bg-indigo-400" :
                                    r === "Godly" ? "bg-cyan-400" :
                                    "bg-zinc-600"
                                  }`} />
                                  <span>{r}</span>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Gems Value</label>
                      <input
                        type="number"
                        value={newUnitGems}
                        onChange={e => setNewUnitGems(Number(e.target.value))}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Demand (0-10)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={newUnitDemand}
                        onChange={e => setNewUnitDemand(Number(e.target.value))}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Stability</label>
                      <input
                        type="text"
                        placeholder="e.g., Stable, Dropping, Hyped"
                        value={newUnitStability}
                        onChange={e => setNewUnitStability(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Place Cost (Money)</label>
                      <input
                        type="number"
                        value={newUnitPlaceCost}
                        onChange={e => setNewUnitPlaceCost(Number(e.target.value))}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Obtain Method</label>
                      <input
                        type="text"
                        placeholder="e.g., Summon, Trading, Code"
                        value={newUnitObtain}
                        onChange={e => setNewUnitObtain(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Image URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://i.postimg.cc/..."
                          value={newUnitImg}
                          onChange={e => setNewUnitImg(e.target.value)}
                          className="flex-1 bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                        />
                        {newUnitImg && (
                          <div className="w-10 h-10 border border-white/10 rounded-xl overflow-hidden shrink-0 bg-black flex items-center justify-center">
                            <img src={newUnitImg} alt="Preview" onError={(e) => { e.currentTarget.src = "https://i.postimg.cc/t48x3JRN/2c2c3d84-6c43-441d-9fd2-fd7ae36bf27e.png"; }} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upgrades Creator Section */}
                  <div className="border-t border-white/5 pt-4 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-white">
                        <Sliders className="w-4 h-4 text-white animate-pulse" />
                        <h5 className="text-xs font-black uppercase tracking-wider font-sans">Unit Levels & Stats</h5>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const basePlace = Number(newUnitPlaceCost) || 1000;
                            setNewUnitUpgrades([
                              { lvl: 1, cost: "Place", dmg: 500, cd: 1, range: 20 },
                              { lvl: 2, cost: `$${Math.round(basePlace * 1.5)}`, dmg: 1000, cd: 0.8, range: 25 },
                              { lvl: 3, cost: `$${Math.round(basePlace * 3)}`, dmg: 2200, cd: 0.6, range: 30 },
                              { lvl: 4, cost: `$${Math.round(basePlace * 5)}`, dmg: 3800, cd: 0.5, range: 35 },
                              { lvl: 5, cost: `$${Math.round(basePlace * 8)}`, dmg: 5500, cd: 0.4, range: 45 }
                            ]);
                            showToast("Generated 5 balanced levels based on Place Cost!", "info");
                          }}
                          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer transition"
                        >
                          ⚡ Auto 5 Lvls
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const basePlace = Number(newUnitPlaceCost) || 1000;
                            setNewUnitUpgrades([
                              { lvl: 1, cost: "Place", dmg: 500, cd: 1, range: 20 },
                              { lvl: 2, cost: `$${Math.round(basePlace * 1.5)}`, dmg: 1000, cd: 0.8, range: 25 },
                              { lvl: 3, cost: `$${Math.round(basePlace * 3)}`, dmg: 2200, cd: 0.6, range: 30 },
                              { lvl: 4, cost: `$${Math.round(basePlace * 5)}`, dmg: 3800, cd: 0.5, range: 35 },
                              { lvl: 5, cost: `$${Math.round(basePlace * 8)}`, dmg: 5500, cd: 0.4, range: 45 },
                              { lvl: 6, cost: `$${Math.round(basePlace * 12)}`, dmg: 8000, cd: 0.3, range: 50 }
                            ]);
                            showToast("Generated 6 balanced levels based on Place Cost!", "info");
                          }}
                          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer transition"
                        >
                          ⚡ Auto 6 Lvls
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextLvl = newUnitUpgrades.length + 1;
                            const prevLvl = newUnitUpgrades[newUnitUpgrades.length - 1];
                            const prevCost = prevLvl && prevLvl.cost !== "Place" ? parseInt(prevLvl.cost.replace(/[^0-9]/g, ""), 10) : 1000;
                            const nextCost = prevLvl ? (isNaN(prevCost) ? 1000 : Math.round(prevCost * 1.8)) : 1000;
                            setNewUnitUpgrades([
                              ...newUnitUpgrades,
                              {
                                lvl: nextLvl,
                                cost: nextLvl === 1 ? "Place" : `$${nextCost}`,
                                dmg: prevLvl ? Math.round((prevLvl.dmg || 500) * 1.6) : 500,
                                cd: prevLvl ? Number(((prevLvl.cd || 1) * 0.9).toFixed(2)) : 1,
                                range: prevLvl ? Math.round((prevLvl.range || 20) * 1.2) : 20
                              }
                            ]);
                          }}
                          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 border border-white/5 cursor-pointer transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Level
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden shadow-inner mb-4">
                      <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-black/60 text-[9px] font-black text-slate-500 uppercase tracking-widest select-none font-mono">
                        <span className="col-span-1 text-center">LVL</span>
                        <span className="col-span-3 text-center">UPGRADE COST</span>
                        <span className="col-span-3 text-center font-black">DAMAGE (DMG)</span>
                        <span className="col-span-2 text-center">COOLDOWN</span>
                        <span className="col-span-2 text-center">RADIUS (RANGE)</span>
                        <span className="col-span-1 text-right"></span>
                      </div>

                      <div className="divide-y divide-white/5 max-h-56 overflow-y-auto scrollbar-thin">
                        {newUnitUpgrades.map((upgrade, index) => (
                          <div key={index} className="grid grid-cols-12 gap-1 px-3 py-1.5 items-center hover:bg-white/[0.01]">
                            <div className="col-span-1 text-center text-xs font-black font-mono text-white">
                              {upgrade.lvl}
                            </div>

                            <div className="col-span-3 px-1">
                              <input
                                type="text"
                                placeholder="e.g. Place"
                                value={upgrade.cost}
                                onChange={e => {
                                  const updated = [...newUnitUpgrades];
                                  updated[index].cost = e.target.value;
                                  setNewUnitUpgrades(updated);
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-1.5 text-center text-xs font-semibold text-white focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>

                            <div className="col-span-3 px-1">
                              <input
                                type="number"
                                placeholder="Dmg"
                                value={upgrade.dmg || ""}
                                onChange={e => {
                                  const updated = [...newUnitUpgrades];
                                  updated[index].dmg = Number(e.target.value);
                                  setNewUnitUpgrades(updated);
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-1.5 text-center text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                              />
                            </div>

                            <div className="col-span-2 px-1">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="CD"
                                value={upgrade.cd || ""}
                                onChange={e => {
                                  const updated = [...newUnitUpgrades];
                                  updated[index].cd = Number(e.target.value);
                                  setNewUnitUpgrades(updated);
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-1.5 text-center text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>

                            <div className="col-span-2 px-1">
                              <input
                                type="number"
                                placeholder="Range"
                                value={upgrade.range || ""}
                                onChange={e => {
                                  const updated = [...newUnitUpgrades];
                                  updated[index].range = Number(e.target.value);
                                  setNewUnitUpgrades(updated);
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-1.5 text-center text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>

                            <div className="col-span-1 text-right">
                              {newUnitUpgrades.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = newUnitUpgrades.filter((_, idx) => idx !== index).map((u, i) => ({
                                      ...u,
                                      lvl: i + 1,
                                      cost: i === 0 ? "Place" : u.cost === "Place" ? "$1000" : u.cost
                                    }));
                                    setNewUnitUpgrades(updated);
                                  }}
                                  className="text-rose-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded cursor-pointer transition flex items-center justify-center mx-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddUnit}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white font-extrabold uppercase tracking-wider text-xs rounded-xl shadow-sm transition hover:scale-[1.01] cursor-pointer"
                  >
                    Create & Publish Unit
                  </button>
                </div>

                {/* Edit Existing Units */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Gem className="w-5 h-5 text-white" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Unit Value Database</h4>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search units to edit..."
                        value={unitsSearchQuery}
                        onChange={e => setUnitsSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="flex bg-black/40 border-b border-white/10 px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest select-none font-mono">
                      <span className="w-[28%] text-left">Unit Name & Thumbnail</span>
                      <span className="w-[18%] text-center">Gems Value</span>
                      <span className="w-[12%] text-center">Demand (10)</span>
                      <span className="w-[18%] text-center">Stability</span>
                      <span className="w-[14%] text-center">Levels/Stats</span>
                      <span className="w-[10%] text-right pr-2">Delete</span>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
                      {filteredUnits.map((u, idx) => {
                        // Find original index in source array
                        const originalIndex = units.findIndex(original => original.name === u.name);

                        return (
                          <div key={u.name} className="flex items-center px-4 py-3 hover:bg-white/[0.02] transition">
                            <div className="w-[28%] flex items-center gap-3 pr-2 min-w-0">
                              <img src={u.img} alt={u.name} onError={(e) => { e.currentTarget.src = "https://i.postimg.cc/t48x3JRN/2c2c3d84-6c43-441d-9fd2-fd7ae36bf27e.png"; }} className="w-10 h-10 object-cover rounded-lg border border-white/10 bg-black shrink-0" />
                              <div className="min-w-0 text-left">
                                <div className="text-xs font-extrabold text-white truncate">{u.name}</div>
                                <div className="text-[9px] text-slate-500 uppercase font-mono">{u.rarity}</div>
                              </div>
                            </div>

                            <div className="w-[18%] px-2 flex justify-center">
                              <input
                                type="number"
                                value={u.gems}
                                onChange={e => handleUnitChange(originalIndex, "gems", Number(e.target.value))}
                                className="w-full max-w-[90px] bg-black/60 border border-white/10 rounded-lg p-1.5 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="w-[12%] px-2 flex justify-center">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={u.demand}
                                onChange={e => handleUnitChange(originalIndex, "demand", Number(e.target.value))}
                                className="w-full max-w-[60px] bg-black/60 border border-white/10 rounded-lg p-1.5 text-center text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="w-[18%] px-2 flex justify-center">
                              <input
                                type="text"
                                value={u.stability}
                                onChange={e => handleUnitChange(originalIndex, "stability", e.target.value)}
                                className="w-full max-w-[110px] bg-black/60 border border-white/10 rounded-lg p-1.5 text-center text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="w-[14%] px-2 flex justify-center">
                              <button
                                onClick={() => {
                                  setEditingUnitUpgrades(u);
                                  setTempUpgradesList(u.upgrades || [{ lvl: 1, cost: "Place", dmg: 500, cd: 1, range: 20 }]);
                                }}
                                className="text-white hover:text-white p-2 hover:bg-blue-500/15 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider border border-white/20"
                                title="Edit Levels & Stats"
                              >
                                <Sliders className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden md:inline">Edit</span>
                              </button>
                            </div>

                            <div className="w-[10%] flex justify-end pr-2">
                              <button
                                onClick={() => handleDeleteUnit(u.name)}
                                className="text-rose-500 hover:text-rose-400 p-2 hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {filteredUnits.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-600 italic select-none">No units matched your query.</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAllUnits}
                    className="w-full py-4 bg-gray-900 hover:bg-black active:scale-95 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-sm select-none cursor-pointer"
                  >
                    Save All Unit Value Changes
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "signatures" && (
              <motion.div
                key="signatures"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Create New Signature Expander */}
                <div className="bg-blue-500/5 border border-white/20 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h4 className="text-sm font-black uppercase tracking-wider">Create New Signature Type</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Signature Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Frosty"
                        value={newSignName}
                        onChange={e => setNewSignName(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-semibold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Status / Role (e.g. Partner, Developer)</label>
                      <input
                        type="text"
                        placeholder="e.g. Partner, Developer, YouTuber"
                        value={newSignRole}
                        onChange={e => setNewSignRole(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-semibold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Percentage Boost (+% to base value)</label>
                      <input
                        type="number"
                        value={newSignPercent}
                        onChange={e => setNewSignPercent(Number(e.target.value))}
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Hex Color or CSS Gradient</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., #10b981 or linear-gradient(...)"
                          value={newSignColor}
                          onChange={e => setNewSignColor(e.target.value)}
                          className="flex-1 bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                        />
                        <div className="relative w-10 h-10 shrink-0 border border-white/10 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                          <input
                            type="color"
                            value={newSignColor.startsWith("#") ? newSignColor : "#ffffff"}
                            onChange={e => setNewSignColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-6 h-6 rounded-md border border-white/20" style={{ backgroundColor: newSignColor.startsWith("#") ? newSignColor : "#ffffff" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddSignature}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white font-extrabold uppercase tracking-wider text-xs rounded-xl shadow-sm transition hover:scale-[1.01] cursor-pointer"
                  >
                    Add & Publish Signature
                  </button>
                </div>

                {/* Edit Existing Signatures */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5 text-white" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Active Custom Signatures</h4>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="flex bg-black/40 border-b border-white/10 px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest select-none font-mono">
                      <span className="w-1/4 text-left">Signature Name</span>
                      <span className="w-1/4 text-center">Status / Role</span>
                      <span className="w-1/6 text-center">Boost (%)</span>
                      <span className="w-1/4 text-center">Color / Hex</span>
                      <span className="w-1/12 text-right">Delete</span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
                      {signatures.map((s, idx) => (
                        <div key={s.name} className="flex items-center px-4 py-3 hover:bg-white/[0.02] transition">
                          <div className="w-1/4 text-left">
                            <span
                              style={{
                                background: s.color.includes("gradient") ? s.color : "transparent",
                                color: s.color.includes("gradient") ? "#fff" : s.color,
                                WebkitBackgroundClip: s.color.includes("gradient") ? "text" : undefined,
                                WebkitTextFillColor: s.color.includes("gradient") ? "transparent" : undefined
                              }}
                              className={`text-sm font-extrabold tracking-wide ${s.color.includes("gradient") ? 'font-black' : ''}`}
                            >
                              ✍️ {s.name}
                            </span>
                          </div>

                          <div className="w-1/4 px-1 flex justify-center">
                            <input
                              type="text"
                              value={s.role || "Signature"}
                              onChange={e => handleSignatureChange(idx, "role", e.target.value)}
                              className="w-full max-w-[120px] bg-black/60 border border-white/10 rounded-lg p-1.5 text-center text-xs font-semibold text-amber-300 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="w-1/6 px-1 flex justify-center">
                            <input
                              type="number"
                              value={s.percent}
                              onChange={e => handleSignatureChange(idx, "percent", Number(e.target.value))}
                              className="w-16 bg-black/60 border border-white/10 rounded-lg p-1.5 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="w-1/4 px-1 flex justify-center items-center gap-1.5">
                            <input
                              type="text"
                              value={s.color}
                              onChange={e => handleSignatureChange(idx, "color", e.target.value)}
                              className="w-full max-w-[120px] bg-black/60 border border-white/10 rounded-lg p-1.5 text-left text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                            />
                            <div className="relative w-6 h-6 shrink-0 border border-white/10 rounded-md overflow-hidden bg-black flex items-center justify-center">
                              <input
                                type="color"
                                value={s.color.startsWith("#") ? s.color : "#ffffff"}
                                onChange={e => handleSignatureChange(idx, "color", e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="w-3.5 h-3.5 rounded border border-white/20" style={{ backgroundColor: s.color.startsWith("#") ? s.color : "#ffffff" }} />
                            </div>
                          </div>

                          <div className="w-1/12 flex justify-end">
                            {s.name !== "None" ? (
                              <button
                                onClick={() => handleDeleteSignature(s.name)}
                                className="text-rose-500 hover:text-rose-400 p-2 hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="w-8 h-8" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAllSignatures}
                    className="w-full py-4 bg-gray-900 hover:bg-black active:scale-95 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-sm select-none cursor-pointer"
                  >
                    Save All Signature Changes
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "forbidden_words" && (
              <motion.div
                key="forbidden_words"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Intro Card */}
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-3 text-left">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-white" />
                    Chat Censorship & Banned Words Filter
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Messages containing any of these words (case-insensitive) are automatically blocked in real-time. Use this interface to add or delete filtered words instantly.
                  </p>
                </div>

                {/* Add Banned Word Form */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row gap-3 items-end text-left">
                  <div className="flex-1 flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Add New Banned Word or Phrase
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. badword"
                      value={newForbiddenWord}
                      onChange={(e) => setNewForbiddenWord(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddForbiddenWord()}
                      className="bg-black border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/50 font-semibold"
                    />
                  </div>
                  <button
                    onClick={handleAddForbiddenWord}
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-zinc-200 text-black font-extrabold uppercase tracking-wider text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    Add Word
                  </button>
                </div>

                {/* Banned Words Grid with Search */}
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <List className="w-4 h-4 text-white" />
                      Active Banned Words ({forbiddenWords.length})
                    </h4>
                    
                    {/* Filter Search Input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search word..."
                        value={forbiddenSearchQuery}
                        onChange={(e) => setForbiddenSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-semibold"
                      />
                    </div>
                  </div>

                  {/* List of Words as tags */}
                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                    {forbiddenWords.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500 font-mono">
                        No banned words configured. Click above to add!
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                        {forbiddenWords
                          .filter((w) => w.toLowerCase().includes(forbiddenSearchQuery.toLowerCase()))
                          .map((word) => (
                            <div
                              key={word}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg hover:bg-rose-500/20 transition group select-none"
                            >
                              <span className="font-mono">{word}</span>
                              <button
                                onClick={() => handleDeleteForbiddenWord(word)}
                                className="text-rose-400 hover:text-rose-300 transition cursor-pointer rounded-full p-0.5 hover:bg-rose-500/30"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6 text-left"
              >
                {/* Stats Header Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#181922]/90 border border-zinc-500/30 p-5 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Active Complaints</span>
                      <h4 className="text-3xl font-black text-zinc-300 mt-1 drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        {reports.filter(r => r.status === 'active').length}
                      </h4>
                    </div>
                    <div className="p-3.5 bg-zinc-500/10 rounded-xl border border-zinc-500/20 text-zinc-300 shadow-[inset_0_0_12px_rgba(99,102,241,0.15)]">
                      <Flag className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                  <div className="bg-[#181922]/90 border border-rose-500/30 p-5 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(239,68,68,0.05)]">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono font-bold">Suspended Accounts</span>
                      <h4 className="text-3xl font-black text-rose-400 mt-1 drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                        {bannedUsers.length}
                      </h4>
                    </div>
                    <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 shadow-[inset_0_0_12px_rgba(239,68,68,0.15)]">
                      <Ban className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Main section: Two columns (Complaints, Bans list) */}
                <div className="grid grid-cols-1 grid-flow-row lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: Complaints list */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-zinc-300" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Community Complaint Inbox</h4>
                      </div>
                      <button onClick={fetchReports} className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 transition-all cursor-pointer">Refresh</button>
                    </div>

                    {reports.length === 0 ? (
                      <div className="bg-[#13141c]/60 border border-white/5 rounded-2xl p-12 text-center text-xs text-slate-500 font-mono flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-500/60 animate-bounce" />
                        <span>All clear! No active complaints. Thank you!</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                        {reports.map((rep) => (
                          <div key={rep.id} className={`p-4 rounded-2xl border flex flex-col gap-3.5 transition-all duration-300 ${rep.status === 'active' ? 'bg-[#12131c]/90 border-zinc-500/20 hover:border-zinc-500/40 shadow-[0_4px_25px_rgba(99,102,241,0.02)]' : 'bg-[#0f1118]/60 border-white/5 opacity-60'}`}>
                            
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col gap-1.5">
                                <span className="self-start text-[9px] font-black tracking-wider uppercase text-zinc-300 font-mono bg-zinc-500/10 px-2 py-0.5 rounded border border-zinc-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.1)]">
                                  {rep.reason}
                                </span>
                                <div className="text-xs font-extrabold text-slate-200 mt-1 flex flex-wrap items-center gap-1.5">
                                  Target: <span className="text-zinc-300 font-bold">@{rep.reportedUserName}</span> 
                                  <span className="text-[10px] text-slate-500 font-mono">({rep.reportedUserId})</span>
                                </div>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono font-semibold bg-white/5 px-2 py-1 rounded border border-white/5">{new Date(rep.reportedAt).toLocaleDateString()} {new Date(rep.reportedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>

                            {/* Message Context */}
                            <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-xl rounded-full"></div>
                              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block font-mono mb-1">Flagged Message:</span>
                              <p className="text-xs text-slate-300 leading-relaxed italic relative z-10">"{rep.messageText}"</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2.5 justify-between items-center border-t border-white/5 pt-3.5 mt-0.5">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewChatLogs(rep.chatId)}
                                  className="px-3 py-2 bg-zinc-600/10 hover:bg-zinc-600/20 border border-zinc-500/20 text-zinc-300 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                                  title="Check full chat history to review context"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Context Logs
                                </button>
                                
                                {rep.status === "active" && (
                                  <button
                                    onClick={() => handleResolveReport(rep.id, "resolved")}
                                    className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" /> Dismiss
                                  </button>
                                )}
                              </div>

                              {rep.status === "active" && (
                                <button
                                  onClick={() => {
                                    setBanReason(`Violation: ${rep.reason} (reported via complaint)`);
                                    setBanModalUser({
                                      userId: rep.reportedUserId,
                                      username: rep.reportedUserName,
                                      displayName: rep.reportedUserName
                                    });
                                  }}
                                  className="px-3 py-2 bg-zinc-600 hover:bg-zinc-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-zinc-600/10"
                                >
                                  <VolumeX className="w-3.5 h-3.5" /> Issue Mute
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Mutes list & manual mute form */}
                  <div className="lg:col-span-5 flex flex-col gap-5">
                    
                    {/* Manual Mute Creator */}
                    <div className="bg-[#12131c]/95 border border-zinc-500/20 p-5 rounded-2xl flex flex-col gap-4 shadow-[0_8px_30px_rgba(99,102,241,0.03)] relative">
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/[0.02] blur-2xl rounded-full"></div>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 relative z-10 border-b border-zinc-500/10 pb-2">
                        <VolumeX className="w-4 h-4 animate-pulse" /> Custom Mute Control
                      </h4>
                      
                      <div className="flex flex-col gap-3.5 mt-1 relative z-10">
                        {/* Target Fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">User ID (Optional)</label>
                            <input
                              type="number"
                              placeholder="e.g. 1024"
                              value={manualBanUserId}
                              onChange={(e) => setManualBanUserId(e.target.value)}
                              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Username</label>
                            <input
                              type="text"
                              placeholder="@username or name"
                              value={manualBanUsername}
                              onChange={(e) => setManualBanUsername(e.target.value)}
                              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                            />
                          </div>
                        </div>

                        {/* ID Explanation Panel */}
                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[10px] text-slate-400 leading-normal flex gap-2 items-start shadow-inner">
                          <Info className="w-4 h-4 text-rose-400/90 shrink-0 mt-0.5" />
                          <span>
                            <strong>Ban by Username:</strong> You can enter just their Discord or Roblox username! The system will automatically find their details from active sessions, trade listings, or chats.
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Reason for Mute</label>
                          <input
                            type="text"
                            placeholder="Violation reason (e.g. insults)..."
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Mute Duration</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsManualDurationOpen(!isManualDurationOpen)}
                              className="w-full bg-black/60 border border-white/10 hover:border-zinc-500/30 rounded-xl px-3 py-2.5 text-xs text-white text-left flex items-center justify-between transition-all cursor-pointer focus:border-zinc-500/50"
                            >
                              <span>
                                {durationOptions.find(o => o.value === banDuration)?.label || "Select duration..."}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isManualDurationOpen ? "rotate-180 text-zinc-300" : ""}`} />
                            </button>
                            <AnimatePresence>
                              {isManualDurationOpen && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setIsManualDurationOpen(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute left-0 right-0 mt-1.5 bg-[#12131a] border border-zinc-500/30 rounded-xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50"
                                  >
                                    {durationOptions.map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          setBanDuration(opt.value);
                                          setIsManualDurationOpen(false);
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 text-xs transition duration-200 cursor-pointer border-b border-white/5 last:border-b-0 ${
                                          banDuration === opt.value
                                            ? "bg-zinc-500/10 text-zinc-300 font-bold"
                                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Custom Time Selector Panel */}
                        {banDuration === "custom" && (
                          <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-rose-500/[0.03] border border-rose-500/25 rounded-xl animate-fadeIn">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black text-rose-400 uppercase tracking-wide">Time Value</label>
                              <input
                                type="number"
                                min={1}
                                value={customDurationValue}
                                onChange={(e) => setCustomDurationValue(e.target.value)}
                                className="bg-black/70 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black text-rose-400 uppercase tracking-wide">Time Unit</label>
                              <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 border border-rose-500/10 rounded-xl">
                                {[
                                  { value: "seconds", label: "sec" },
                                  { value: "minutes", label: "min" },
                                  { value: "hours", label: "hr" },
                                  { value: "days", label: "day" }
                                ].map((u) => (
                                  <button
                                    key={u.value}
                                    type="button"
                                    onClick={() => setCustomDurationUnit(u.value)}
                                    className={`py-1 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                                      customDurationUnit === u.value
                                        ? "bg-rose-500/25 border border-rose-500/30 text-rose-300"
                                        : "bg-transparent border border-transparent text-slate-400 hover:text-slate-200"
                                    }`}
                                  >
                                    {u.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 w-full mt-1.5">                          
                          <button
                            onClick={() => {
                              if (!manualBanUsername) {
                                showToast("Please provide at least a Username.", "error");
                                return;
                              }
                              handleBanUser(manualBanUserId ? Number(manualBanUserId) : 0, manualBanUsername, manualBanUsername, undefined, undefined, undefined, undefined, true);
                              setManualBanUserId("");
                              setManualBanUsername("");
                            }}
                            className="flex-1 py-2.5 px-1 bg-zinc-600 hover:bg-zinc-500 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-zinc-600/10 flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <VolumeX className="w-3.5 h-3.5" /> Mute
                          </button>
                          
                          <button
                            onClick={() => {
                              if (!manualBanUsername) {
                                showToast("Please provide at least a Username to unban.", "error");
                                return;
                              }
                              handleUnbanUser(manualBanUserId ? Number(manualBanUserId) : 0, manualBanUsername);
                              setManualBanUserId("");
                              setManualBanUsername("");
                            }}
                            className="flex-1 py-2.5 px-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Unban
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Muted Users list */}
                    <div className="flex flex-col gap-3 mt-1">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <VolumeX className="w-4 h-4 text-zinc-300" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Active Mutes ({bannedUsers.length})</h4>
                        </div>
                        <button onClick={fetchBannedUsers} className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 transition-all cursor-pointer">Refresh</button>
                      </div>

                      {bannedUsers.length === 0 ? (
                        <div className="bg-[#13141c]/40 border border-white/5 rounded-2xl p-8 text-center text-xs text-slate-500 font-mono">
                          No currently muted accounts.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                          {bannedUsers.map((b) => (
                            <div key={b.userId} className="bg-[#12131c]/90 border border-zinc-500/10 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                <div className="font-extrabold text-white flex items-center gap-1.5">
                                  <span className="text-zinc-300 font-bold">@{b.username}</span>
                                  <span className="text-[8px] bg-zinc-500/15 border border-zinc-500/20 text-zinc-300 px-1.5 py-0.5 rounded font-mono font-black uppercase">Muted</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  Reason: <span className="text-slate-300 font-medium">"{b.reason}"</span>
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span>Issued: {new Date(b.bannedAt).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                                  <span>•</span>
                                  <span className="text-zinc-300 font-bold">Ends: {b.expiresAt === 'permanent' ? 'Permanent' : new Date(b.expiresAt).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnbanUser(b.userId)}
                                className="px-3 py-2 bg-emerald-600/15 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white font-black text-[9px] uppercase tracking-wider rounded-xl shrink-0 cursor-pointer transition-all"
                                title="Revoke mute immediately"
                              >
                                Unmute
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Gorgeous Interactive Punishment Modal Overlay */}
                <AnimatePresence>
                  {banModalUser && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-[#12131a] border-2 border-rose-500/30 p-6 rounded-3xl max-w-md w-full flex flex-col gap-5 text-left shadow-[0_0_80px_rgba(239,68,68,0.25)] relative"
                      >
                        <button
                          onClick={() => setBanModalUser(null)}
                          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-zinc-500/20 pb-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 border border-zinc-500/30 flex items-center justify-center text-zinc-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                            <VolumeX className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider">Issue Account Mute</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Target: <span className="text-zinc-300 font-bold">@{banModalUser.username}</span> ({banModalUser.userId})</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          {/* Reason for Mute */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason for Mute</label>
                            <input
                              type="text"
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              placeholder="Type violation reason..."
                              className="w-full bg-black/50 border border-white/10 focus:border-zinc-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
                            />
                          </div>

                          {/* Duration Selection */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Suspension Duration</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: "5 Min", value: "5" },
                                { label: "1 Hour", value: "60" },
                                { label: "24 Hours", value: "1440" },
                                { label: "7 Days", value: "10080" },
                                { label: "Permanent", value: "permanent" },
                                { label: "Custom Time", value: "custom" }
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setBanDuration(opt.value)}
                                  className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition text-center cursor-pointer ${
                                    banDuration === opt.value
                                      ? "bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                      : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom duration fields */}
                          {banDuration === "custom" && (
                            <div className="grid grid-cols-2 gap-2.5 p-3 bg-rose-500/[0.03] border border-rose-500/20 rounded-2xl animate-fadeIn">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black text-rose-400 uppercase font-bold">Duration Value</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={customDurationValue}
                                  onChange={(e) => setCustomDurationValue(e.target.value)}
                                  className="bg-black/60 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black text-rose-400 uppercase font-bold">Time Unit</label>
                                <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 border border-rose-500/10 rounded-xl">
                                  {[
                                    { value: "seconds", label: "sec" },
                                    { value: "minutes", label: "min" },
                                    { value: "hours", label: "hr" },
                                    { value: "days", label: "day" }
                                  ].map((u) => (
                                    <button
                                      key={u.value}
                                      type="button"
                                      onClick={() => setCustomDurationUnit(u.value)}
                                      className={`py-1 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                                        customDurationUnit === u.value
                                          ? "bg-rose-500/25 border border-rose-500/30 text-rose-300"
                                          : "bg-transparent border border-transparent text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      {u.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2.5 mt-2">
                          <button
                            onClick={() => setBanModalUser(null)}
                            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleBanUser(banModalUser.userId, banModalUser.username, banModalUser.displayName, undefined, undefined, undefined, undefined, true)}
                            className="flex-1 py-3 bg-zinc-600 hover:bg-zinc-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-zinc-500/20"
                          >
                            Execute Mute
                          </button>
                          <button
                            onClick={() => handleBanUser(banModalUser.userId, banModalUser.username, banModalUser.displayName, undefined, undefined, undefined, undefined, false)}
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-rose-500/20"
                          >
                            Execute Suspension
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Review Chat History Logs Modal Inside Admin Tab */}
                <AnimatePresence>
                  {viewingChatLogsId && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-[#0e0f14] border border-[#2b2d35]/50 p-6 rounded-3xl max-w-xl w-full h-[80vh] flex flex-col gap-4 text-left shadow-[0_0_50px_rgba(99,102,241,0.2)]"
                      >
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-zinc-300" />
                            <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-wider font-sans">Review Chat History Logs</h4>
                              <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">Chat ID: {viewingChatLogsId}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setViewingChatLogsId(null); setActiveChatLogs([]); }}
                            className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Logs body */}
                        <div className="flex-1 overflow-y-auto bg-black/40 border border-[#2b2d35]/30 rounded-2xl p-4 flex flex-col gap-3 scrollbar-thin">
                          {activeChatLogs.length === 0 ? (
                            <div className="text-center py-10 text-xs text-slate-500 font-mono italic">
                              No messages found or chat has been cleared.
                            </div>
                          ) : (
                            activeChatLogs.map((msg, i) => (
                              <div key={i} className="flex flex-col gap-1 p-2 bg-white/[0.02] border border-white/[0.03] rounded-xl text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="font-extrabold text-zinc-300">@{msg.senderName} <span className="text-[9px] text-slate-500 font-mono">({msg.senderId})</span></span>
                                  <span className="text-[9px] text-slate-500 font-mono">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-200 mt-1 break-words select-all">"{msg.text}"</p>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex justify-end gap-2 shrink-0">
                          <button
                            onClick={() => { setViewingChatLogsId(null); setActiveChatLogs([]); }}
                            className="px-5 py-2.5 bg-[#2b2d35]/40 hover:bg-[#2b2d35]/60 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                          >
                            Close Logs
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Roadmap Tab Panel */}
            {activeTab === "roadmap" && (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Form to Add / Edit Roadmap Item */}
                <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        {editingRoadmapIndex !== null ? "Edit Roadmap Milestone" : "Add New Roadmap Milestone"}
                      </h4>
                    </div>
                    {editingRoadmapIndex !== null && (
                      <button
                        onClick={() => {
                          setEditingRoadmapIndex(null);
                          setRoadmapTitle("");
                          setRoadmapDate("");
                          setRoadmapDescription("");
                          setRoadmapImage("");
                          setRoadmapFeaturesText("");
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Title *</label>
                      <input
                        type="text"
                        value={roadmapTitle}
                        onChange={(e) => setRoadmapTitle(e.target.value)}
                        placeholder="e.g. Update 2.0 - Secret Realm"
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                      <select
                        value={roadmapStatus}
                        onChange={(e) => setRoadmapStatus(e.target.value as any)}
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Release Date / Label</label>
                      <input
                        type="text"
                        value={roadmapDate}
                        onChange={(e) => setRoadmapDate(e.target.value)}
                        placeholder="e.g. August 2026 or TBA"
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Icon</label>
                      <select
                        value={roadmapIcon}
                        onChange={(e) => setRoadmapIcon(e.target.value)}
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Rocket">🚀 Rocket</option>
                        <option value="Sparkles">✨ Sparkles</option>
                        <option value="Flame">🔥 Flame</option>
                        <option value="Wrench">🔧 Wrench</option>
                        <option value="Clock">⏰ Clock</option>
                        <option value="Star">⭐ Star</option>
                        <option value="CheckCircle2">✅ CheckCircle</option>
                        <option value="Map">🗺️ Map</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Card Preview Image URL (Optional)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={roadmapImage}
                          onChange={(e) => setRoadmapImage(e.target.value)}
                          placeholder="https://i.postimg.cc/..."
                          className="flex-1 bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        {roadmapImage && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0">
                            <img src={roadmapImage} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</label>
                    <textarea
                      value={roadmapDescription}
                      onChange={(e) => setRoadmapDescription(e.target.value)}
                      placeholder="Detailed description of what is coming in this milestone..."
                      rows={2}
                      className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Feature Highlights (One feature per line)</label>
                    <textarea
                      value={roadmapFeaturesText}
                      onChange={(e) => setRoadmapFeaturesText(e.target.value)}
                      placeholder="Alliance Tower Defense Major Update&#10;New Secret & Godly Units&#10;Trading Market Enhancements"
                      rows={3}
                      className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={handleAddOrUpdateRoadmapItem}
                      disabled={savingRoadmap}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      {editingRoadmapIndex !== null ? "Update Roadmap Item" : "Add to Roadmap"}
                    </button>
                  </div>
                </div>

                {/* List of Existing Roadmap Milestones */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <List className="w-4 h-4 text-indigo-400" />
                      Current Roadmap Items ({roadmapItems.length})
                    </h4>
                    <button
                      onClick={() => handleSaveRoadmap()}
                      disabled={savingRoadmap}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingRoadmap ? "Saving..." : "Save All Changes"}
                    </button>
                  </div>

                  {roadmapItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-mono border border-dashed border-white/10 rounded-2xl">
                      No roadmap milestones added yet. Create one above!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roadmapItems.map((item, idx) => (
                        <div key={item.id || idx} className="bg-white/[0.02] border border-white/10 hover:border-white/20 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition">
                          <div className="flex gap-3 items-center min-w-0 flex-1">
                            {item.image ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <Map className="w-5 h-5 text-indigo-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-sm font-bold text-white truncate">{item.title}</h5>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  item.status === "in-progress" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                                  item.status === "completed" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                                  "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                                }`}>
                                  {item.status}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                                  {item.date}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                            <button
                              onClick={() => handleMoveRoadmapItem(idx, "up")}
                              disabled={idx === 0}
                              className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 rounded-lg transition"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveRoadmapItem(idx, "down")}
                              disabled={idx === roadmapItems.length - 1}
                              className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 rounded-lg transition"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditRoadmapItem(idx)}
                              className="p-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition"
                              title="Edit Item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoadmapItem(idx)}
                              className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Countdown Tab Panel */}
            {activeTab === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Update Countdown Configuration</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Control target release date, banner image, title & teasers</p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveCountdown}
                      disabled={savingCountdown}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      <Save className="w-4 h-4" />
                      {savingCountdown ? "Saving..." : "Save Countdown Settings"}
                    </button>
                  </div>

                  {/* Enable Switch */}
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 p-3.5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">Enable Countdown Banner</span>
                      <span className="text-[10px] text-slate-400">Shows the live update timer box on the home page for all users</span>
                    </div>
                    <button
                      onClick={() => setCountdownConfig({ ...countdownConfig, enabled: !countdownConfig.enabled })}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                        countdownConfig.enabled
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                          : "bg-zinc-800 text-slate-400 hover:bg-zinc-700"
                      }`}
                    >
                      {countdownConfig.enabled ? "Active (On)" : "Disabled (Off)"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Update Title *</label>
                      <input
                        type="text"
                        value={countdownConfig.title || ""}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, title: e.target.value })}
                        placeholder="🔨 Crafts + Secret Units ✨ UPDATE"
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subtitle / Date Label</label>
                      <input
                        type="text"
                        value={countdownConfig.subtitle || ""}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, subtitle: e.target.value })}
                        placeholder="Target Release: Sun Aug 16, 2026, 18:00 (GMT+3)"
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Release Date & Time</label>
                      <input
                        type="text"
                        value={countdownConfig.targetDate || ""}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, targetDate: e.target.value })}
                        placeholder="2026-08-16T18:00:00+03:00"
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-500 font-mono">Format: YYYY-MM-DDTHH:mm:ss+03:00 or ISO date format</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Progress Start Date & Time</label>
                      <input
                        type="text"
                        value={countdownConfig.startDate || ""}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, startDate: e.target.value })}
                        placeholder="2026-08-01T18:00:00+03:00"
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-500 font-mono">Used to calculate deployment percentage bar</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Main Banner Image URL</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={countdownConfig.bannerImage || ""}
                        onChange={(e) => setCountdownConfig({ ...countdownConfig, bannerImage: e.target.value })}
                        placeholder="https://i.postimg.cc/44b4qFry/16-20260701171125.png"
                        className="flex-1 bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                      {countdownConfig.bannerImage && (
                        <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0">
                          <img src={countdownConfig.bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Update Description</label>
                    <textarea
                      value={countdownConfig.description || ""}
                      onChange={(e) => setCountdownConfig({ ...countdownConfig, description: e.target.value })}
                      placeholder="Hop into Alliance: TD and enjoy the new upcoming features & crafts!"
                      rows={2}
                      className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Update Log Tab Panel */}
            {activeTab === "updates_log" && (
              <motion.div
                key="updates_log"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Form to Create / Edit Update Log */}
                <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        {editingUpdateIndex !== null ? "Edit Update Log" : "Add New Update Log"}
                      </h4>
                    </div>
                    {editingUpdateIndex !== null && (
                      <button
                        onClick={() => {
                          setEditingUpdateIndex(null);
                          setUpdateTitle("");
                          setUpdateDate("");
                          setUpdateTag("MAJOR UPDATE");
                          setUpdateImage("");
                          setUpdateIconIsSun(false);
                          setUpdateFeaturesText("");
                        }}
                        className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Update Title *</label>
                      <input
                        type="text"
                        value={updateTitle}
                        onChange={(e) => setUpdateTitle(e.target.value)}
                        placeholder="e.g. Update 2.0 - Crafting & Trading System"
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Release Date Label</label>
                        <input
                          type="text"
                          value={updateDate}
                          onChange={(e) => setUpdateDate(e.target.value)}
                          placeholder="e.g. July 2026"
                          className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tag / Badge</label>
                        <input
                          type="text"
                          value={updateTag}
                          onChange={(e) => setUpdateTag(e.target.value)}
                          placeholder="e.g. MAJOR UPDATE"
                          className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold text-indigo-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cover Image URL</label>
                      <input
                        type="text"
                        value={updateImage}
                        onChange={(e) => setUpdateImage(e.target.value)}
                        placeholder="https://..."
                        className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      {updateImage && (
                        <div className="w-full h-24 rounded-xl overflow-hidden border border-white/10 mt-1.5 bg-black">
                          <img src={updateImage} alt="Cover Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Header Icon Type</label>
                      <button
                        type="button"
                        onClick={() => setUpdateIconIsSun(!updateIconIsSun)}
                        className={`px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          updateIconIsSun ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                        }`}
                      >
                        <span>Header Icon: {updateIconIsSun ? "Sun (☀️)" : "Sparkles (✨)"}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40">Toggle</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Features List (1 item per line)</label>
                      <span className="text-[10px] text-slate-500 font-mono">Format: icon | text | color</span>
                    </div>
                    <textarea
                      value={updateFeaturesText}
                      onChange={(e) => setUpdateFeaturesText(e.target.value)}
                      placeholder={`✨ | New Godly Unit Crafting recipes added | text-amber-400\n🔥 | Real-time Community Trading System | text-rose-400\n⚡ | Value Calculator algorithm optimizations | text-indigo-400`}
                      rows={4}
                      className="bg-black/50 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleAddOrUpdateLogItem}
                      disabled={savingUpdateLogs}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      {editingUpdateIndex !== null ? "Update Log Item" : "Add Log Item"}
                    </button>
                  </div>
                </div>

                {/* List of Existing Update Logs */}
                <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <List className="w-4 h-4 text-indigo-400" />
                      Published Update Logs ({updateLogs.length})
                    </h4>
                    {updateLogs.length > 0 && (
                      <button
                        onClick={() => handleSaveUpdateLogs()}
                        disabled={savingUpdateLogs}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingUpdateLogs ? "Saving..." : "Save Order"}
                      </button>
                    )}
                  </div>

                  {updateLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-mono">
                      No update logs created yet. Use the form above to publish your first log!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {updateLogs.map((log, idx) => (
                        <div
                          key={log.id}
                          className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/20 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
                              <img src={log.image} alt={log.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white truncate">{log.title}</span>
                                {log.tag && (
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600/30 border border-blue-500/40 text-blue-300">
                                    {log.tag}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {log.date} • {log.features?.length || 0} features listed
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            <button
                              onClick={() => handleMoveUpdateLogItem(idx, "up")}
                              disabled={idx === 0}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 rounded-lg transition"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveUpdateLogItem(idx, "down")}
                              disabled={idx === updateLogs.length - 1}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 rounded-lg transition"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditUpdateLogItem(idx)}
                              className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition"
                              title="Edit Log"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUpdateLogItem(idx)}
                              className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Confirmation Modal */}
        <AnimatePresence>
          {customConfirm && customConfirm.isOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-955 border border-blue-500/40 p-6 rounded-2xl max-w-sm w-full shadow-[0_0_30px_rgba(59,130,246,0.2)] text-center relative flex flex-col gap-4"
              >
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20 text-white">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">{customConfirm.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{customConfirm.message}</p>
                <div className="flex gap-2 justify-center mt-2">
                  <button
                    onClick={() => setCustomConfirm(null)}
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={customConfirm.onConfirm}
                    className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Unit Upgrades Modal */}
        <AnimatePresence>
          {editingUnitUpgrades && (
            <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b0c10] border border-blue-500/30 p-6 rounded-3xl max-w-2xl w-full shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col gap-4 max-h-[90vh] text-left"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={editingUnitUpgrades.img} alt="" className="w-10 h-10 object-cover rounded-xl border border-white/10 bg-black shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider font-sans">Edit Levels & Stats</h4>
                      <p className="text-[10px] text-white font-extrabold uppercase tracking-widest font-mono">{editingUnitUpgrades.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingUnitUpgrades(null)}
                    className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                    Upgrades Stream ({tempUpgradesList.length} Levels)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const basePlace = editingUnitUpgrades.placeCost || 1000;
                        setTempUpgradesList([
                          { lvl: 1, cost: "Place", dmg: 500, cd: 1, range: 20 },
                          { lvl: 2, cost: `$${Math.round(basePlace * 1.5)}`, dmg: 1000, cd: 0.8, range: 25 },
                          { lvl: 3, cost: `$${Math.round(basePlace * 3)}`, dmg: 2200, cd: 0.6, range: 30 },
                          { lvl: 4, cost: `$${Math.round(basePlace * 5)}`, dmg: 3800, cd: 0.5, range: 35 },
                          { lvl: 5, cost: `$${Math.round(basePlace * 8)}`, dmg: 5500, cd: 0.4, range: 45 }
                        ]);
                        showToast("Generated 5 standard levels based on Place Cost!", "info");
                      }}
                      className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer transition"
                    >
                      ⚡ Auto 5 Lvls
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLvl = tempUpgradesList.length + 1;
                        const prevLvl = tempUpgradesList[tempUpgradesList.length - 1];
                        const prevCost = prevLvl && prevLvl.cost !== "Place" ? parseInt(prevLvl.cost.replace(/[^0-9]/g, ""), 10) : 1000;
                        const nextCost = prevLvl ? (isNaN(prevCost) ? 1000 : Math.round(prevCost * 1.8)) : 1000;
                        setTempUpgradesList([
                          ...tempUpgradesList,
                          {
                            lvl: nextLvl,
                            cost: nextLvl === 1 ? "Place" : `$${nextCost}`,
                            dmg: prevLvl ? Math.round((prevLvl.dmg || 500) * 1.6) : 500,
                            cd: prevLvl ? Number(((prevLvl.cd || 1) * 0.9).toFixed(2)) : 1,
                            range: prevLvl ? Math.round((prevLvl.range || 20) * 1.2) : 20
                          }
                        ]);
                      }}
                      className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 border border-white/5 cursor-pointer transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Level
                    </button>
                  </div>
                </div>

                {/* Level editing form stream */}
                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1 shadow-inner">
                  <div className="grid grid-cols-12 gap-1 px-4 py-2.5 bg-black/60 text-[9px] font-black text-slate-500 uppercase tracking-widest select-none font-mono">
                    <span className="col-span-1 text-center">LVL</span>
                    <span className="col-span-3 text-center">UPGRADE COST</span>
                    <span className="col-span-3 text-center">DAMAGE (DMG)</span>
                    <span className="col-span-2 text-center">COOLDOWN</span>
                    <span className="col-span-2 text-center">RADIUS (RANGE)</span>
                    <span className="col-span-1 text-right"></span>
                  </div>

                  <div className="divide-y divide-white/5 overflow-y-auto scrollbar-thin max-h-[45vh]">
                    {tempUpgradesList.map((upgrade, index) => (
                      <div key={index} className="grid grid-cols-12 gap-1 px-4 py-2 items-center hover:bg-white/[0.01]">
                        <div className="col-span-1 text-center text-xs font-black font-mono text-white">
                          {upgrade.lvl}
                        </div>
                        <div className="col-span-3 px-1">
                          <input
                            type="text"
                            value={upgrade.cost}
                            onChange={e => {
                              const updated = [...tempUpgradesList];
                              updated[index].cost = e.target.value;
                              setTempUpgradesList(updated);
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-center text-xs font-semibold text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div className="col-span-3 px-1">
                          <input
                            type="number"
                            value={upgrade.dmg || ""}
                            onChange={e => {
                              const updated = [...tempUpgradesList];
                              updated[index].dmg = Number(e.target.value);
                              setTempUpgradesList(updated);
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-center text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                          />
                        </div>
                        <div className="col-span-2 px-1">
                          <input
                            type="number"
                            step="0.01"
                            value={upgrade.cd || ""}
                            onChange={e => {
                              const updated = [...tempUpgradesList];
                              updated[index].cd = Number(e.target.value);
                              setTempUpgradesList(updated);
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-center text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div className="col-span-2 px-1">
                          <input
                            type="number"
                            value={upgrade.range || ""}
                            onChange={e => {
                              const updated = [...tempUpgradesList];
                              updated[index].range = Number(e.target.value);
                              setTempUpgradesList(updated);
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-center text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          {tempUpgradesList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = tempUpgradesList.filter((_, idx) => idx !== index).map((u, i) => ({
                                  ...u,
                                  lvl: i + 1,
                                  cost: i === 0 ? "Place" : u.cost === "Place" ? "$1000" : u.cost
                                }));
                                setTempUpgradesList(updated);
                              }}
                              className="text-rose-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded cursor-pointer transition flex items-center justify-center mx-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => setEditingUnitUpgrades(null)}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const updatedUnits = [...units];
                      const idx = updatedUnits.findIndex(u => u.name === editingUnitUpgrades.name);
                      if (idx !== -1) {
                        updatedUnits[idx] = {
                          ...updatedUnits[idx],
                          upgrades: tempUpgradesList
                        };
                        saveUnitsToServer(updatedUnits).then(success => {
                          if (success) {
                            setUnits(updatedUnits);
                            showToast(`Updated levels for ${editingUnitUpgrades.name}!`, "success");
                            setEditingUnitUpgrades(null);
                          }
                        });
                      }
                    }}
                    className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-none"
                  >
                    Save Upgrades
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Notifications */}
        <div className="fixed bottom-4 right-4 z-[120] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold uppercase tracking-wider min-w-[200px] flex items-center gap-2 pointer-events-auto ${
                  toast.type === "success" 
                    ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10"
                    : toast.type === "error"
                    ? "bg-rose-950/90 border-rose-500/30 text-rose-400 shadow-rose-500/10"
                    : "bg-zinc-950/90 border-zinc-500/30 text-zinc-300 shadow-zinc-500/10"
                }`}
              >
                <span className="flex-1">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
