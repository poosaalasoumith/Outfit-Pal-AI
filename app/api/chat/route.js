import { NextResponse } from 'next/server';

import { GoogleGenAI } from '@google/genai';
import { loadDataset } from "../../lib/loadDataset";
import sharp from "sharp";


const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

if (!global.outfitMemory) global.outfitMemory = [];
if (!global.userProfile) {
  global.userProfile = {
    likedColors: {},
    likedStyles: {},
    dislikedItems: new Set()
  };
}
if (!global.savedOutfits) global.savedOutfits = [];
if (!global.outfitHistory) global.outfitHistory = [];

function saveOutfit(outfit) {
  global.savedOutfits.push(outfit);
  global.savedOutfits = global.savedOutfits.slice(-50);
}

function addToHistory(outfit) {
  global.outfitHistory.push(outfit);
  global.outfitHistory = global.outfitHistory.slice(-100);
}

// These functions could be exposed via separate endpoints later to capture user interactions
function likeItem(item) {
  if (!item) return;
  if (item.color) global.userProfile.likedColors[item.color] = (global.userProfile.likedColors[item.color] || 0) + 1;
  if (item.style) global.userProfile.likedStyles[item.style] = (global.userProfile.likedStyles[item.style] || 0) + 1;
}
function dislikeItem(item) {
  if (item?.id) global.userProfile.dislikedItems.add(item.id);
}

const styleGroups = {
  casual: ["casual"],
  formal: ["formal"],
  party: ["party"],
  streetwear: ["streetwear", "casual"],
  sporty: ["sports"]
};

function getColorGroup(color) {
  if (!color) return "neutral";
  const c = color.toLowerCase();

  if (["black","white","grey","beige","navy"].includes(c)) return "neutral";
  if (["red","orange","yellow"].includes(c)) return "warm";
  if (["blue","green","purple"].includes(c)) return "cool";

  return "neutral";
}

function getOutfitSignature(outfit) {
  const styles = [
    outfit.top.style,
    outfit.bottom.style,
    outfit.shoes.style
  ];

  const colors = [
    getColorGroup(outfit.top.color),
    getColorGroup(outfit.bottom.color),
    getColorGroup(outfit.shoes.color)
  ];

  return {
    style: styles.sort().join("-"),
    color: colors.sort().join("-")
  };
}

const fallbackImages = {
  top: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
  bottom: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
  shoes: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80"
};

function getFallbackImage() {
  return fallbackImages.top;
}

function validateImage(product) {
  if (!product.image || product.image.includes("unsplash.com/source")) {
    return fallbackImages[product.category] || fallbackImages.top;
  }
  return product.image;
}

function mapToDataset(ragItem) {
  const name = (ragItem.outfit_name || ragItem.name || '').toLowerCase();

  const match = fashionDataset.find(item =>
    name.includes(item.color) ||
    name.includes(item.style) ||
    name.includes(item.category)
  );

  return {
    id: ragItem.id || Math.random().toString(),
    name: ragItem.outfit_name || ragItem.name || 'Unknown',
    brand: ragItem.brand || 'Unknown Brand',
    price: parseFloat(ragItem.price) || 100, // Make sure price is a number
    image: match ? match.image : getFallbackImage(),
    category: match ? match.category : "top",
    style: match ? match.style : "casual",
    occasion: match ? match.style : "casual",
    color: match ? match.color : "neutral",
    rating: parseFloat(ragItem.rating) || 4.5
  };
}

function detectIntent(query) {
  const q = query.toLowerCase();
  return {
    occasion: 
      q.includes("party") ? "party" :
      q.includes("date") ? "date" :
      q.includes("work") || q.includes("formal") ? "formal" :
      q.includes("gym") || q.includes("sports") ? "sports" :
      "casual",
    colorPreference:
      q.includes("black") ? "black" :
      q.includes("white") ? "white" :
      q.includes("blue") ? "blue" :
      q.includes("colorful") ? "colorful" :
      null,
    vibe:
      q.includes("cool") ? "cool" :
      q.includes("elegant") ? "formal" :
      q.includes("street") ? "streetwear" :
      "casual"
  };
}

