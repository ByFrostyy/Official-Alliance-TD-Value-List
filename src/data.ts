import { Unit, Staff, SignValue, UpdateLog } from "./types";

export const Yl: Unit[] = [
  {
    name: "Speaker Man",
    rarity: "Basic",
    img: "https://i.postimg.cc/jdwgCGtt/16-20260626163827.png",
    gems: 0,
    tokenValue: "0",
    shinyValue: "0",
    demand: 0,
    stability: "Underpaid",
    placeCost: 100,
    obtain: "Summon (50%)",
    upgrades: [
      { lvl: 1, cost: "Place ($100)", dmg: 9, cd: 0.75, range: 12 },
      { lvl: 2, cost: "Max Lvl", dmg: 30, cd: 0.65, range: 14 }
    ]
  },
  {
    name: "Camera Man",
    rarity: "Uncommon",
    img: "https://i.postimg.cc/RVpmzrGv/16-20260626163759.png",
    gems: 0,
    tokenValue: "0",
    shinyValue: "0",
    demand: 0,
    stability: "Underpaid",
    placeCost: 100,
    obtain: "Summon (35%)",
    upgrades: [
      { lvl: 1, cost: "Place ($100)", dmg: 25, cd: 1.25, range: 16 },
      { lvl: 2, cost: "Max Lvl", dmg: 60, cd: 1, range: 20 }
    ]
  },
  {
    name: "TV Man",
    rarity: "Rare",
    img: "https://i.postimg.cc/SxGvpcmC/16-20260701170954.png",
    gems: 1,
    tokenValue: "1",
    shinyValue: "2",
    demand: 1,
    stability: "Underpaid",
    placeCost: 200,
    obtain: "Summon (10%)",
    upgrades: [
      { lvl: 1, cost: "Place ($200)", dmg: 32, cd: 1, range: 14 },
      { lvl: 2, cost: "Max Lvl", dmg: 72, cd: 0.8, range: 18 }
    ]
  },
  {
    name: "Large Speaker Man",
    rarity: "Rare",
    img: "https://i.postimg.cc/KvwWNmJN/16-20260701170927.png",
    gems: 2,
    tokenValue: "2",
    shinyValue: "4",
    demand: 1,
    stability: "Underpaid",
    placeCost: 250,
    obtain: "Summon (10%)",
    upgrades: [
      { lvl: 1, cost: "Place ($250)", dmg: 50, cd: 0.72, range: 14 },
      { lvl: 2, cost: "Max Lvl", dmg: 92, cd: 0.66, range: 16 }
    ]
  },
  {
    name: "Camera Woman",
    rarity: "Rare",
    img: "https://i.postimg.cc/xTZ8KbSp/b3b08a564fce292a.png",
    gems: 20,
    tokenValue: "20",
    shinyValue: "40",
    demand: 6,
    stability: "Dropping",
    placeCost: 150,
    obtain: "Summon (10%)",
    upgrades: [
      { lvl: 1, cost: "Place ($150)", dmg: 48, cd: 1.2, range: 18 },
      { lvl: 2, cost: "Max Lvl", dmg: 95, cd: 1, range: 22 }
    ]
  },
  {
    name: "Large Camera Man",
    rarity: "Epic",
    img: "https://i.postimg.cc/5t1n7yvw/16-20260701171037.png",
    gems: 7,
    tokenValue: "7",
    shinyValue: "14",
    demand: 1,
    stability: "Underpaid",
    placeCost: 450,
    obtain: "Summon (4%)",
    upgrades: [
      { lvl: 1, cost: "Place ($450)", dmg: 133, cd: 1.4, range: 9 },
      { lvl: 2, cost: "Max Lvl", dmg: 385, cd: 1.1, range: 11 }
    ]
  },
  {
    name: "Large TV Man",
    rarity: "Epic",
    img: "https://i.postimg.cc/Rh3R6HrD/16-20260628175643.png",
    gems: 10,
    tokenValue: "10",
    shinyValue: "20",
    demand: 1,
    stability: "Underpaid",
    placeCost: 350,
    obtain: "Summon (4%)",
    upgrades: [
      { lvl: 1, cost: "Place ($350)", dmg: 63, cd: 1.25, range: 14 },
      { lvl: 2, cost: "Max Lvl", dmg: 155, cd: 1, range: 17 }
    ]
  },
  {
    name: "Plunger Camera Man",
    rarity: "Epic",
    img: "https://i.postimg.cc/3N5T0swc/plunger.png",
    gems: 30,
    tokenValue: "30",
    shinyValue: "60",
    demand: 6,
    stability: "Dropping",
    placeCost: 250,
    obtain: "Summon (4%)",
    upgrades: [
      { lvl: 1, cost: "Place ($250)", dmg: 72, cd: 0.8, range: 13 },
      { lvl: 2, cost: "Max Lvl", dmg: 165, cd: 0.66, range: 16 }
    ]
  },
  {
    name: "Titan Speaker Man",
    rarity: "Legendary",
    img: "https://i.postimg.cc/KYZD7VSk/16-20260701171144.png",
    gems: 70,
    tokenValue: "70",
    shinyValue: "140",
    demand: 7,
    stability: "Underpaid",
    placeCost: 1200,
    obtain: "Summon (1%)",
    upgrades: [
      { lvl: 1, cost: "Place ($1200)", dmg: 85, cd: 0.5, range: 18 },
      { lvl: 2, cost: "Max Lvl", dmg: 200, cd: 0.42, range: 22 }
    ]
  },
  {
    name: "Titan TV Man",
    rarity: "Legendary",
    img: "https://i.postimg.cc/PfcKG2YT/16-20260701171102.png",
    gems: 65,
    tokenValue: "65",
    shinyValue: "130",
    demand: 6,
    stability: "Underpaid",
    placeCost: 2000,
    obtain: "Summon (1%)",
    upgrades: [
      { lvl: 1, cost: "Place ($2000)", dmg: 20, cd: 0.3, range: 16 },
      { lvl: 2, cost: "Max Lvl", dmg: 28, cd: 0.1, range: 19 }
    ]
  },
  {
    name: "Titan Speaker Man 2.0",
    rarity: "Mythic",
    img: "https://i.postimg.cc/htqgBZrg/image.png",
    gems: 1900,
    tokenValue: "1,900",
    shinyValue: "3,800",
    demand: 8,
    stability: "Stable",
    placeCost: 1500,
    obtain: "Summon (0.1%)",
    upgrades: [
      { lvl: 1, cost: "Place ($1500)", dmg: 450, cd: 0.4, range: 25 },
      { lvl: 2, cost: "Max Lvl", dmg: 1400, cd: 0.3, range: 30 }
    ]
  },
  {
    name: "Titan Camera Man",
    rarity: "Exclusive",
    img: "https://i.postimg.cc/44b4qFry/16-20260701171125.png",
    gems: 850,
    tokenValue: "850",
    shinyValue: "1,700",
    demand: 8,
    stability: "Stable",
    placeCost: 1400,
    obtain: "Summon (Exclusive)",
    upgrades: [
      { lvl: 1, cost: "Place ($1400)", dmg: 220, cd: 1.6, range: 20 },
      { lvl: 2, cost: "Max Lvl", dmg: 600, cd: 1.33, range: 25 }
    ]
  },
  {
    name: "Scientist Camera Man",
    rarity: "Exclusive",
    img: "https://i.postimg.cc/MGjsYrkV/dsadsad.png",
    gems: 120,
    tokenValue: "120",
    shinyValue: "240",
    demand: 10,
    stability: "Fluctuating",
    placeCost: 200,
    obtain: "Exclusive",
    upgrades: [
      { lvl: 1, cost: "Place ($200)", income: 50, cd: 1, range: 0 },
      { lvl: 2, cost: "Max Lvl", income: 600, cd: 1, range: 0 }
    ]
  },
  {
    name: "Large Scientist Camera Man",
    rarity: "Exclusive",
    img: "https://i.postimg.cc/BQqVGgFz/sdasa.png",
    gems: 250,
    tokenValue: "250",
    shinyValue: "500",
    demand: 8,
    stability: "Overpaid",
    placeCost: 250,
    obtain: "Exclusive",
    upgrades: [
      { lvl: 1, cost: "Place ($250)", dmg: 96, hp: 10, cd: 1, range: 15 },
      { lvl: 2, cost: "Max Lvl", dmg: 220, hp: 55, cd: 0.88, range: 17 }
    ]
  },
  {
    name: "Engineer Camera Man",
    rarity: "Exclusive",
    img: "https://i.postimg.cc/902N0Pny/c4a50767ee15cdb9.png",
    gems: 31800,
    tokenValue: "31,800",
    shinyValue: "63,600",
    demand: 10,
    stability: "Rising",
    placeCost: 250,
    obtain: "Exclusive",
    upgrades: [
      { lvl: 1, cost: "Place ($250)", dmg: 0, cd: 15, range: 0 },
      { lvl: 2, cost: "Max Lvl", dmg: 0, cd: 12, range: 0 }
    ]
  },
  {
    name: "TV Woman",
    rarity: "Exclusive",
    img: "https://i.postimg.cc/SxGvpcmC/16-20260701170954.png",
    gems: 950,
    tokenValue: "950",
    shinyValue: "1,900",
    demand: 7,
    stability: "Stable",
    placeCost: 300,
    obtain: "Exclusive",
    upgrades: [
      { lvl: 1, cost: "Place ($300)", dmg: 50, cd: 1, range: 16 },
      { lvl: 2, cost: "Max Lvl", dmg: 180, cd: 0.8, range: 20 }
    ]
  },
  {
    name: "Party Camera Man",
    rarity: "Event",
    img: "https://i.postimg.cc/76nnBFmQ/66b5c7bab6d6d110.png",
    gems: 10,
    tokenValue: "10",
    shinyValue: "20",
    demand: 4,
    stability: "Stable",
    placeCost: 125,
    obtain: "Event",
    upgrades: [
      { lvl: 1, cost: "Place ($125)", dmg: 20, cd: 1.05, range: 8 },
      { lvl: 2, cost: "Max Lvl", dmg: 50, cd: 0.82, range: 12 }
    ]
  },
  {
    name: "Jester Speaker Man",
    rarity: "Event",
    img: "https://i.postimg.cc/9FVvQ26x/6f38878d1806a413.png",
    gems: 20,
    tokenValue: "20",
    shinyValue: "40",
    demand: 4,
    stability: "Stable",
    placeCost: 250,
    obtain: "Event",
    upgrades: [
      { lvl: 1, cost: "Place ($250)", dmg: 24, cd: 1.05, range: 14 },
      { lvl: 2, cost: "Max Lvl", dmg: 72, cd: 0.72, range: 18 }
    ]
  },
  {
    name: "Party Titan TV Man",
    rarity: "Event",
    img: "https://i.postimg.cc/13RhJSMn/cd4eca2771f66a3b.png",
    gems: 5300,
    tokenValue: "5,300",
    shinyValue: "10,600",
    demand: 7,
    stability: "Unstable",
    placeCost: 1800,
    obtain: "Event",
    upgrades: [
      { lvl: 1, cost: "Place ($1800)", dmg: 22, cd: 0.3, range: 16 },
      { lvl: 2, cost: "Max Lvl", dmg: 31, cd: 0.1, range: 19 }
    ]
  },
  {
    name: "Party Crate",
    rarity: "Crate",
    img: "https://i.postimg.cc/13RhJSMn/cd4eca2771f66a3b.png",
    gems: 50,
    tokenValue: "50",
    shinyValue: "100",
    demand: 8,
    stability: "Stable",
    placeCost: 0,
    obtain: "Party Event Quests & Rewards",
    crateDrops: [
      { name: "Party Camera Man", chance: "50%", chanceNum: 50, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Event" },
      { name: "Jester Speaker Man", chance: "40%", chanceNum: 40, barColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]", rarity: "Event" },
      { name: "Party Titan TV Man", chance: "10%", chanceNum: 10, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Event" }
    ]
  },
  {
    name: "Scientist Crate",
    rarity: "Crate",
    img: "https://i.postimg.cc/MGjsYrkV/dsadsad.png",
    gems: 100,
    tokenValue: "100",
    shinyValue: "200",
    demand: 7,
    stability: "Stable",
    placeCost: 0,
    obtain: "Shop / Summon",
    crateDrops: [
      { name: "Scientist Camera Man", chance: "60%", chanceNum: 60, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Exclusive" },
      { name: "Large Scientist Camera Man", chance: "39%", chanceNum: 39, barColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]", rarity: "Exclusive" },
      { name: "Engineer Camera Man", chance: "1%", chanceNum: 1, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Exclusive" }
    ]
  },
  {
    name: "Free Scientist Crate",
    rarity: "Crate",
    img: "https://i.postimg.cc/MGjsYrkV/dsadsad.png",
    gems: 0,
    tokenValue: "0/C",
    shinyValue: "0",
    demand: 5,
    stability: "Stable",
    placeCost: 0,
    obtain: "Free Daily Reward",
    crateDrops: [
      { name: "Scientist Camera Man", chance: "60%", chanceNum: 60, barColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]", rarity: "Exclusive" },
      { name: "Large Scientist Camera Man", chance: "39.9%", chanceNum: 39.9, barColor: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]", rarity: "Exclusive" },
      { name: "Engineer Camera Man", chance: "0.1%", chanceNum: 0.1, barColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]", rarity: "Exclusive" }
    ]
  }
];

export const sd: Staff[] = [
  { name: "MrUpTime", role: "Owner", sign: "The_DevUpTime", percent: 200, avatar: "🛠" },
  { name: "petcch", role: "dev", sign: "georga123zxc", percent: 75, avatar: "🛠" },
  { name: "heroEr777rew", role: "dev", sign: "heroEr777rew", percent: 75, avatar: "🛠" },
  { name: "nullpyy", role: "admin", sign: "nullpyy", percent: 75, avatar: "🛡️" },
  { name: "Clover", role: "ValueMaker", sign: "bropksknife", percent: 40, avatar: "👑" },
  { name: "byFrosTy", role: "ValueMaker", sign: "begzod2211", percent: 40, avatar: "👑" },
  { name: "andrianstet1111", role: "manager", sign: "andrianstet1111", percent: 30, avatar: "💼" },
  { name: "Merezek", role: "partner", sign: "Merezek", percent: 25, avatar: "⭐" },
  { name: "tatahi_5", role: "partner", sign: "tatahi_5", percent: 25, avatar: "⭐" },
  { name: "Bengerman2010", role: "partner", sign: "Bengerman2010", percent: 25, avatar: "⭐" },
  { name: "Oktawian_jestem2012", role: "partner", sign: "Oktawian_jestem2012", percent: 25, avatar: "⭐" },
  { name: "ender45638372", role: "partner", sign: "ender45638372", percent: 25, avatar: "⭐" },
  { name: "Elfenix774", role: "partner", sign: "Elfenix774", percent: 25, avatar: "⭐" },
  { name: "jonepreston123456o", role: "partner", sign: "jonepreston123456o", percent: 20, avatar: "⭐" },
  { name: "WARDENBLUEEE", role: "partner", sign: "WARDENBLUEEE", percent: 20, avatar: "⭐" },
  { name: "FOX91234TH", role: "partner", sign: "FOX91234TH", percent: 15, avatar: "⭐" },
  { name: "LOSPAPUS760", role: "partner", sign: "LOSPAPUS760", percent: 15, avatar: "⭐" },
  { name: "Vito_egds", role: "partner", sign: "Vito_egds", percent: 15, avatar: "⭐" },
  { name: "KATACNK_3", role: "partner", sign: "KATACNK_3", percent: 15, avatar: "⭐" },
  { name: "imrunningrun", role: "partner", sign: "imrunningrun", percent: 15, avatar: "⭐" },
  { name: "undertedd4", role: "partner", sign: "undertedd4", percent: 15, avatar: "⭐" },
  { name: "actv_arnold", role: "partner", sign: "actv_arnold", percent: 15, avatar: "⭐" },
  { name: "Maxpoh2013", role: "partner", sign: "Maxpoh2013", percent: 15, avatar: "⭐" },
  { name: "llshadowBonnie", role: "partner", sign: "llshadowBonnie", percent: 15, avatar: "⭐" },
  { name: "marliconwespa", role: "partner", sign: "marliconwespa", percent: 15, avatar: "⭐" },
  { name: "DealerzinBr", role: "partner", sign: "DealerzinBr", percent: 15, avatar: "⭐" },
  { name: "GREENFN_KASH", role: "partner", sign: "GREENFN_KASH", percent: 15, avatar: "⭐" },
  { name: "XMRSHADOW2", role: "partner", sign: "XMRSHADOW2", percent: 15, avatar: "⭐" },
  { name: "Notponryt", role: "partner", sign: "Notponryt", percent: 15, avatar: "⭐" },
  { name: "FinishTimeTT", role: "partner", sign: "FinishTimeTT", percent: 15, avatar: "⭐" }
];

export const wS = (roleStr: string) => {
  let l = roleStr.toLowerCase().substring(0, 50).replace(/\s+|_|-/g, "");
  return l === "valuemaker" || l === "valuemakers" ? "valuemaker"
    : l === "serveradmin" || l === "serveradmins" || l === "admin" || l === "admins" ? "admin"
    : l === "gamecontributor" || l === "gamecontributors" || l === "contributor" || l === "contributors" ? "contributor"
    : l === "developer" || l === "developers" || l === "dev" || l === "devs" ? "dev"
    : l === "owner" || l === "owners" ? "owner"
    : l === "partnermanager" || l === "manager" || l === "managers" ? "manager"
    : l === "tester" || l === "testers" ? "tester"
    : l === "partner" || l === "partners" ? "partner"
    : l;
};

export const SS: Record<string, string> = {
  owner: "Owner",
  dev: "Developer",
  manager: "Manager",
  admin: "Server Admin",
  contributor: "Game Contributor",
  tester: "Tester",
  valuemaker: "Value Maker",
  partner: "Partner"
};

export const TS: Record<string, string> = {
  owner: "#3b82f6",
  dev: "#14b8a6",
  manager: "#ec4899",
  admin: "#f97316",
  contributor: "#818cf8",
  tester: "#a855f7",
  valuemaker: "#eab308",
  partner: "#ef4444"
};

export const Hl: SignValue[] = [
  { name: "None", percent: 0, role: "No Sign", color: "#888888" },
  { name: "The_DevUpTime", percent: 200, role: "Owner", color: "#3b82f6" },
  { name: "georga123zxc", percent: 75, role: "Developer", color: "#14b8a6" },
  { name: "heroEr777rew", percent: 75, role: "Developer", color: "#14b8a6" },
  { name: "nullpyy", percent: 75, role: "Admin", color: "#f97316" },
  { name: "bropksknife", percent: 40, role: "Value Maker", color: "#eab308" },
  { name: "begzod2211", percent: 40, role: "Value Maker", color: "#eab308" },
  { name: "andrianstet1111", percent: 30, role: "Partner Manager", color: "#ec4899" },
  { name: "Merezek", percent: 25, role: "Partner", color: "#ef4444" },
  { name: "tatahi_5", percent: 25, role: "Partner", color: "#ef4444" },
  { name: "Bengerman2010", percent: 25, role: "Partner", color: "#ef4444" },
  { name: "Oktawian_jestem2012", percent: 25, role: "Partner", color: "#ef4444" },
  { name: "ender45638372", percent: 25, role: "Partner", color: "#ef4444" },
  { name: "Elfenix774", percent: 25, role: "Partner", color: "#ef4444" },
  { name: "jonepreston123456o", percent: 20, role: "Partner", color: "#ef4444" },
  { name: "WARDENBLUEEE", percent: 20, role: "Partner", color: "#ef4444" },
  { name: "FOX91234TH", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "LOSPAPUS760", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "Vito_egds", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "KATACNK_3", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "imrunningrun", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "undertedd4", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "actv_arnold", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "Maxpoh2013", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "llshadowBonnie", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "marliconwespa", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "DealerzinBr", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "GREENFN_KASH", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "XMRSHADOW2", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "Notponryt", percent: 15, role: "Partner", color: "#ef4444" },
  { name: "FinishTimeTT", percent: 15, role: "Partner", color: "#ef4444" }
];

export const ug = [
  { id: "partner", name: "Partners", class: "border-red-500 text-red-400" },
  { id: "valuemaker", name: "Value Makers", class: "border-yellow-400 text-yellow-300" },
  { id: "tester", name: "Testers", class: "border-purple-500 text-purple-400" },
  { id: "contributor", name: "Game Contributors", class: "border-indigo-400 text-indigo-300" },
  { id: "dev", name: "Developers", class: "border-teal-400 text-teal-300" },
  { id: "admin", name: "Server Admins", class: "border-orange-400 text-orange-300" },
  { id: "manager", name: "Managers", class: "border-pink-500 text-pink-400" },
  { id: "owner", name: "Owners", class: "border-blue-500 text-blue-400" }
];

export const Gl: UpdateLog[] = [
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
