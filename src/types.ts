export interface Participant {
  id: string;
  name: string;
  color: string;
  weight: number; // For the "Size" column
  active: boolean; // For the checkmark toggle column
  score?: number; // Score count field
  isCheat?: boolean; // For the cheat system selection
}

export interface Winner {
  id: string;
  name: string;
  timestamp: string;
}

export const WHEEL_COLORS = [
  "#FF5A5F", // Coral Red
  "#3A86FF", // Royal Blue
  "#FFBE0B", // Bright Yellow
  "#8338EC", // Neon Purple
  "#06D6A0", // Mint Green
  "#FF006E", // Hot Pink
  "#A2D2FF", // Sky Blue
  "#FB5607", // Vivid Orange
  "#2EC4B6", // Turquoise
  "#E63946", // Imperial Red
  "#457B9D", // Steel Blue
  "#A8DADC", // Pale Mint
  "#1D3557", // Deep Navy
  "#F1FAEE"  // Cream White
];

export const SAMPLE_LISTS = [
  {
    title: "لیست نمونه ۱ (پیش‌فرض)",
    items: ["مهرداد", "فاطمه", "امیر", "سارا", "رضا", "مریم", "علیرضا", "الناز"]
  },
  {
    title: "قرعه‌کشی ناهار",
    items: ["پیتزا", "کباب", "قرمه‌سبزی", "سالاد", "برگر", "ساندویچ", "فست‌فود", "دیزی"]
  },
  {
    title: "بازی جرئت یا حقیقت",
    items: ["جرئت ۱", "جرئت ۲", "حقیقت ۱", "حقیقت ۲", "جرئت ۳", "حقیقت ۳"]
  }
];
