import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Yl as defaultUnits, Hl as defaultSignatures } from "./src/data";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let firestoreDb: any = null;

try {
  let serviceAccount: any = null;
  const saFilePath = path.join(process.cwd(), "firebase-service-account.json");
  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (saEnv) {
    try {
      serviceAccount = typeof saEnv === "string" ? JSON.parse(saEnv) : saEnv;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", e);
    }
  } else if (fs.existsSync(saFilePath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(saFilePath, "utf-8"));
    } catch (e) {
      console.error("Failed to parse firebase-service-account.json file:", e);
    }
  }

  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  const hasConfig = fs.existsSync(firebaseConfigPath);

  if (serviceAccount) {
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    firestoreDb = getFirestore(app);
    console.log("Firebase Admin initialized successfully using Service Account key from environment.");
  } else if (hasConfig) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const isGoogleEnvironment = !!(
      process.env.K_SERVICE ||
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GAE_INSTANCE
    );

    if (isGoogleEnvironment) {
      const app = initializeApp({
        projectId: firebaseConfig.projectId
      });
      const dbId = firebaseConfig.firestoreDatabaseId;
      firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
      console.log("Firebase Admin Firestore initialized with ADC for project:", firebaseConfig.projectId);
    } else {
      console.warn("Notice: Running outside Google Cloud (e.g. Render) without FIREBASE_SERVICE_ACCOUNT. Using local database storage.");
    }
  }
} catch (err) {
  console.error("Failed to initialize firebase-admin:", err);
  firestoreDb = null;
}

const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DATA_DIR 
  ? path.join(process.env.DATA_DIR, "trades_db.json") 
  : (process.env.DB_FILE_PATH || path.join(process.cwd(), "trades_db.json"));

interface RobloxUser {
  email?: string;
  id: number;
  name: string;
  displayName: string;
  avatar?: string;
  isDiscord?: boolean;
  discordId?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

interface CounterOffer {
  id: string;
  userId: number;
  displayName: string;
  username?: string;
  avatar: string;
  discordId?: string;
  offerText: string; // simpler, just let them write what they offer!
  createdAt: string;
}

interface Trade {
  id: string;
  userId: number;
  username: string;
  displayName: string;
  avatar: string;
  yourOffer: any[];
  yourGems: number;
  theirOffer: any[];
  theirGems: number;
  createdAt: string;
  isDiscord?: boolean;
  isStaff?: boolean;
  discordId?: string;
  robloxId?: number;
  robloxUsername?: string;
  robloxDisplayName?: string;
  robloxAvatar?: string;
  counterOffers?: CounterOffer[];
}

// In-memory sessions & verification codes
const sessions: Record<string, RobloxUser> = {};

function checkIsAdmin(user: any) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return false;
}

function resolveSession(sessionToken: string | undefined): any {
  if (!sessionToken) return null;
  const adminPassword = process.env.ADMIN_PASSWORD || "aK9#mP2$vL8!qZ5@wN3&rY7*bT1^uJ4%xV6#Qm9$";

  if (sessionToken === adminPassword) {
    const bypassToken = "session_bypass_auto";
    if (activeAdminSessions[bypassToken]?.isKicked) {
      return {
        id: 999999999,
        name: "Master Admin",
        displayName: "Master Super Admin (Owner)",
        avatar: "https://img.icons8.com/color/48/shield.png",
        isAdmin: false,
        isSuperAdmin: false,
      };
    }
    sessions[bypassToken] = {
      id: 999999999,
      name: "Master Admin",
      displayName: "Master Super Admin (Owner)",
      avatar: "https://img.icons8.com/color/48/shield.png",
      isAdmin: true,
      isSuperAdmin: true,
    };
    if (!activeAdminSessions[bypassToken]) {
      activeAdminSessions[bypassToken] = {
        sessionToken: bypassToken,
        ip: "127.0.0.1",
        userAgent: "Master Password Auto Session",
        isSuperAdmin: true,
        loginTime: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        isKicked: false,
      };
    }
    return sessions[bypassToken];
  }

  const userSess = sessions[sessionToken];
  if (!userSess) return null;

  if (activeAdminSessions[sessionToken]?.isKicked) {
    // Strip admin privileges so they are locked out of admin panel, but keep session valid for regular use
    return {
      ...userSess,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }

  return userSess;
}

function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function findUserByUsername(username: string): RobloxUser | null {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  
  for (const token in sessions) {
    const u = sessions[token];
    if (u && u.name && u.name.toLowerCase() === cleanUsername) {
      return u;
    }
  }

  for (const token in sessions) {
    const u = sessions[token];
    if (u && u.displayName && u.displayName.toLowerCase() === cleanUsername) {
      return u;
    }
  }

  for (const t of activeTrades) {
    if (t.username && t.username.toLowerCase() === cleanUsername) {
      return {
        id: t.userId || t.robloxId || 0,
        name: t.username,
        displayName: t.displayName || t.username,
        avatar: t.avatar,
        isDiscord: t.isDiscord,
        discordId: t.discordId
      };
    }
    if (t.robloxUsername && t.robloxUsername.toLowerCase() === cleanUsername) {
      return {
        id: t.robloxId || t.userId || 0,
        name: t.robloxUsername,
        displayName: t.robloxDisplayName || t.robloxUsername,
        avatar: t.robloxAvatar,
        isDiscord: false
      };
    }
  }

  for (const c of activeChats) {
    if (c.userA && c.userA.name && c.userA.name.toLowerCase() === cleanUsername) {
      return c.userA;
    }
    if (c.userB && c.userB.name && c.userB.name.toLowerCase() === cleanUsername) {
      return c.userB;
    }
  }

  for (const r of activeReports) {
    if (r.reportedUserName && r.reportedUserName.toLowerCase() === cleanUsername) {
      return {
        id: Number(r.reportedUserId),
        name: r.reportedUserName,
        displayName: r.reportedUserName
      };
    }
    if (r.reporterName && r.reporterName.toLowerCase() === cleanUsername) {
      return {
        id: Number(r.reporterId),
        name: r.reporterName,
        displayName: r.reporterDisplayName || r.reporterName
      };
    }
  }

  return null;
}

function syncUserAcrossDatabase(user: any) {
  if (!user) return;
  const targetDiscordId = user.discordId;
  const targetUserId = String(user.id);
  const username = user.name || user.username;
  const displayName = user.displayName || user.name;
  const avatarUrl = user.avatar;

  if (!username && !displayName && !avatarUrl) return;

  let changed = false;

  for (const trade of activeTrades) {
    if ((targetDiscordId && trade.discordId === targetDiscordId) || String(trade.userId) === targetUserId) {
      if (displayName && trade.displayName !== displayName) { trade.displayName = displayName; changed = true; }
      if (username && trade.username !== username) { trade.username = username; changed = true; }
      if (avatarUrl && trade.avatar !== avatarUrl) { trade.avatar = avatarUrl; changed = true; }
    }
    if (trade.counterOffers && Array.isArray(trade.counterOffers)) {
      for (const counter of trade.counterOffers) {
        if ((targetDiscordId && counter.discordId === targetDiscordId) || String(counter.userId) === targetUserId) {
          if (displayName && counter.displayName !== displayName) { counter.displayName = displayName; changed = true; }
          if (username && counter.username !== username) { counter.username = username; changed = true; }
          if (avatarUrl && counter.avatar !== avatarUrl) { counter.avatar = avatarUrl; changed = true; }
        }
      }
    }
  }

  for (const chat of activeChats) {
    if (chat.userA && ((targetDiscordId && chat.userA.discordId === targetDiscordId) || String(chat.userA.id) === targetUserId)) {
      if (displayName && chat.userA.displayName !== displayName) { chat.userA.displayName = displayName; changed = true; }
      if (username && chat.userA.name !== username) { chat.userA.name = username; changed = true; }
      if (avatarUrl && chat.userA.avatar !== avatarUrl) { chat.userA.avatar = avatarUrl; changed = true; }
    }
    if (chat.userB && ((targetDiscordId && chat.userB.discordId === targetDiscordId) || String(chat.userB.id) === targetUserId)) {
      if (displayName && chat.userB.displayName !== displayName) { chat.userB.displayName = displayName; changed = true; }
      if (username && chat.userB.name !== username) { chat.userB.name = username; changed = true; }
      if (avatarUrl && chat.userB.avatar !== avatarUrl) { chat.userB.avatar = avatarUrl; changed = true; }
    }
  }

  if (changed) {
    persistState();
  }
}

function isUserMuted(userId: number, username?: string, discordId?: string): { muted: boolean; expiresAt?: string; reason?: string } {
  const now = new Date();
  
  const ban = bannedUsers.find(b => {
    if (userId && String(b.userId) === String(userId)) return true;
    if (username && b.username && b.username.toLowerCase() === username.toLowerCase()) return true;
    if (discordId && b.discordId && String(b.discordId) === String(discordId)) return true;
    return false;
  });

  if (!ban) return { muted: false };

  if (ban.expiresAt !== "permanent" && new Date(ban.expiresAt) <= now) {
    const idx = bannedUsers.findIndex(b => b === ban);
    if (idx !== -1) {
      bannedUsers.splice(idx, 1);
      persistState();
    }
    return { muted: false };
  }

  return { muted: true, expiresAt: ban.expiresAt, reason: ban.reason };
}
const pendingVerifications: Record<string, { username: string; code: string; createdAt: number }> = {};

// Helper to load/save JSON database
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file:", err);
  }
  return { trades: [], sessions: {} };
}

