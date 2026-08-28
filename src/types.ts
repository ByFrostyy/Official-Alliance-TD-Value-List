export interface Upgrade {
  lvl: number;
  cost: string;
  dmg?: number | string;
  cd?: number;
  range?: number;
  hp?: number;
  income?: number;
  // 3 Booster Buff categories
  dmgBuff?: string;   // Damage Buff (e.g. "+25%" or "25%")
  rangeBuff?: string; // Range Buff (e.g. "+15%" or "15%")
  speedBuff?: string; // Attack Speed Buff (e.g. "+20%" or "20%")
  buff?: string;      // General buff
}

export interface CrateDrop {
  name: string;
  chance: string;
  chanceNum: number;
  barColor?: string;
  img?: string;
  rarity?: string;
}

export interface Unit {
  name: string;
  rarity: string; // "Basic" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic" | "Exclusive" | "Crate" | "Event"
  img: string;
  gems: number;
  demand: number;
  stability: string; // "Stable" | "Underpaid" | "Useless" | "Dropping" | "Slowly rising" | "Slowly dropping" | "Overpaid" | "Hyped" | ...
  placeCost: number;
  obtain: string;
  upgrades?: Upgrade[];
  tokenValue?: string | number;
  shinyValue?: string | number;
  crateDrops?: CrateDrop[];
}

export interface Staff {
  name: string;
  role: string;
  sign: string;
  percent: number;
  avatar: string;
  color?: string;
}

export interface SignValue {
  name: string;
  percent: number;
  role: string;
  color: string;
}

export interface Feature {
  icon: string;
  color: string;
  text: string;
}

export interface UpdateLog {
  id: string;
  title: string;
  date: string;
  tag: string;
  image: string;
  iconIsSun: boolean;
  features: Feature[];
}

export interface SavedTrade {
  id: string;
  name: string;
  yourOffer: TradeOfferItem[];
  theirOffer: TradeOfferItem[];
  yourGems: number;
  theirGems: number;
  yourTotal: number;
  theirTotal: number;
  date: string;
}

export interface TradeOfferItem {
  unit: Unit;
  sign: SignValue;
  qty: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  status: "planned" | "in-progress" | "completed";
  date: string;
  description: string;
  icon?: string;
  image?: string;
  features: string[];
}

export interface TeaserImage {
  url: string;
  title?: string;
  description?: string;
}

export interface CountdownConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  targetDate: string;
  startDate?: string;
  description?: string;
  bannerImage?: string;
  teaserImages?: TeaserImage[];
}