function detectBudget(query) {
  // Regex to match "under $100", "50", "budget 150"
  const match = query.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

async function getDominantColor(buffer) {
  const { data } = await sharp(buffer)
    .resize(50, 50)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0, g = 0, b = 0;
  const totalPixels = data.length / 3;

  for (let i = 0; i < data.length; i += 3) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  r = Math.round(r / totalPixels);
  g = Math.round(g / totalPixels);
  b = Math.round(b / totalPixels);

  return { r, g, b };
}

function mapColor({ r, g, b }) {
  if (r < 80 && g < 80 && b < 80) return "black";
  if (r > 200 && g > 200 && b > 200) return "white";
  if (b > r && b > g) return "blue";
  if (g > r && g > b) return "green";
  if (r > g && r > b) return "red";
  return "neutral";
}

function createEmbedding({ r, g, b }) {
  return [r / 255, g / 255, b / 255]; // normalized vector
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

function scoreCombination(top, bottom, shoe, intent, budget) {
  let score = 0;

  const items = [top, bottom, shoe];

  // 1. BASE SCORE
  score += items.reduce((sum, i) => sum + (i.rating || 4.5), 0) * 1.2;

  // 2. HARD STYLE MATCH BOOST
  if (top.style === intent.occasion) score += 20;
  if (bottom.style === intent.occasion) score += 20;
  if (shoe.style === intent.occasion) score += 20;

  // 3. COLOR MATCH
  if (top.color === bottom.color) score += 10;

  // 4. RANDOMNESS FOR VARIETY
  score += Math.random() * 5;

  // 5. USER PREFERENCES
  items.forEach(item => {
    if (global.userProfile.likedColors[item.color]) score += 10;
    if (global.userProfile.likedStyles[item.style]) score += 10;

    if (global.userProfile.dislikedItems.has(item.id)) score -= 50;
  });

  // 6. BUDGET
  if (budget) {
    const total = items.reduce((sum, i) => sum + (i.price || 100), 0);
    if (total <= budget) score += 20;
    else score -= 20;
  }

  // 7. DIVERSITY
  if (global.outfitMemory && global.outfitMemory.includes(top.id)) score -= 30;

  return score;
}

function filterByIntent(products, intent) {
  return products.filter(p => {
    // HARD FILTER (not optional)
    if (intent.occasion && p.style !== intent.occasion) return false;

    return true;
  });
}

function expandCategory(category, intent) {
  return fashionDataset.filter(p =>
    p.category === category &&
    p.style === intent.occasion
  );
}

export async function GET(req) {
  return NextResponse.json({
    saved: global.savedOutfits || [],
    history: global.outfitHistory || []
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Check if this is just an action request (like saving an outfit)
    if (body.action === 'save_outfit') {
      saveOutfit(body.outfit);
      if (body.outfit.top) likeItem(body.outfit.top);
      if (body.outfit.bottom) likeItem(body.outfit.bottom);
      if (body.outfit.shoes) likeItem(body.outfit.shoes);
      return NextResponse.json({ success: true, saved: global.savedOutfits });
    }
    
    if (body.action === 'dislike_outfit') {
      if (body.outfit.top) dislikeItem(body.outfit.top);
      if (body.outfit.bottom) dislikeItem(body.outfit.bottom);
      if (body.outfit.shoes) dislikeItem(body.outfit.shoes);
      return NextResponse.json({ success: true });
    }

    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const latestMessage = typeof messages[messages.length - 1].content === 'string'
      ? messages[messages.length - 1].content
      : JSON.stringify(messages[messages.length - 1].content);

    const products = await loadDataset();

    function extractIntent(query) {
      const q = query.toLowerCase();

      if (q.includes("festival")) return { style: "festival" };
      if (q.includes("gym")) return { style: "sports" };
      if (q.includes("formal")) return { style: "formal" };

      return { style: "casual" };
    }

    const intent = extractIntent(latestMessage);

    function isValidProduct(p) {
      if (!p.name) return false;
      const n = p.name.toLowerCase();

      if (p.category === "top") return /shirt|kurta|top|jacket|blouse/.test(n);
      if (p.category === "bottom") return /pant|jean|trouser|skirt/.test(n);
      if (p.category === "shoes") return /shoe|sneaker|heel|sandal/.test(n);

      return false;
    }

    let validProducts = products.filter(isValidProduct);

    function matchStyle(p, intent) {
      const n = p.name ? p.name.toLowerCase() : "";

      if (intent.style === "festival") {
        return /kurta|ethnic|traditional|festive/.test(n);
      }

      if (intent.style === "sports") {
        return /sport|gym|track|training/.test(n);
      }

      if (intent.style === "formal") {
        return /formal|blazer|office/.test(n);
      }

      return true;
    }

    let filtered = validProducts.filter(p => matchStyle(p, intent));

    let tops = filtered.filter(p => p.category === "top");
    let bottoms = filtered.filter(p => p.category === "bottom");
    let shoes = filtered.filter(p => p.category === "shoes");

    if (tops.length === 0) tops = validProducts.filter(p => p.category === "top");
    if (bottoms.length === 0) bottoms = validProducts.filter(p => p.category === "bottom");
    if (shoes.length === 0) shoes = validProducts.filter(p => p.category === "shoes");

    function getFallbackItem(type, style) {
      const fallbackImages = {
        top: [
          "1550614000-4b95d4e1db32"
        ],
        bottom: [
          "1542272604-787c3835535d",
          "1584865288642-4ce26eff3471",
          "1594633312681-425c7b34bec9"
        ],
        shoes: [
          "1549298916-b41d501d3772",
          "1595950653106-6c9ebd61f561",
          "1608231387042-66d1773070a5"
        ]
      };
      const images = fallbackImages[type] || fallbackImages.top;
      const randomImg = images[Math.floor(Math.random() * images.length)];

      return {
        id: `fallback-${Math.random()}`,
        name: `AI Curated ${style} ${type}`,
        brand: 'Stylist Selection',
        price: Math.floor(Math.random() * 50) + 40,
        rating: 4.5,
        category: type,
        style: style,
        image: `https://images.unsplash.com/photo-${randomImg}?auto=format&fit=crop&w=600&q=80`
      };
    }

    if (tops.length === 0) {
      tops.push(getFallbackItem("top", intent.style));
    }

    if (bottoms.length === 0) {
      bottoms.push(getFallbackItem("bottom", intent.style));
    }

    if (shoes.length === 0) {
      shoes.push(getFallbackItem("shoes", intent.style));
    }

    function shuffle(arr) {
      return arr.sort(() => Math.random() - 0.5);
    }

    shuffle(tops);
    shuffle(bottoms);
    shuffle(shoes);

    const seed = Date.now();

    function randIndex(arr, i) {
      if (!arr || arr.length === 0) return 0;
      return (i + seed) % arr.length;
    }

    const outfits = [];

    for (let i = 0; i < 3; i++) {
      outfits.push({
        top: tops[randIndex(tops, i)],
        bottom: bottoms[randIndex(bottoms, i + 1)],
        shoes: shoes[randIndex(shoes, i + 2)]
      });
    }

    const unique = [];
    const seen = new Set();

    for (let o of outfits) {
      if (!o.top || !o.bottom || !o.shoes) continue;
      const key = `${o.top.id}-${o.bottom.id}-${o.shoes.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({ outfit: o });
      }
    }

    return NextResponse.json({
      message: "Here are outfits curated from real products",
      outfits: unique
    });

  } catch (error) {
    console.error("Outer Request Error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