function saveDb(data: any) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// Initial DB load
const dbState = loadDb();
const activeTrades: Trade[] = dbState.trades || [];
const activeChats: any[] = dbState.chats || [];
const activeReports: any[] = dbState.reports || [];
activeReports.forEach(r => {
  if (r.status === "pending") {
    r.status = "active";
  }
});
const bannedUsers: any[] = dbState.bannedUsers || [];
Object.assign(sessions, dbState.sessions || {});
const adminLoginLogs: any[] = dbState.adminLoginLogs || [];
// Clear existing notification logs as requested by user
adminLoginLogs.length = 0;
const activeAdminSessions: Record<string, any> = dbState.activeAdminSessions || {};
const adminAuditLogs: any[] = dbState.adminAuditLogs || [];

function isVsnnnnnUser(sessionToken: string | undefined, user: any): boolean {
  if (!sessionToken && !user) return false;
  const sess = sessionToken ? activeAdminSessions[sessionToken] : null;
  const tag1 = (user?.discordTag || "").replace(/^@/, "").trim().toLowerCase();
  const tag2 = (user?.name || "").replace(/^@/, "").trim().toLowerCase();
  const tag3 = (sess?.discordTag || "").replace(/^@/, "").trim().toLowerCase();
  const tag4 = (sess?.adminName || "").replace(/^@/, "").trim().toLowerCase();
  const tag5 = (sess?.robloxName || "").replace(/^@/, "").trim().toLowerCase();

  const isMasterPass = sessionToken === (process.env.ADMIN_PASSWORD || "aK9#mP2$vL8!qZ5@wN3&rY7*bT1^uJ4%xV6#Qm9$") || sessionToken === "session_bypass_auto";

  return isMasterPass || tag1 === "vsnnnnn" || tag2 === "vsnnnnn" || tag3 === "vsnnnnn" || tag4 === "vsnnnnn" || tag5 === "vsnnnnn";
}

function logAdminAction(adminName: string, action: string, details: string) {
  const entry = {
    id: "audit_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    adminName: adminName || "Admin",
    action,
    details
  };
  adminAuditLogs.unshift(entry);
  if (adminAuditLogs.length > 200) adminAuditLogs.pop();
  persistState();
}
let maintenanceModeActive = false;
let globalMusicUrl = dbState.globalMusicUrl || "";
let globalClickSoundUrl = dbState.globalClickSoundUrl || "";
const demoUnitNames = new Set([
  "Chef Cameraman", "Community Cameraman", "Upgraded Fire King",
  "Upgraded Titan Speakerman", "Secret Agent", "Watchman of Darkness",
  "Demon Plunger", "G-Toilet 5.0", "Holiday Blizzard"
]);

