import type {
  TicketCategory,
  TicketPriority,
} from "@/app/(app)/service-requests/_stubs/constants";
import { CATEGORY_DEPARTMENT } from "./routing";
import type { TriageInput, TriageResult } from "./schema";

/**
 * Keyword fallback used when the model is unavailable, slow or returns
 * something invalid. Listed in tie-break order: on an equal score the earlier
 * category wins. HOSTEL words weigh less so a concrete fault ("fan in my hostel
 * room") is routed to the trade that fixes it.
 */
const CATEGORY_KEYWORDS: { category: TicketCategory; weight: number; words: string[] }[] = [
  {
    category: "NETWORK",
    weight: 1,
    words: ["wifi", "wi-fi", "internet", "lan", "ethernet", "network", "router", "access point"],
  },
  {
    category: "AV_EQUIPMENT",
    weight: 1,
    words: ["projector", "speaker", "mic", "microphone", "hdmi", "vga", "audio", "sound system", "smart board", "smartboard"],
  },
  {
    category: "CLEANLINESS",
    weight: 1,
    words: ["dirty", "garbage", "trash", "dustbin", "litter", "smell", "stink", "unclean", "cockroach", "rat", "pest", "mosquito", "not cleaned", "cleaning"],
  },
  {
    category: "PLUMBING",
    weight: 1,
    words: ["leak", "leaking", "leakage", "tap", "flush", "toilet", "pipe", "drain", "clogged", "blocked", "sink", "washbasin", "cistern", "no water", "water supply", "overflow", "flooding", "flooded", "drip", "dripping", "seepage"],
  },
  {
    category: "ELECTRICAL",
    weight: 1,
    words: ["fan", "light", "tube light", "bulb", "switch", "socket", "plug point", "power", "wiring", "mcb", "electricity", "voltage", "ac", "air conditioner", "air conditioning"],
  },
  {
    category: "FURNITURE",
    weight: 1,
    words: ["chair", "desk", "bench", "table", "cupboard", "almirah", "shelf", "rack", "wardrobe", "bed", "mattress", "drawer", "locker", "whiteboard"],
  },
  {
    category: "HOSTEL",
    weight: 0.5,
    words: ["hostel", "mess", "warden", "laundry", "dorm", "dormitory"],
  },
];

/** Signs of danger or damage spreading. Any match makes the ticket URGENT. */
export const URGENT_KEYWORDS = [
  "spark",
  "sparks",
  "sparking",
  "smoke",
  "flooding",
  "flooded",
  "fire",
  "burning smell",
  "short circuit",
  "electric shock",
  "live wire",
  "gas leak",
];

const HIGH_KEYWORDS = [
  "no power",
  "power cut",
  "power outage",
  "no water",
  "whole floor",
  "whole building",
  "entire floor",
  "entire building",
  "all rooms",
  "exam",
  "outage",
];

const LOW_KEYWORDS = ["minor", "small", "loose", "squeak", "squeaky", "cosmetic", "paint", "scratch", "wobbly", "not urgent"];

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word match that also accepts a plain plural ("lights", "taps"). */
function mentions(text: string, word: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}(s|es)?(?=[^a-z0-9]|$)`).test(text);
}

function priorityFor(text: string): TicketPriority {
  if (URGENT_KEYWORDS.some((word) => mentions(text, word))) return "URGENT";
  if (HIGH_KEYWORDS.some((word) => mentions(text, word))) return "HIGH";
  if (LOW_KEYWORDS.some((word) => mentions(text, word))) return "LOW";
  return "MEDIUM";
}

export function triageByRules(input: TriageInput): TriageResult {
  const text = `${input.title}\n${input.description}`.toLowerCase();

  let best: { category: TicketCategory; score: number } = { category: "OTHER", score: 0 };
  for (const rule of CATEGORY_KEYWORDS) {
    const score = rule.words.filter((word) => mentions(text, word)).length * rule.weight;
    if (score > best.score) best = { category: rule.category, score };
  }

  const confidence = best.score === 0 ? 0.2 : best.score >= 2 ? 0.7 : 0.5;
  return {
    category: best.category,
    priority: priorityFor(text),
    departmentCode: CATEGORY_DEPARTMENT[best.category],
    confidence,
    source: "rules",
  };
}