function cleanAndSyncUnits() {
  if (!dbState.units || !Array.isArray(dbState.units) || dbState.units.length === 0) {
    dbState.units = [...defaultUnits];
  } else {
    dbState.units = dbState.units.filter((u: any) => u && u.name && !demoUnitNames.has(u.name));
    defaultUnits.forEach(defUnit => {
      const idx = dbState.units.findIndex((u: any) => u.name === defUnit.name);
      if (idx === -1) {
        dbState.units.push(defUnit);
      } else {
        // Preserve user edited values (gems, stability, demand, upgrades), only backfill missing metadata
        if (defUnit.crateDrops && (!dbState.units[idx].crateDrops || dbState.units[idx].crateDrops.length === 0)) {
          dbState.units[idx].crateDrops = defUnit.crateDrops;
        }
        if (!dbState.units[idx].img) {
          dbState.units[idx].img = defUnit.img;
        }
        if (!dbState.units[idx].obtain) {
          dbState.units[idx].obtain = defUnit.obtain;
        }
        if (!dbState.units[idx].rarity) {
          dbState.units[idx].rarity = defUnit.rarity;
        }
      }
    });
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

  dbState.units.sort((a: any, b: any) => {
    const rA = getRarityIndex(a.rarity);
    const rB = getRarityIndex(b.rarity);
    if (rA !== rB) return rA - rB;
    return (Number(a.gems) || 0) - (Number(b.gems) || 0);
  });
}

function cleanAndSyncSignatures() {
  const map = new Map<string, any>();
  defaultSignatures.forEach(s => map.set(s.name.toLowerCase(), { ...s }));
  if (Array.isArray(dbState.signatures)) {
    dbState.signatures.forEach((s: any) => {
      if (s && s.name) {
        const key = s.name.toLowerCase();
        if (map.has(key)) {
          const def = map.get(key);
          map.set(key, { ...def, ...s });
        } else {
          map.set(key, s);
        }
      }
    });
  }
  dbState.signatures = Array.from(map.values());
}

cleanAndSyncUnits();
cleanAndSyncSignatures();

const defaultRoadmap = [
  {
    id: "1",
    title: "Unknown ???",
    status: "planned",
    date: "TBA",
    description: "Upcoming game update for Alliance Tower Defense! Stay tuned for official announcements.",
    icon: "Rocket",
    image: "https://i.postimg.cc/PfcKG2YT/16-20260701171102.png",
    features: [
      "Alliance Tower Defense Major Update",
      "New Secret & Godly Units"
    ]
  }
];

const defaultCountdown = {
  enabled: true,
  title: "✨ Mythical + ❓ ❓",
  subtitle: "Target Release: Aug 20, 2026, 08:01 (GMT-7)",
  targetDate: "2026-08-20T08:01:11-07:00",
  startDate: "2026-08-13T10:33:21-07:00",
  description: "A mysterious new Mythical unit is on the horizon! Prepare your forces.",
  bannerImage: "",
  teaserImages: []
};

const defaultUpdateLogs = [
  {
    id: "update-party-event",
    title: "Party Event Update 🎉",
    date: "August 2026",
    tag: "EVENT UPDATE",
    image: "https://i.postimg.cc/44b4qFry/16-20260701171125.png",
    iconIsSun: false,
    features: [
      { icon: "⚔️", color: "text-amber-400", text: "3 New Units" },
      { icon: "🎉", color: "text-rose-400", text: "Piñata Event" },
      { icon: "✨", color: "text-indigo-400", text: "Party Crate" },
      { icon: "📘", color: "text-emerald-400", text: "Global Quests" },
      { icon: "🔴", color: "text-rose-500", text: "Splash" },
      { icon: "🔊", color: "text-sky-400", text: "Music Lobby" },
      { icon: "🎵", color: "text-violet-400", text: "More Sounds" },
      { icon: "🐞", color: "text-slate-400", text: "Bug Fix" },
      { icon: "⭐", color: "text-yellow-400", text: "Golden Bat! (Exclusive)" },
      { icon: "🔑", color: "text-blue-400", text: "Code: Party" }
    ]
  }
];

if (!dbState.roadmap || !Array.isArray(dbState.roadmap)) {
  dbState.roadmap = [...defaultRoadmap];
}
if (!dbState.countdown || typeof dbState.countdown !== "object") {
  dbState.countdown = { ...defaultCountdown };
}
if (!dbState.updateLogs || !Array.isArray(dbState.updateLogs)) {
  dbState.updateLogs = [...defaultUpdateLogs];
}

let forbiddenWordsList: string[] = dbState.forbiddenWords || [];
const defaultForbidden = [
  "nigger", "nigga", "faggot", "fag", "retard", "whore", "slut", "kys", "bitch",
  "хуй", "пизд", "ебл", "шлюх", "пидор", "даун", "бляд", "сука", "чмо", "гнйд", "уеб",
  "⑥⑦", "вагина", "дрочить", "дрочка", "ебали", "ебать", "ебля", "залупа", "лень", 
  "ниггер", "нигер", "пизда", "пиздой", "писюн", "подрочил", "порно", "пизду", 
  "сикс севен", "трахать", "член", "dick", "garticphone.com", "len", "n1ga", "n1ger", 
  "n1gga", "n1gger", "nga", "nger", "ngga", "ngger", "nggga", "nggger rape", 
  "ngggggggggggeeeeeerrr", "nggggggggggggggaaaaaaaaaa", "niga", "niger", "niggggggggggeeeer", 
  "niggggggggggaaaa", "nlga", "nlger", "nlgga", "nlgger", "p0rn", "p0rno", "porn", 
  "porno", "pussy", "six seven", "free nitro", "51", "-51", "brenton", "1488", 
  "nigg.", "nig", "1489", "1487"
];

// Ensure all default forbidden words are loaded and registered (except "67")
defaultForbidden.forEach(word => {
  const cleanWord = word.trim().toLowerCase();
  if (cleanWord !== "67" && !forbiddenWordsList.includes(cleanWord)) {
    forbiddenWordsList.push(cleanWord);
  }
});

// Explicitly filter out "67" if present in loaded database state
forbiddenWordsList = forbiddenWordsList.filter(w => w !== "67");

// Persist seeded words back to database file
persistState();

let isFirestoreLoaded = false;

async function saveDbToFirestore() {
  if (!firestoreDb || !isFirestoreLoaded) {
    return;
  }
  try {
    const appStateCol = firestoreDb.collection("app_state");
    await Promise.all([
      appStateCol.doc("config").set({
        maintenanceModeActive,
        globalMusicUrl,
        globalClickSoundUrl,
        forbiddenWords: forbiddenWordsList
      }),
      appStateCol.doc("units").set({
        units: dbState.units
      }),
      appStateCol.doc("signatures").set({
        signatures: dbState.signatures
      }),
      appStateCol.doc("trades").set({
        trades: activeTrades
      }),
      appStateCol.doc("chats").set({
        chats: activeChats
      }),
      appStateCol.doc("sessions").set({
        sessions: sessions
      }),
      appStateCol.doc("reports").set({
        reports: activeReports
      }),
      appStateCol.doc("bannedUsers").set({
        bannedUsers: bannedUsers
      }),
      appStateCol.doc("roadmap").set({
        roadmap: dbState.roadmap
      }),
      appStateCol.doc("countdown").set({
        countdown: dbState.countdown
      }),
      appStateCol.doc("updateLogs").set({
        updateLogs: dbState.updateLogs
      }),
      appStateCol.doc("adminSecurity").set({
        adminLoginLogs,
        activeAdminSessions,
        adminAuditLogs
      })
    ]);
    console.log("Successfully synced database with Cloud Firestore.");
  } catch (err) {
    console.error("Error saving database to Firestore:", err);
  }
}

async function loadDbFromFirestore() {
  if (!firestoreDb) {
    // If Firebase is not configured or fails, we fall back to local JSON
    isFirestoreLoaded = true;
    return;
  }
  console.log("Loading database from Cloud Firestore...");
  try {
    const appStateCol = firestoreDb.collection("app_state");
    const docsToFetch = ["config", "units", "signatures", "trades", "chats", "sessions", "reports", "bannedUsers", "roadmap", "countdown", "updateLogs", "adminSecurity"];
    
    const results = await Promise.all(
      docsToFetch.map(async (docName) => {
        const snap = await appStateCol.doc(docName).get();
        return { name: docName, exists: snap.exists, data: snap.exists ? snap.data() : null };
      })
    );

    const dataMap: Record<string, any> = {};
    results.forEach(res => {
      if (res.exists) {
        dataMap[res.name] = res.data;
      }
    });

    if (dataMap.config) {
      maintenanceModeActive = dataMap.config.maintenanceModeActive ?? maintenanceModeActive;
      globalMusicUrl = dataMap.config.globalMusicUrl ?? globalMusicUrl;
      globalClickSoundUrl = dataMap.config.globalClickSoundUrl ?? globalClickSoundUrl;
      if (Array.isArray(dataMap.config.forbiddenWords)) {
        forbiddenWordsList = dataMap.config.forbiddenWords;
      }
    }
    if (dataMap.units && Array.isArray(dataMap.units.units)) {
      dbState.units = dataMap.units.units;
      cleanAndSyncUnits();
    }
    if (dataMap.signatures && Array.isArray(dataMap.signatures.signatures) && dataMap.signatures.signatures.length > 0) {
      dbState.signatures = dataMap.signatures.signatures;
      cleanAndSyncSignatures();
    } else {
      dbState.signatures = [...defaultSignatures];
    }
    if (dataMap.trades && Array.isArray(dataMap.trades.trades)) {
      activeTrades.length = 0;
      activeTrades.push(...dataMap.trades.trades);
    }
    if (dataMap.chats && Array.isArray(dataMap.chats.chats)) {
      activeChats.length = 0;
      activeChats.push(...dataMap.chats.chats);
    }
    if (dataMap.sessions && dataMap.sessions.sessions) {
      for (const k in sessions) {
        delete sessions[k];
      }
      Object.assign(sessions, dataMap.sessions.sessions);
    }
    if (dataMap.reports && Array.isArray(dataMap.reports.reports)) {
      activeReports.length = 0;
      activeReports.push(...dataMap.reports.reports);
    }
    if (dataMap.bannedUsers && Array.isArray(dataMap.bannedUsers.bannedUsers)) {
      bannedUsers.length = 0;
      bannedUsers.push(...dataMap.bannedUsers.bannedUsers);
    }
    if (dataMap.roadmap && Array.isArray(dataMap.roadmap.roadmap)) {
      dbState.roadmap = dataMap.roadmap.roadmap;
    }
    if (dataMap.countdown && typeof dataMap.countdown.countdown === "object") {
      dbState.countdown = dataMap.countdown.countdown;
    }
    if (dataMap.updateLogs && Array.isArray(dataMap.updateLogs.updateLogs)) {
      dbState.updateLogs = dataMap.updateLogs.updateLogs;
    }
    if (dataMap.adminSecurity) {
      if (Array.isArray(dataMap.adminSecurity.adminLoginLogs)) {
        adminLoginLogs.length = 0;
        adminLoginLogs.push(...dataMap.adminSecurity.adminLoginLogs);
      }
      if (dataMap.adminSecurity.activeAdminSessions && typeof dataMap.adminSecurity.activeAdminSessions === "object") {
        Object.assign(activeAdminSessions, dataMap.adminSecurity.activeAdminSessions);
      }
      if (Array.isArray(dataMap.adminSecurity.adminAuditLogs)) {
        adminAuditLogs.length = 0;
        adminAuditLogs.push(...dataMap.adminSecurity.adminAuditLogs);
      }
    }
    
    isFirestoreLoaded = true;
    console.log("Successfully loaded database from Cloud Firestore.");
    persistState();
  } catch (err: any) {
    console.error("Error loading database from Firestore (falling back to local JSON):", err?.message || err);
    // In case of Firestore load failure, disable Firestore and allow local writes as fallback
    firestoreDb = null;
    isFirestoreLoaded = true;
  }
}

function persistState() {
  saveDb({
    trades: activeTrades,
    sessions,
    maintenanceModeActive,
    chats: activeChats,
    globalMusicUrl,
    globalClickSoundUrl,
    units: dbState.units,
    signatures: dbState.signatures,
    forbiddenWords: forbiddenWordsList,
    reports: activeReports,
    bannedUsers: bannedUsers,
    roadmap: dbState.roadmap,
    countdown: dbState.countdown,
    updateLogs: dbState.updateLogs,
    adminAuditLogs
  });

  saveDbToFirestore().catch(err => console.error("Firestore sync error:", err));
}

export const app = express();

export const initPromise = (async () => {
  await loadDbFromFirestore();

  // Self-healing / Automatic update for user requested "Update Log" and "Countdown"
  dbState.updateLogs = [...defaultUpdateLogs];
  dbState.countdown = { ...defaultCountdown };
  let stateUpdated = true;

  persistState();

  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50mb" }));

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Maintenance mode endpoints
  app.get("/api/maintenance/status", (req, res) => {
    res.json({ active: maintenanceModeActive });
  });

  app.post("/api/maintenance/toggle", (req, res) => {
    const { password, active, userSessionToken } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "aK9#mP2$vL8!qZ5@wN3&rY7*bT1^uJ4%xV6#Qm9$";
    if (password !== adminPassword) {
      return res.status(403).json({ error: "Invalid admin password" });
    }

    const userToken = userSessionToken || req.headers.authorization;
    const existingTradeUser = resolveSession(userToken);

    if (!existingTradeUser || !existingTradeUser.discordId) {
      return res.status(401).json({
        error: "Discord authorization required! You must sign in with your Discord account first to access the Admin Panel."
      });
    }

    const clientIp = String(req.headers["x-forwarded-for"] || req.ip || "127.0.0.1").split(",")[0].trim();
    const userAgent = String(req.headers["user-agent"] || "Unknown Device");
    const isSuper = (password === adminPassword);

    const discordTag = `@${existingTradeUser.name || "discord_user"}`;
    const robloxName = existingTradeUser.displayName || existingTradeUser.name || "Admin";
    const adminDisplay = existingTradeUser.displayName || existingTradeUser.name || "Admin";

    maintenanceModeActive = !!active;

    const sessionToken = `session_admin_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;

    const loggedUser = {
      id: existingTradeUser.id || 999999999,
      name: existingTradeUser.name || adminDisplay,
      displayName: existingTradeUser.displayName || adminDisplay,
      avatar: existingTradeUser.avatar || "https://img.icons8.com/color/48/shield.png",
      discordId: existingTradeUser.discordId,
      discordTag: discordTag,
      isAdmin: true,
      isSuperAdmin: isSuper,
    };
    sessions[sessionToken] = loggedUser;

    activeAdminSessions[sessionToken] = {
      sessionToken,
      adminName: adminDisplay,
      discordTag: discordTag,
      robloxName: robloxName,
      discordId: existingTradeUser.discordId,
      userAgent,
      isSuperAdmin: isSuper,
      loginTime: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isKicked: false,
    };

    const userDisplayLabel = `@${existingTradeUser.name} (${existingTradeUser.displayName || adminDisplay})`;

    const logEntry = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      adminName: adminDisplay,
      discordTag: discordTag,
      userAgent,
      isSuperAdmin: isSuper,
      sessionToken,
      unread: true,
      text: `🚨 Admin Login Alert: User ${userDisplayLabel} logged into Admin Panel with verified Discord`
    };
    adminLoginLogs.unshift(logEntry);
    if (adminLoginLogs.length > 100) adminLoginLogs.pop();

    logAdminAction(adminDisplay, "Admin Login", `Logged into panel with Discord as ${userDisplayLabel}`);

    persistState();
    res.json({ success: true, active: maintenanceModeActive, sessionToken, isSuperAdmin: isSuper, adminName: adminDisplay, discordTag, user: loggedUser });
  });

  app.post("/api/admin/logout", (req, res) => {
    const sessionToken = req.headers.authorization || req.body?.sessionToken;
    if (sessionToken) {
      if (activeAdminSessions[sessionToken]) {
        delete activeAdminSessions[sessionToken];
      }
      if (sessions[sessionToken]) {
        delete sessions[sessionToken];
      }
      persistState();
    }
    res.json({ success: true });
  });

  // --- Admin Security & Active Sessions Endpoints ---
  app.get("/api/admin/sessions", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);

    if (!sessionToken || !user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized / Session Revoked", kicked: true });
    }

    if (activeAdminSessions[sessionToken]) {
      activeAdminSessions[sessionToken].lastSeen = new Date().toISOString();
    }

    const currentUserIsSuper = !!user.isSuperAdmin || sessionToken === (process.env.ADMIN_PASSWORD || "aK9#mP2$vL8!qZ5@wN3&rY7*bT1^uJ4%xV6#Qm9$");
    const activeList = Object.values(activeAdminSessions).filter(s => !s.isKicked);
    const canManageVsnnnnn = isVsnnnnnUser(sessionToken, user);

    res.json({
      success: true,
      isSuperAdmin: currentUserIsSuper,
      isVsnnnnn: canManageVsnnnnn,
      currentSessionToken: sessionToken,
      activeSessions: activeList,
      loginLogs: adminLoginLogs,
    });
  });

  app.post("/api/admin/sessions/kick", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);

    if (!sessionToken || !user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const canManageVsnnnnn = isVsnnnnnUser(sessionToken, user);
    if (!canManageVsnnnnn) {
      return res.status(403).json({ error: "Access Denied: Only Discord user vsnnnnn can revoke admin panel access!" });
    }

    const { targetSessionToken } = req.body;
    if (!targetSessionToken) {
      return res.status(400).json({ error: "targetSessionToken is required" });
    }

    if (targetSessionToken === sessionToken) {
      return res.status(400).json({ error: "Cannot kick your own active session!" });
    }

    if (activeAdminSessions[targetSessionToken]) {
      activeAdminSessions[targetSessionToken].isKicked = true;
    }
    // We preserve the actual session so they stay logged into the trade site as a regular user
    // delete sessions[targetSessionToken];

    adminLoginLogs.unshift({
      id: "log_kick_" + Date.now(),
      timestamp: new Date().toISOString(),
      userAgent: `Session revoked by vsnnnnn`,
      isSuperAdmin: true,
      sessionToken: targetSessionToken,
      unread: true,
      text: `⛔ Session ${targetSessionToken.substring(0, 10)}... access was REVOKED by Discord user vsnnnnn`
    });

    persistState();
    res.json({ success: true, message: "Admin session kicked successfully!" });
  });

  app.post("/api/admin/logs/read", (req, res) => {
    adminLoginLogs.forEach(l => l.unread = false);
    persistState();
    res.json({ success: true });
  });

  app.post("/api/admin/logs/clear", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const canManageVsnnnnn = isVsnnnnnUser(sessionToken, user);
    if (!canManageVsnnnnn) {
      return res.status(403).json({ error: "Access Denied: Only Discord user vsnnnnn can clear login notification history!" });
    }

    adminLoginLogs.length = 0;
    persistState();
    res.json({ success: true, message: "Login notification history cleared successfully!" });
  });

  app.get("/api/admin/audit-logs", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ success: true, auditLogs: adminAuditLogs });
  });

  // Admin Emails Management
  app.get("/api/admin/emails", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ isAdmin: true });
  });

  // Global Background Music Config
  app.get("/api/music/config", (req, res) => {
    res.json({ globalMusicUrl });
  });

  app.post("/api/music/config", (req, res) => {
    const { url } = req.body;
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    globalMusicUrl = typeof url === "string" ? url.trim() : "";
    logAdminAction(user.displayName || user.name, "Update Music URL", globalMusicUrl || "Muted/Custom Track");
    persistState();
    res.json({ success: true, globalMusicUrl });
  });

  // Dynamic Units Endpoints
  app.get("/api/units", (req, res) => {
    res.json({ units: dbState.units || defaultUnits });
  });

  app.post("/api/units", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { units } = req.body;
    if (!Array.isArray(units)) {
      return res.status(400).json({ error: "Invalid units list" });
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

    const sorted = [...units].sort((a: any, b: any) => {
      const rA = getRarityIndex(a.rarity);
      const rB = getRarityIndex(b.rarity);
      if (rA !== rB) return rA - rB;
      return (Number(a.gems) || 0) - (Number(b.gems) || 0);
    });

    dbState.units = sorted;
    logAdminAction(user.displayName || user.name, "Update Units Database", `Saved ${sorted.length} total units`);
    persistState();
    res.json({ success: true, units: dbState.units });
  });

  // Dynamic Signatures Endpoints
  app.get("/api/signatures", (req, res) => {
    res.json({ signatures: dbState.signatures || defaultSignatures });
  });

  app.post("/api/signatures", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { signatures } = req.body;
    if (!Array.isArray(signatures)) {
      return res.status(400).json({ error: "Invalid signatures list" });
    }
    dbState.signatures = signatures;
    logAdminAction(user.displayName || user.name, "Update Signatures List", `Saved ${signatures.length} signatures`);
    persistState();
    res.json({ success: true, signatures: dbState.signatures });
  });

  // Dynamic Roadmap Endpoints
  app.get("/api/roadmap", (req, res) => {
    res.json({ roadmap: dbState.roadmap || defaultRoadmap });
  });

  app.post("/api/roadmap", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { roadmap } = req.body;
    if (!Array.isArray(roadmap)) {
      return res.status(400).json({ error: "Invalid roadmap list" });
    }
    dbState.roadmap = roadmap;
    logAdminAction(user.displayName || user.name, "Update Roadmap Items", `Saved ${roadmap.length} items`);
    persistState();
    res.json({ success: true, roadmap: dbState.roadmap });
  });

  // Dynamic Countdown Endpoints
  app.get("/api/countdown", (req, res) => {
    res.json({ countdown: dbState.countdown || defaultCountdown });
  });

  app.post("/api/countdown", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { countdown } = req.body;
    if (!countdown || typeof countdown !== "object") {
      return res.status(400).json({ error: "Invalid countdown object" });
    }
    dbState.countdown = countdown;
    logAdminAction(user.displayName || user.name, "Update Countdown Timer", `Target: ${countdown.targetTime} (${countdown.title})`);
    persistState();
    res.json({ success: true, countdown: dbState.countdown });
  });

  // Dynamic Update Logs Endpoints
  app.get("/api/updates", (req, res) => {
    res.json({ updates: dbState.updateLogs || defaultUpdateLogs });
  });

  app.post("/api/updates", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid updates list" });
    }
    dbState.updateLogs = updates;
    logAdminAction(user.displayName || user.name, "Update Change Logs", `Saved ${updates.length} log entries`);
    persistState();
    res.json({ success: true, updates: dbState.updateLogs });
  });

  // Serve uploaded global music file
  app.get("/api/music/file", (req, res) => {
    const filePath = path.join(process.cwd(), "public", "global_music.mp3");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.sendFile(filePath);
    } else {
      res.status(404).send("File not found");
    }
  });

  // Upload custom global music file
  app.post("/api/music/upload", (req, res) => {
    const { base64Data } = req.body;
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!base64Data) {
      return res.status(400).json({ error: "No file content provided" });
    }

    try {
      const buffer = Buffer.from(base64Data, "base64");
      const publicDir = path.join(process.cwd(), "public");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      const filePath = path.join(publicDir, "global_music.mp3");
      fs.writeFileSync(filePath, buffer);
      
      globalMusicUrl = "/api/music/file";
      persistState();
      
      res.json({ success: true, globalMusicUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to write music file" });
    }
  });

  // Global Click Sound Config
  app.get("/api/click-sound/config", (req, res) => {
    res.json({ globalClickSoundUrl });
  });

  app.post("/api/click-sound/config", (req, res) => {
    const { url } = req.body;
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    globalClickSoundUrl = typeof url === "string" ? url.trim() : "";
    persistState();
    res.json({ success: true, globalClickSoundUrl });
  });

  // Serve uploaded global click sound file
  app.get("/api/click-sound/file", (req, res) => {
    const filePath = path.join(process.cwd(), "public", "global_click_sound.mp3");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.sendFile(filePath);
    } else {
      res.status(404).send("File not found");
    }
  });

  // Upload custom click sound file
  app.post("/api/click-sound/upload", (req, res) => {
    const { base64Data } = req.body;
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!base64Data) {
      return res.status(400).json({ error: "No file content provided" });
    }

    try {
      const buffer = Buffer.from(base64Data, "base64");
      const publicDir = path.join(process.cwd(), "public");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      const filePath = path.join(publicDir, "global_click_sound.mp3");
      fs.writeFileSync(filePath, buffer);
      
      globalClickSoundUrl = "/api/click-sound/file";
      persistState();
      
      res.json({ success: true, globalClickSoundUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to write click sound file" });
    }
  });

  // Reset custom click sound to default
  app.post("/api/click-sound/reset", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      globalClickSoundUrl = "";
      persistState();

      const filePath = path.join(process.cwd(), "public", "global_click_sound.mp3");
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ success: true, globalClickSoundUrl: "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reset click sound file" });
    }
  });

  // 1. Search Roblox User by Username (proxies official Roblox API)
  app.post("/api/roblox/search", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "Username is required" });
      }

      // Step A: Post to usernames API
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      });

      if (!userRes.ok) {
        throw new Error(`Roblox Users API responded with ${userRes.status}`);
      }

      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) {
        return res.status(404).json({ error: "Roblox user not found. Double check the spelling!" });
      }

      const rUser = userData.data[0];

      // Step B: Get Avatar image
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${rUser.id}&size=150x150&format=Png&isCircular=false`
      );
      let avatarUrl = "https://img.icons8.com/color/150/roblox.png"; // fallback

      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data && thumbData.data.length > 0) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }

      res.json({
        success: true,
        user: {
          id: rUser.id,
          name: rUser.name,
          displayName: rUser.displayName,
          avatar: avatarUrl,
        },
      });
    } catch (error: any) {
      console.error("Roblox user search error:", error);
      res.status(500).json({ error: error.message || "Failed to contact Roblox services" });
    }
  });

  // 2. Generate custom verification code
  app.post("/api/roblox/generate-verification", (req, res) => {
    const { robloxId, username } = req.body;
    if (!robloxId || !username) {
      return res.status(400).json({ error: "Roblox ID and Username are required" });
    }

    const cleanUsername = String(username).toLowerCase();
    const verificationCode = `ORIGIN-TTD-${Math.floor(100000 + Math.random() * 900000)}`;

    pendingVerifications[cleanUsername] = {
      username: String(username),
      code: verificationCode,
      createdAt: Date.now(),
    };

    res.json({ verificationCode });
  });

  // 3. Verify user's profile description
  app.post("/api/roblox/verify", async (req, res) => {
    try {
      const { robloxId, username, verificationCode } = req.body;
      if (!robloxId || !username || !verificationCode) {
        return res.status(400).json({ error: "Missing required verification details" });
      }

      const cleanUsername = String(username).toLowerCase();
      const pending = pendingVerifications[cleanUsername];

      if (!pending || pending.code !== verificationCode) {
        return res.status(400).json({ error: "Invalid verification code or session expired. Generate a new one!" });
      }

      // Query the official Roblox profile description
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
      if (!profileRes.ok) {
        throw new Error(`Failed to fetch profile details for Roblox ID ${robloxId}`);
      }

      const profileData = await profileRes.json();
      const description = profileData.description || "";

      // Check if the generated verification code matches what's written in their Roblox About section
      if (!description.includes(verificationCode)) {
        return res.status(400).json({
          error: "Verification code not found in your Roblox 'About' description! Please update your profile description and try again.",
        });
      }

      // Cleanup pending code
      delete pendingVerifications[cleanUsername];

      // Fetch avatar headshot
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=false`
      );
      let avatarUrl = "https://img.icons8.com/color/150/roblox.png";
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data && thumbData.data.length > 0) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }

      // Generate secure session token
      const sessionToken = `session_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
      const loggedUser: RobloxUser = {
        id: Number(robloxId),
        name: profileData.name,
        displayName: profileData.displayName,
        avatar: avatarUrl,
      };

      sessions[sessionToken] = loggedUser;
      persistState();

      res.json({
        success: true,
        sessionToken,
        user: loggedUser,
      });
    } catch (error: any) {
      console.error("Roblox profile verification error:", error);
      res.status(500).json({ error: error.message || "Roblox verification service failed" });
    }
  });

  // 3.5. Instant/express bypass login for ease of use
  app.post("/api/roblox/instant-connect", async (req, res) => {
    try {
      const { robloxId, username, displayName, avatar, email } = req.body;
      if (!robloxId || !username) {
        return res.status(400).json({ error: "Roblox ID and Username are required for fast connection" });
      }

      // Generate secure session token
      const sessionToken = `session_instant_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
      const loggedUser: RobloxUser = {
        id: Number(robloxId),
        name: username,
        displayName: displayName || username,
        avatar: avatar || "https://img.icons8.com/color/150/roblox.png",
        email: email || undefined
      };

      sessions[sessionToken] = loggedUser;
      persistState();

      res.json({
        success: true,
        sessionToken,
        user: loggedUser,
      });
    } catch (error: any) {
      console.error("Instant connect error:", error);
      res.status(500).json({ error: error.message || "Failed to establish quick connection" });
    }
  });

  // 3.8. Official Roblox OAuth 2.0 Configuration and Endpoints
  const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || "";
  const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || "";

  app.get("/api/roblox/oauth-config", (req, res) => {
    res.json({
      configured: !!(ROBLOX_CLIENT_ID && ROBLOX_CLIENT_SECRET),
      clientId: ROBLOX_CLIENT_ID,
    });
  });

  app.get("/api/roblox/oauth-start", (req, res) => {
    if (!ROBLOX_CLIENT_ID) {
      return res.status(400).json({ error: "Roblox OAuth Client ID is not configured in environment (.env)" });
    }
    const state = `state_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    // Dynamically build the redirect URL based on current host or app configuration
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${appUrl}/api/roblox/oauth-callback`;

    const authUrl = `https://authorize.roblox.com/?client_id=${ROBLOX_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+profile&state=${state}`;
    res.json({ authUrl, state });
  });

  app.get("/api/roblox/oauth-callback", async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Roblox OAuth Authorization Code is missing.");
    }

    try {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const redirectUri = `${appUrl}/api/roblox/oauth-callback`;

      // Exchange the authorization code for an official Roblox access token
      const tokenParams = new URLSearchParams();
      tokenParams.append("client_id", ROBLOX_CLIENT_ID);
      tokenParams.append("client_secret", ROBLOX_CLIENT_SECRET);
      tokenParams.append("grant_type", "authorization_code");
      tokenParams.append("code", String(code));
      tokenParams.append("redirect_uri", redirectUri);

      const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Roblox official token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch Roblox user profile details using the official access token
      const userInfoRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userInfoRes.ok) {
        throw new Error("Failed to retrieve Roblox official user info.");
      }

      const userInfo = await userInfoRes.json();
      const robloxId = Number(userInfo.sub);
      const username = userInfo.preferred_username || userInfo.name;
      const displayName = userInfo.nickname || username;

      // Fetch avatar headshot from Roblox Thumbnails API
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=false`
      );
      let avatarUrl = "https://img.icons8.com/color/150/roblox.png";
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data && thumbData.data.length > 0) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }

      // Generate a secure session token
      const sessionToken = `session_oauth_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
      const loggedUser: RobloxUser = {
        id: robloxId,
        name: username,
        displayName: displayName,
        avatar: avatarUrl,
      };

      sessions[sessionToken] = loggedUser;
      persistState();

      // Return user back to home page with an active login session
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Origin TTD - Authorization Success</title>
            <script>
              try {
                localStorage.setItem("lttd_rb_session", "${sessionToken}");
                if (window.opener) {
                  window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", sessionToken: "${sessionToken}" }, "*");
                }
                setTimeout(function() {
                  window.close();
                  setTimeout(function() {
                    const statusText = document.getElementById("status-text");
                    if (statusText) {
                      statusText.innerText = "Успешный вход! Вы можете закрыть эту вкладку самостоятельно.";
                    }
                  }, 1000);
                }, 200);
              } catch (e) {
                console.error("Failed to store session:", e);
                window.location.href = "/";
              }
            </script>
          </head>
          <body style="background: #0c0d12; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 400px; padding: 25px; border: 1px solid rgba(79, 70, 229, 0.2); background: rgba(79, 70, 229, 0.05); border-radius: 20px;">
              <h2 style="color: #4f46e5; font-size: 24px; margin-bottom: 10px;">Вход выполнен!</h2>
              <p id="status-text" style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">Окно авторизации закроется автоматически.</p>
              <button onclick="window.close()" style="background: #4f46e5; color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 13px; transition: opacity 0.2s;">Закрыть окно</button>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("OAuth Callback Error:", err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Origin TTD - Authorization Failed</title>
          </head>
          <body style="background: #0c0d12; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 400px; padding: 20px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); border-radius: 16px;">
              <h2 style="color: #ef4444; font-size: 22px; margin-bottom: 10px;">Authentication Failed</h2>
              <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">${err.message || "An error occurred during OAuth communication."}</p>
              <a href="/" style="background: #5865F2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px;">Return to Site</a>
            </div>
          </body>
        </html>
      `);
    }
  });

  // 3.9. Official Discord OAuth 2.0 Configuration and Endpoints
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1523415843294416936";
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "_c751vnnD7tMd2gyLBYrRxBIx7IlbP1L";

  const pendingDiscordAuth: Record<string, { status: "pending" | "ready"; sessionToken?: string; user?: any; createdAt: number }> = {};

  // Periodically clean up expired states (older than 15 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const st in pendingDiscordAuth) {
      if (now - pendingDiscordAuth[st].createdAt > 15 * 60 * 1000) {
        delete pendingDiscordAuth[st];
      }
    }
  }, 60000);

  app.get("/api/discord/oauth-config", (req, res) => {
    res.json({
      configured: !!(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET),
      clientId: DISCORD_CLIENT_ID,
    });
  });

  app.get("/api/discord/oauth-start", (req, res) => {
    if (!DISCORD_CLIENT_ID) {
      return res.status(400).json({ error: "Discord OAuth Client ID is not configured in environment (.env)" });
    }
    const state = `state_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    pendingDiscordAuth[state] = { status: "pending", createdAt: Date.now() };

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${appUrl}/api/discord/oauth-callback`;

    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+email&state=${state}`;
    res.json({ authUrl, state });
  });

  app.get("/api/discord/oauth-poll", (req, res) => {
    const { state } = req.query;
    if (!state || typeof state !== "string") {
      return res.status(400).json({ error: "State parameter is required" });
    }
    const record = pendingDiscordAuth[state];
    if (record && record.status === "ready" && record.sessionToken) {
      return res.json({
        completed: true,
        sessionToken: record.sessionToken,
        user: record.user,
      });
    }
    res.json({ completed: false });
  });

  app.post("/api/auth/demo", (req, res) => {
    const { username } = req.body;
    if (!username || username.trim() === "") {
      return res.status(400).json({ error: "Username is required" });
    }
    
    const cleanUsername = username.trim().substring(0, 25);
    const sessionToken = `session_oauth_demo_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    
    // Choose a custom avatar number based on hash
    const avatarNum = getHashCode(cleanUsername) % 6;
    const avatarUrl = `https://cdn.discordapp.com/embed/avatars/${avatarNum}.png`;
    
    const loggedUser: RobloxUser = {
      id: getHashCode(cleanUsername) || 9991234,
      name: cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      displayName: cleanUsername,
      avatar: avatarUrl,
      isDiscord: true,
      discordId: `demo_${getHashCode(cleanUsername)}`,
      email: `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "")}@demo-trade.com`
    };
    
    sessions[sessionToken] = loggedUser;
    persistState();
    
    res.json({ success: true, sessionToken, user: { ...loggedUser, isAdmin: checkIsAdmin(loggedUser) } });
  });

  app.get("/api/discord/oauth-callback", async (req, res) => {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Discord OAuth Authorization Code is missing.");
    }

    try {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const redirectUri = `${appUrl}/api/discord/oauth-callback`;

      // Exchange code for Discord token
      const tokenParams = new URLSearchParams();
      tokenParams.append("client_id", DISCORD_CLIENT_ID);
      tokenParams.append("client_secret", DISCORD_CLIENT_SECRET);
      tokenParams.append("grant_type", "authorization_code");
      tokenParams.append("code", String(code));
      tokenParams.append("redirect_uri", redirectUri);

      const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Discord official token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch Discord user profile
      const userInfoRes = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userInfoRes.ok) {
        throw new Error("Failed to retrieve Discord user details.");
      }

      const userInfo = await userInfoRes.json();
      const discordId = userInfo.id;
      const username = userInfo.username;
      const displayName = userInfo.global_name || username;
      // Resolve avatar
      let avatarUrl = `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(discordId) % 6n)}.png`;
      if (userInfo.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${userInfo.avatar}.png?size=256`;
      }

      // Find or create a linked Roblox account for them
      const sessionToken = `session_oauth_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
      const loggedUser: RobloxUser = {
        id: Number(discordId.substring(0, 8)) || 17285, // Use partial ID
        name: username,
        displayName: `${displayName}`,
        avatar: avatarUrl,
        isDiscord: true,
        discordId: discordId,
        email: userInfo.email || undefined,
      };

      // Propagate updated Discord profile to existing sessions
      for (const token in sessions) {
        if (sessions[token] && (sessions[token].discordId === discordId || String(sessions[token].id) === String(loggedUser.id))) {
          sessions[token] = { ...sessions[token], ...loggedUser };
        }
      }
      sessions[sessionToken] = loggedUser;

      // Propagate updated Discord profile to existing trades & counter offers
      for (const trade of activeTrades) {
        if (trade.discordId === discordId || String(trade.userId) === String(loggedUser.id)) {
          trade.username = username;
          trade.displayName = displayName;
          trade.avatar = avatarUrl;
        }
        if (trade.counterOffers && Array.isArray(trade.counterOffers)) {
          for (const counter of trade.counterOffers) {
            if (counter.discordId === discordId || String(counter.userId) === String(loggedUser.id)) {
              counter.username = username;
              counter.displayName = displayName;
              counter.avatar = avatarUrl;
            }
          }
        }
      }

      // Propagate updated Discord profile to active chats
      for (const chat of activeChats) {
        if (chat.userA && (chat.userA.discordId === discordId || String(chat.userA.id) === String(loggedUser.id))) {
          chat.userA.name = username;
          chat.userA.displayName = displayName;
          chat.userA.avatar = avatarUrl;
        }
        if (chat.userB && (chat.userB.discordId === discordId || String(chat.userB.id) === String(loggedUser.id))) {
          chat.userB.name = username;
          chat.userB.displayName = displayName;
          chat.userB.avatar = avatarUrl;
        }
      }

      // Mark auth state as ready for real-time polling
      if (state && typeof state === "string") {
        pendingDiscordAuth[state] = {
          status: "ready",
          sessionToken,
          user: { ...loggedUser, isAdmin: checkIsAdmin(loggedUser) },
          createdAt: Date.now(),
        };
      }

      persistState();

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Origin TTD - Discord Auth Success</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script>
              try {
                localStorage.setItem("lttd_rb_session", "${sessionToken}");
                if (window.opener) {
                  window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", sessionToken: "${sessionToken}" }, "*");
                }
              } catch (e) {
                console.error("Failed to store Discord session in localStorage:", e);
              }
              setTimeout(function() {
                try {
                  window.close();
                } catch(e) {}
              }, 400);
            </script>
          </head>
          <body style="background: #090a0f; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 16px; box-sizing: border-box;">
            <div style="text-align: center; max-width: 380px; width: 100%; padding: 32px 24px; border: 1px solid rgba(88, 101, 242, 0.3); background: #121420; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.8);">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(88, 101, 242, 0.15); border: 2px solid #5865f2; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">
                ✓
              </div>
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 8px;">Вход выполнен!</h2>
              <p id="status-text" style="color: #a1a1aa; font-size: 13px; margin: 0 0 24px; line-height: 1.4;">
                Вы успешно вошли как <strong style="color: #818cf8;">@${username}</strong>.<br/>Окно закроется автоматически.
              </p>
              <button onclick="window.close()" style="background: #5865f2; color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; cursor: pointer; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; width: 100%; transition: background 0.2s;">
                Закрыть окно
              </button>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Discord OAuth Callback Error:", err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Origin TTD - Discord Auth Failed</title>
          </head>
          <body style="background: #0c0d12; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 400px; padding: 20px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); border-radius: 16px;">
              <h2 style="color: #ef4444; font-size: 22px; margin-bottom: 10px;">Discord Authentication Failed</h2>
              <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">${err.message || "An error occurred during Discord OAuth communication."}</p>
              <a href="/" style="background: #5865F2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px;">Return to Site</a>
            </div>
          </body>
        </html>
      `);
    }
  });

  // 4. Session validity check
  app.post("/api/roblox/session-check", (req, res) => {
    const { sessionToken } = req.body;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.json({ valid: false });
    }
    
    syncUserAcrossDatabase(user);
    res.json({ valid: true, user: { ...user, isAdmin: checkIsAdmin(user) } });
  });

  // 5. Get Active Trade Listings
  app.get("/api/trades", (req, res) => {
    const sessionToken = (req.headers.authorization || req.query.sessionToken) as string | undefined;
    const user = resolveSession(sessionToken);
    if (user) {
      syncUserAcrossDatabase(user);
    }
    const { search } = req.query;
    let filteredTrades = [...activeTrades];

    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.toLowerCase();
      filteredTrades = filteredTrades.filter((t) => {
        // Search in Roblox Username
        if (t.robloxUsername.toLowerCase().includes(q)) return true;
        // Search in offers
        const inYourOffer = t.yourOffer.some((item: any) => item.unit?.name?.toLowerCase().includes(q));
        const inTheirOffer = t.theirOffer.some((item: any) => item.unit?.name?.toLowerCase().includes(q));
        return inYourOffer || inTheirOffer;
      });
    }

    // Sort by newest first
    filteredTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ trades: filteredTrades });
  });

  // 6. Create Trade Listing
  app.post("/api/trades", (req, res) => {
    const { sessionToken, yourOffer, yourGems, theirOffer, theirGems } = req.body;
    const user = resolveSession(sessionToken);

    if (!sessionToken || !user) {
      return res.status(401).json({ error: "You must be logged in to list a trade!" });
    }

    const muteCheck = isUserMuted(user.id, user.name, user.discordId);
    if (muteCheck.muted) {
      return res.status(403).json({
        error: `You are currently muted/restricted and cannot post trades in the Trade Community. Reason: ${muteCheck.reason || "Muted by staff"}`
      });
    }

    if ((!yourOffer || yourOffer.length === 0) && yourGems <= 0) {
      return res.status(400).json({ error: "Your offer must contain at least one unit or some amount of Gems!" });
    }
 
    const newTrade: Trade = {
       id: `trade_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
       userId: user.id,
       username: user.name,
       displayName: user.displayName,
       avatar: user.avatar || "https://img.icons8.com/color/150/roblox.png",
       yourOffer: yourOffer || [],
       yourGems: Number(yourGems) || 0,
       theirOffer: theirOffer || [],
       theirGems: Number(theirGems) || 0,
       createdAt: new Date().toISOString(),
       isDiscord: user.isDiscord || false,
       isStaff: checkIsAdmin(user),
       discordId: user.discordId,
    };

    activeTrades.unshift(newTrade);
    persistState();

    res.json({ success: true, trade: newTrade });
  });

  // Counter Offer routes
  app.post("/api/trades/:id/counter", (req, res) => {
    let { id } = req.params;
    if (id.includes("?")) id = id.split("?")[0];
    
    let sessionToken = req.headers.authorization;
    if (sessionToken && sessionToken.startsWith("Bearer ")) {
      sessionToken = sessionToken.slice(7);
    }
    
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const muteCheck = isUserMuted(user.id, user.name, user.discordId);
    if (muteCheck.muted) {
      return res.status(403).json({
        error: `You are currently muted/restricted and cannot send counter offers. Reason: ${muteCheck.reason || "Muted by staff"}`
      });
    }

    const { offerText } = req.body;
    if (!offerText || !offerText.trim()) {
       return res.status(400).json({ error: "Offer text is required" });
    }

    const trade = activeTrades.find(t => t.id === id);
    if (!trade) {
       return res.status(404).json({ error: "Trade not found" });
    }

    const newCounter: CounterOffer = {
      id: "counter_" + Date.now() + "_" + Math.floor(Math.random()*1000),
      userId: user.id,
      displayName: user.displayName,
      avatar: user.avatar,
      discordId: user.discordId,
      offerText: offerText.trim(),
      createdAt: new Date().toISOString()
    };

    if (!trade.counterOffers) trade.counterOffers = [];
    trade.counterOffers.push(newCounter);
    persistState();

    res.json({ success: true, counter: newCounter });
  });

  app.delete("/api/trades/:id/counter/:counterId", (req, res) => {
    let { id, counterId } = req.params;
    if (id.includes("?")) id = id.split("?")[0];
    if (counterId.includes("?")) counterId = counterId.split("?")[0];

    let sessionToken = req.headers.authorization;
    if (sessionToken && sessionToken.startsWith("Bearer ")) {
      sessionToken = sessionToken.slice(7);
    }

    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const trade = activeTrades.find(t => t.id === id);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    if (!trade.counterOffers) {
      return res.status(404).json({ error: "Counter offer not found" });
    }

    const counterIdx = trade.counterOffers.findIndex(c => c.id === counterId);
    if (counterIdx === -1) {
      return res.status(404).json({ error: "Counter offer not found" });
    }

    const counter = trade.counterOffers[counterIdx];
    const isOwner = counter.userId === user.id;
    const isTradeOwner = trade.userId === user.id;
    const isAdmin = checkIsAdmin(user);

    if (!isOwner && !isTradeOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this offer" });
    }

    trade.counterOffers.splice(counterIdx, 1);
    persistState();

    res.json({ success: true });
  });

  // 7. Delete Trade Listing (with Moderator bypass)
  app.delete("/api/trades/:id", (req, res) => {
    let { id } = req.params;
    // Fix if id has query params accidentally attached (e.g., tradeId?sessionToken=...)
    if (id.includes("?")) {
      id = id.split("?")[0];
    }
    let sessionToken = req.body.sessionToken || req.headers.authorization || req.query.sessionToken;

    if (sessionToken && typeof sessionToken === "string" && sessionToken.startsWith("Bearer ")) {
      sessionToken = sessionToken.slice(7);
    }

    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Authentication required to delete trade listing" });
    }

    const tradeIdx = activeTrades.findIndex((t) => t.id === id);

    if (tradeIdx === -1) {
      console.warn(`Trade not found for ID: ${id}`);
      return res.status(404).json({ error: "Trade listing not found" });
    }

    const trade = activeTrades[tradeIdx];

    const isAdmin = checkIsAdmin(user);

    // Verify ownership or admin status
    const isOwner = 
      String(trade.userId || trade.robloxId) === String(user.id) || 
      (trade.discordId && user.discordId && String(trade.discordId) === String(user.discordId));

    if (!isOwner && !isAdmin) {
      console.warn(`Permission denied: User ${user.displayName} (ID: ${user.id}, DiscordID: ${user.discordId}) tried to delete trade listed by UserID ${trade.userId || trade.robloxId} (DiscordID: ${trade.discordId})`);
      return res.status(403).json({ error: "You do not have permission to delete other players' listings!" });
    }

    activeTrades.splice(tradeIdx, 1);
    persistState();

    res.json({ success: true });
  });

  // --- DIRECT MESSAGING & MODERATION ENDPOINTS ---

  // Get active chats for user
  app.get("/api/chats", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    syncUserAcrossDatabase(user);
    
    // Filter chats involving user
    const userChats = activeChats.filter(
      (c) => String(c.userA.id) === String(user.id) || 
             String(c.userB.id) === String(user.id) ||
             (c.userA.discordId && user.discordId && String(c.userA.discordId) === String(user.discordId)) ||
             (c.userB.discordId && user.discordId && String(c.userB.discordId) === String(user.discordId))
    );

    res.json({ chats: userChats });
  });

  // Get all chats in the system (Moderator Only)
  app.get("/api/chats/admin", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);

    if (!isAdmin) {
      return res.status(403).json({ error: "Only moderators can view all chats." });
    }

    res.json({ chats: activeChats });
  });

  function containsForbiddenWord(text: string) {
    const lower = text.toLowerCase();
    return forbiddenWordsList.some(w => lower.includes(w.toLowerCase()));
  }

  function containsLink(text: string) {
    // Basic regex to detect common URLs and domains
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|ru|io|me|cc|biz|info|site|tech|xyz|co|uk|us|eu|su)(\/[^\s]*)?)/i;
    return urlPattern.test(text);
  }

  // Get forbidden words (Admin only)
  app.get("/api/admin/forbidden-words", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ forbiddenWords: forbiddenWordsList });
  });

  // Add forbidden word (Admin only)
  app.post("/api/admin/forbidden-words", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { word } = req.body;
    if (!word || typeof word !== "string" || word.trim() === "") {
      return res.status(400).json({ error: "Invalid word" });
    }
    const cleanWord = word.trim().toLowerCase();
    if (!forbiddenWordsList.includes(cleanWord)) {
      forbiddenWordsList.push(cleanWord);
      logAdminAction(user.displayName || user.name, "Add Forbidden Word", `Added word: "${cleanWord}"`);
      persistState();
    }
    res.json({ success: true, forbiddenWords: forbiddenWordsList });
  });

  // Delete forbidden word (Admin only)
  app.delete("/api/admin/forbidden-words", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ error: "Word is required" });
    }
    forbiddenWordsList = forbiddenWordsList.filter(w => w.toLowerCase() !== word.toLowerCase());
    logAdminAction(user.displayName || user.name, "Delete Forbidden Word", `Removed word: "${word}"`);
    persistState();
    res.json({ success: true, forbiddenWords: forbiddenWordsList });
  });

  // Start chat without sending message
  app.post("/api/chats/start", (req, res) => {
    const { sessionToken, recipientId, recipientName, recipientDisplayName, recipientAvatar } = req.body;
    const sender = resolveSession(sessionToken);

    if (!sessionToken || !sender) {
      return res.status(401).json({ error: "You must be connected to start a chat." });
    }

    const muteCheck = isUserMuted(sender.id, sender.name, sender.discordId);
    if (muteCheck.muted) {
      const expiresStr = muteCheck.expiresAt === "permanent" 
        ? "permanently" 
        : `until ${new Date(muteCheck.expiresAt!).toLocaleString()}`;
      return res.status(403).json({ error: `You are temporarily muted from using the chat ${expiresStr}. Reason: ${muteCheck.reason || "None"}` });
    }

    if (!recipientId || !recipientName) {
      return res.status(400).json({ error: "Recipient info is missing." });
    }

    const chatId = sender.id < Number(recipientId)
      ? `chat_${sender.id}_${recipientId}`
      : `chat_${recipientId}_${sender.id}`;

    let chat = activeChats.find(
      (c) => c.id === chatId || 
        (String(c.userA.id) === String(sender.id) && String(c.userB.id) === String(recipientId)) ||
        (String(c.userA.id) === String(recipientId) && String(c.userB.id) === String(sender.id)) ||
        (c.userA.discordId && sender.discordId && c.userB.discordId && req.body.recipientDiscordId && String(c.userA.discordId) === String(sender.discordId) && String(c.userB.discordId) === String(req.body.recipientDiscordId)) ||
        (c.userA.discordId && req.body.recipientDiscordId && c.userB.discordId && sender.discordId && String(c.userA.discordId) === String(req.body.recipientDiscordId) && String(c.userB.discordId) === String(sender.discordId))
    );

    if (!chat) {
      chat = {
        id: chatId,
        userA: {
          id: sender.id,
          name: sender.name,
          displayName: sender.displayName,
          avatar: sender.avatar,
          discordId: sender.discordId,
        },
        userB: {
          id: Number(recipientId),
          name: recipientName,
          displayName: recipientDisplayName,
          avatar: recipientAvatar,
          discordId: req.body.recipientDiscordId,
        },
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      activeChats.push(chat);
      persistState();
    }

    res.json({ success: true, chat });
  });

  // Send a direct message
  app.post("/api/chats/send", (req, res) => {
    const { sessionToken, recipientId, recipientName, recipientDisplayName, recipientAvatar, text } = req.body;
    const sender = resolveSession(sessionToken);

    if (!sessionToken || !sender) {
      return res.status(401).json({ error: "You must be connected to send messages." });
    }

    const muteCheck = isUserMuted(sender.id, sender.name, sender.discordId);
    if (muteCheck.muted) {
      const expiresStr = muteCheck.expiresAt === "permanent" 
        ? "permanently" 
        : `until ${new Date(muteCheck.expiresAt!).toLocaleString()}`;
      return res.status(403).json({ error: `You are temporarily muted from using the chat ${expiresStr}. Reason: ${muteCheck.reason || "None"}` });
    }

    if (!recipientId || !recipientName) {
      return res.status(400).json({ error: "Recipient info is missing." });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const cleanText = text.trim();
    if (containsForbiddenWord(cleanText)) {
      return res.status(400).json({ error: "Your message contains inappropriate words and cannot be sent." });
    }
    if (containsLink(cleanText) && !cleanText.startsWith("[TRADE_OFFER]")) {
      return res.status(400).json({ error: "Sending links is not allowed." });
    }

    // Prevent sending a message to oneself
    if (sender.id === Number(recipientId)) {
      return res.status(400).json({ error: "You cannot chat with yourself." });
    }

    // Find if a chat already exists between sender and recipient
    const sortedIds = [sender.id, Number(recipientId)].sort((a, b) => a - b);
    const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;

    let chat = activeChats.find((c) => c.id === chatId);

    if (!chat) {
      chat = {
        id: chatId,
        userA: {
          id: sender.id,
          name: sender.name,
          displayName: sender.displayName,
          avatar: sender.avatar || "https://img.icons8.com/color/150/roblox.png",
          discordId: sender.discordId
        },
        userB: {
          id: Number(recipientId),
          name: recipientName,
          displayName: recipientDisplayName || recipientName,
          avatar: recipientAvatar || "https://img.icons8.com/color/150/roblox.png",
          discordId: req.body.recipientDiscordId
        },
        messages: []
      };
      activeChats.push(chat);
    } else {
      // Backfill missing discordIds on existing chats
      if (!chat.userA.discordId && sender.id === chat.userA.id) {
        chat.userA.discordId = sender.discordId;
      } else if (!chat.userB.discordId && sender.id === chat.userB.id) {
        chat.userB.discordId = sender.discordId;
      }
      if (!chat.userA.discordId && Number(recipientId) === chat.userA.id) {
        chat.userA.discordId = req.body.recipientDiscordId;
      } else if (!chat.userB.discordId && Number(recipientId) === chat.userB.id) {
        chat.userB.discordId = req.body.recipientDiscordId;
      }
    }

    // Append new message
    const newMessage = {
      id: `msg_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
      senderId: sender.id,
      senderName: sender.displayName || sender.name,
      text: cleanText,
      createdAt: new Date().toISOString()
    };

    chat.messages.push(newMessage);

    // Limit messages history
    if (chat.messages.length > 80) {
      chat.messages.shift();
    }

    persistState();
    res.json({ success: true, chat, message: newMessage });
  });

  // Delete specific message (Admin / Moderator / Sender)
  app.delete("/api/chats/:chatId/messages/:messageId", (req, res) => {
    const { chatId, messageId } = req.params;
    const { sessionToken } = req.body;
    const user = resolveSession(sessionToken);

    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);

    const chat = activeChats.find((c) => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const msgIdx = chat.messages.findIndex((m: any) => m.id === messageId);
    if (msgIdx === -1) {
      return res.status(404).json({ error: "Message not found" });
    }

    const msg = chat.messages[msgIdx];

    // Allowed if sender or admin
    if (String(msg.senderId) !== String(user.id) && !isAdmin) {
      return res.status(403).json({ error: "You cannot delete messages sent by other players unless you are a moderator." });
    }

    chat.messages.splice(msgIdx, 1);
    persistState();

    res.json({ success: true });
  });

  
  // Edit message
  app.put("/api/chats/:chatId/messages/:messageId", (req, res) => {
    const { chatId, messageId } = req.params;
    const { sessionToken, text } = req.body;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (text && typeof text === 'string') {
      const cleanText = text.trim();
      if (containsForbiddenWord(cleanText)) {
        return res.status(400).json({ error: "Your message contains inappropriate words and cannot be saved." });
      }
      if (containsLink(cleanText) && !cleanText.startsWith("[TRADE_OFFER]")) {
        return res.status(400).json({ error: "Sending links is not allowed." });
      }
    }

    const chat = activeChats.find((c) => c.id === chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    const msg = chat.messages.find((m) => m.id === messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    const isTradeOffer = msg.text.startsWith("[TRADE_OFFER]");
    const isRecipientAccepting = isTradeOffer && (
      (chat.userA.id === user.id && msg.senderId !== user.id) ||
      (chat.userB.id === user.id && msg.senderId !== user.id)
    );
    
    if (msg.senderId !== user.id && !isRecipientAccepting) {
      return res.status(403).json({ error: "Forbidden" });
    }

    msg.text = text;
    msg.edited = true;
    persistState();
    res.json({ success: true, message: msg });
  });

  // React to message
  app.post("/api/chats/:chatId/messages/:messageId/react", (req, res) => {
    const { chatId, messageId } = req.params;
    const { sessionToken, emoji } = req.body;
    const user = resolveSession(sessionToken);
    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const chat = activeChats.find((c) => c.id === chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    const msg = chat.messages.find((m) => m.id === messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    
    const userReacted = msg.reactions[emoji].includes(user.name);
    if (userReacted) {
      msg.reactions[emoji] = msg.reactions[emoji].filter((n) => n !== user.name);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(user.name);
    }
    persistState();
    res.json({ success: true, message: msg });
  });

  // Delete entire chat
  // Delete entire chat (Admin / Participant)
  app.delete("/api/chats/:chatId", (req, res) => {
    const { chatId } = req.params;
    const { sessionToken } = req.body;
    const user = resolveSession(sessionToken);

    if (!sessionToken || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = checkIsAdmin(user);

    const chatIdx = activeChats.findIndex((c) => c.id === chatId);
    if (chatIdx === -1) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chat = activeChats[chatIdx];

    const isParticipant = String(chat.userA.id) === String(user.id) || String(chat.userB.id) === String(user.id);

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ error: "You do not have permission to delete this chat." });
    }

    activeChats.splice(chatIdx, 1);
    persistState();

    res.json({ success: true });
  });

  // --- REPORTS & MODERATION SYSTEM ---

  // Submit a user or message report
  app.post("/api/reports", (req, res) => {
    const sessionToken = req.headers.authorization || req.body.sessionToken;
    const user = resolveSession(sessionToken);
    if (!user) {
      return res.status(401).json({ error: "You must be logged in to file a report." });
    }

    const { chatId, messageId, messageText, reportedUserId, reportedUserName, reason } = req.body;
    if (!reportedUserId || !reportedUserName || !reason) {
      return res.status(400).json({ error: "Missing required report information (reported user and reason)." });
    }

    const newReport = {
      id: "report_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      reporterId: user.id,
      reporterName: user.name,
      reporterDisplayName: user.displayName,
      chatId,
      messageId,
      messageText,
      reportedUserId: Number(reportedUserId),
      reportedUserName,
      reason: reason.trim(),
      status: "active", // "active", "investigated", "resolved"
      createdAt: new Date().toISOString()
    };

    activeReports.unshift(newReport);
    persistState();

    res.json({ success: true, report: newReport });
  });

  // Get all reports (Admin Only)
  app.get("/api/reports", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    res.json({ reports: activeReports });
  });

  // Mark report as resolved or investigated (Admin Only)
  app.post("/api/reports/:id/resolve", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const { id } = req.params;
    const { status } = req.body; // e.g. "resolved" or "investigated"
    
    const report = activeReports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.status = status || "resolved";
    logAdminAction(user.displayName || user.name, "Resolve Report", `Marked report #${id} as ${report.status}`);
    persistState();

    res.json({ success: true, report });
  });

  // Ban user (Admin Only)
  app.post("/api/users/ban", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const { userId, username, displayName, reason, durationMinutes } = req.body;
    if (!username && !userId) {
      return res.status(400).json({ error: "Must specify a username or User ID to issue a mute." });
    }

    let targetUserId = userId ? Number(userId) : null;
    let targetUsername = username ? String(username).replace(/^@/, "").trim() : "";
    let targetDisplayName = displayName ? String(displayName).trim() : "";
    let targetDiscordId = req.body.discordId;

    if (!targetUserId && targetUsername) {
      const found = findUserByUsername(targetUsername);
      if (found) {
        targetUserId = found.id;
        targetUsername = found.name;
        targetDisplayName = found.displayName || found.name;
        targetDiscordId = found.discordId;
      } else {
        targetUserId = getHashCode(targetUsername);
        if (!targetDisplayName) {
          targetDisplayName = targetUsername;
        }
      }
    } else if (targetUserId && !targetUsername) {
      targetUsername = `User_${targetUserId}`;
      targetDisplayName = targetUsername;
    }

    // Remove existing ban for same user if exists
    const existingIdx = bannedUsers.findIndex(b => String(b.userId) === String(targetUserId) || (b.username && b.username.toLowerCase() === targetUsername.toLowerCase()));
    if (existingIdx !== -1) {
      bannedUsers.splice(existingIdx, 1);
    }

    let expiresAt = "permanent";
    if (durationMinutes !== "permanent") {
      const { durationSeconds } = req.body;
      if (durationSeconds !== undefined && durationSeconds !== null) {
        const secs = Number(durationSeconds);
        if (!isNaN(secs) && secs > 0) {
          expiresAt = new Date(Date.now() + secs * 1000).toISOString();
        }
      } else {
        const mins = Number(durationMinutes);
        if (!isNaN(mins) && mins > 0) {
          expiresAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
        }
      }
    }

    const newBan = {
      userId: Number(targetUserId),
      username: targetUsername,
      displayName: targetDisplayName,
      discordId: targetDiscordId,
      reason: reason || "Violation of rules",
      expiresAt,
      bannedAt: new Date().toISOString(),
      isMute: !!req.body.isMute
    };

    bannedUsers.unshift(newBan);
    logAdminAction(
      user.displayName || user.name,
      newBan.isMute ? "Mute User" : "Ban User",
      `Target: ${targetUsername || targetUserId} | Reason: ${newBan.reason} | Expires: ${expiresAt}`
    );
    persistState();

    res.json({ success: true, ban: newBan });
  });

  // Get currently banned users list (Admin Only)
  app.get("/api/users/bans", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    res.json({ bans: bannedUsers });
  });

  // Unban user (Admin Only)
  app.post("/api/users/unban", (req, res) => {
    const sessionToken = req.headers.authorization;
    const user = resolveSession(sessionToken);
    if (!user || !checkIsAdmin(user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, username } = req.body;
    let idx = -1;
    
    if (userId) {
      idx = bannedUsers.findIndex(b => String(b.userId) === String(userId));
    }
    if (idx === -1 && username) {
      idx = bannedUsers.findIndex(b => b.username && b.username.toLowerCase() === String(username).replace(/^@/, "").trim().toLowerCase());
    }
    
    if (idx === -1) {
      return res.status(404).json({ error: "User is not muted" });
    }

    const removedUser = bannedUsers[idx];
    bannedUsers.splice(idx, 1);
    logAdminAction(
      user.displayName || user.name,
      "Unban/Unmute User",
      `Target: ${removedUser?.username || removedUser?.userId || username || userId}`
    );
    persistState();

    res.json({ success: true });
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
})();

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  initPromise.then(() => {
    const portNumber = typeof PORT === "number" ? PORT : parseInt(String(PORT), 10) || 3000;
    app.listen(portNumber, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${portNumber}`);
    });
  });
}

export default app;
