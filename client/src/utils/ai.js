// client/src/utils/ai.js

import { GoogleGenerativeAI } from '@google/generative-ai';

// -------- V3: Google AI (Gemini) Setup --------
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let genAI;
let model;

// Initialize the model only if the API key is available
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-pro" });
} else {
  console.warn("VITE_GEMINI_API_KEY not found. AI features will be disabled.");
}

// -------- V2 Helpers (Kept for fallback and structure) --------
const catAliases = {
  'home-decor': 'home décor',
  'home decor': 'home décor',
  'jewelry': 'jewelry',
  'paintings': 'wall art',
  'crafts': 'handicraft',
  'stationery': 'stationery',
  'pottery': 'pottery',
  'textiles': 'textiles'
};

function normCat(category = '') {
  const key = String(category || '').toLowerCase();
  return catAliases[key] || (key || 'handmade');
}

function styleGuide(tone = 'warm') {
  switch (tone) {
    case 'luxury':
      return { voice: 'Refined, elegant, and detail‑oriented', line: 'Elegantly crafted with meticulous attention to detail.' };
    case 'playful':
      return { voice: 'Vibrant, friendly, and upbeat', line: 'Fun, vibrant, and full of personality.' };
    case 'earthy':
      return { voice: 'Natural, grounded, and artisan‑led', line: 'Rooted in natural textures and mindful craftsmanship.' };
    default:
      return { voice: 'Warm, approachable, and crafted', line: 'Thoughtfully made in small batches by local artisans.' };
  }
}

function phraseOccasion(occ = '') {
  const s = String(occ || '').toLowerCase();
  if (!s) return '';
  const map = {
    birthday: 'birthdays',
    anniversary: 'anniversaries',
    housewarming: 'housewarming',
    diwali: 'Diwali gifting',
    christmas: 'Christmas',
    mothers: "Mother’s Day",
    fathers: "Father’s Day"
  };
  const key = Object.keys(map).find(k => s.includes(k));
  return key ? map[key] : s;
}

function listify(arr, limit = 4) {
  const a = (arr || []).map(x => String(x).trim()).filter(Boolean);
  return a.slice(0, limit).join(', ');
}

export function buildFeatures(spec = {}) {
  const { materials = [], size, dimensions, weight, care, color, style, audience, occasion, origin, eco, handmade } = spec;
  const out = [];
  if (materials?.length) out.push(`Materials: ${listify(materials, 5)}`);
  if (dimensions) out.push(`Dimensions: ${dimensions}`);
  else if (size) out.push(`Size: ${size}`);
  if (weight) out.push(`Weight: ${weight}`);
  if (color) out.push(`Color: ${color}`);
  if (style) out.push(`Style: ${style}`);
  if (audience) out.push(`Ideal for: ${audience}`);
  if (occasion) out.push(`Occasion: ${phraseOccasion(occasion)}`);
  if (care) out.push(`Care: ${care}`);
  if (origin) out.push(`Origin: ${origin}`);
  if (eco) out.push('Eco‑friendly materials');
  if (handmade) out.push('Handmade, each piece is unique');
  return out;
}

// -------- V3: AI-Powered Description Generator --------
/**
 * Generates a product description using the Google Gemini API.
 * @param {object} productData - The product data.
 * @returns {Promise<{description: string, features: string[]}>}
 */
export async function generateProductDescriptionV3_AI(productData) {
  if (!model) {
    console.log("AI model not initialized. Falling back to V2 generator.");
    return generateProductDescriptionV2(productData);
  }

  const { title, category, materials, tone = 'warm', useCase, keywords, spec } = productData;

  const prompt = `
    You are an expert e-commerce copywriter for a marketplace called "ArtisanHaat" that sells unique, handmade goods from India.
    Your task is to write a compelling product description.

    **Instructions:**
    1.  Adopt a ${tone} and inviting tone.
    2.  The description should be 2-3 paragraphs long.
    3.  Create a bulleted list of 3-5 key highlights or features.
    4.  The final output MUST be a valid JSON object.

    **Product Details:**
    - Title: ${title}
    - Category: ${normCat(category)}
    - Materials: ${listify(materials, 5)}
    - Primary Use Case: ${useCase || 'Not specified'}
    - Keywords: ${listify(keywords, 6)}
    - Additional Specs: ${JSON.stringify(spec)}

    **Output Format (JSON only):**
    {
      "description": "A 2-3 paragraph, engaging and creative product description goes here. Weave in the product details naturally.",
      "features": [
        "Feature 1: Highlight a key material or benefit.",
        "Feature 2: Mention its ideal use case or style.",
        "Feature 3: Emphasize the handmade or unique quality.",
        "Feature 4: Add another compelling detail from the specs."
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim(); // Clean up potential markdown
    const parsed = JSON.parse(text);
    
    // Basic validation of the parsed object
    if (parsed.description && Array.isArray(parsed.features)) {
      return parsed;
    } else {
      throw new Error("AI response did not match the expected format.");
    }

  } catch (error) {
    console.error("Error calling Gemini API for description:", error);
    console.log("Falling back to V2 template-based generator.");
    // Fallback to the reliable rules-based generator on API error
    return generateProductDescriptionV2(productData);
  }
}


// -------- V3: AI-Powered Assistant Query Parser --------
/**
 * Converts a natural language query to a filter object using the Google Gemini API.
 * @param {string} input - The user's search query.
 * @returns {Promise<object>}
 */
export async function recommendQueryToFiltersV3_AI(input) {
  if (!model) {
    console.log("AI model not initialized. Falling back to V2 parser.");
    return recommendQueryToFiltersV2(input);
  }

  const prompt = `
    You are an intelligent search API for an Indian e-commerce website selling artisan goods.
    Your task is to parse a user's natural language query and convert it into a structured JSON object of filters.

    **Available Filters & Schema:**
    - category: string (must be one of: 'jewelry', 'paintings', 'home-decor', 'crafts', 'stationery', 'pottery', 'textiles')
    - minPrice: number
    - maxPrice: number
    - search: string (a general search query string derived from important keywords in the user's text)
    - _facets: object (contains arrays of specific tags)
        - materials: string[] (e.g., 'silver', 'clay', 'wood')
        - styles: string[] (e.g., 'minimalist', 'boho', 'rustic')
        - occasion: string[] (e.g., 'birthday', 'diwali')

    **Instructions:**
    1. Analyze the user's query below.
    2. Extract relevant information and map it to the JSON schema.
    3. The currency is Indian Rupees (₹, Rs).
    4. Be intelligent about context (e.g., "cheap" or "affordable" might mean maxPrice: 1000).
    5. Prioritize extracting specific entities into the facets.
    6. Your response must be ONLY the valid JSON object. Do not include any other text or markdown.

    **User Query:** "${input}"

    **JSON Output:**
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error calling Gemini API for query parsing:", error);
    console.log("Falling back to V2 regex-based parser.");
    // Fallback to the reliable rules-based parser on API error
    return recommendQueryToFiltersV2(input);
  }
}


// -------- V2: Original Template-Based Description Generator (Fallback) --------
export function generateProductDescriptionV2(productData) {
  const { title, category, materials = [], tone = 'warm', useCase = '', keywords = [], spec = {}, mode = 'long' } = productData;
  const cat = normCat(category);
  const { line } = styleGuide(tone);
  const mats = materials?.length ? ` made with ${listify(materials, 5)}` : '';
  const uc = useCase ? ` — ideal for ${useCase}` : '';
  const occ = spec.occasion ? phraseOccasion(spec.occasion) : '';
  const occLine = occ ? ` Perfect for ${occ}.` : '';
  const kws = keywords?.length ? ` Featuring ${listify(keywords, 6)}.` : '';

  const leadTemplates = [
    `${title} — a ${cat} piece${mats}. ${line}${uc}${occLine}`,
    `${title}: artisan‑crafted ${cat}${mats}. ${line}${uc}${occLine}`,
    `Discover ${title}, a ${cat} essential${mats}. ${line}${uc}${occLine}`
  ];
  const bodyTemplates = [
    `Each piece is thoughtfully designed to balance aesthetics and everyday utility, with subtle details that elevate any space or outfit.${kws}`,
    `Crafted in small batches, it delivers character and quality you can see and feel—no two pieces are exactly alike.${kws}`,
    `Built to last and easy to love, it’s a simple way to add personality and warmth to your collection.${kws}`
  ];
  const ctaByCat = { 'home décor': 'Brighten your space with artisan character.', 'jewelry': 'Elevate everyday looks with a distinctive accent.', 'wall art': 'Transform your walls with expressive art.', 'handicraft': 'Bring handmade charm into daily life.', 'stationery': 'Make every note feel special.', 'pottery': 'Add organic warmth to your home.', 'textiles': 'Wrap comfort and style into your routine.' };
  const cta = ctaByCat[cat] || 'Make it part of the story at home.';
  
  const feat = buildFeatures({ materials, ...spec });
  const features = feat.slice(0, mode === 'short' ? 3 : 6); // Simplified shuffle
  const lead = leadTemplates[Math.floor(Math.random() * leadTemplates.length)];
  const body = bodyTemplates[Math.floor(Math.random() * bodyTemplates.length)];

  if (mode === 'short') {
    return { description: `${lead} ${body}`, features };
  }
  const bulletLines = features.map(f => `• ${f}`).join('\n');
  const desc = `${lead} ${body}\n\nHighlights:\n${bulletLines}\n\n${cta}`;
  return { description: desc, features };
}


// -------- V2: Original Regex-Based Query Parser (Fallback) --------
export function recommendQueryToFiltersV2(input) {
  const text = String(input || '').toLowerCase();
  let minPrice = null, maxPrice = null;
  const between = /between\s*(?:₹|rs\.?\s*)?(\d{2,6})\s*(?:and|-|to)\s*(?:₹|rs\.?\s*)?(\d{2,6})/i;
  const under = /\b(under|below|<=?)\s*(?:₹|rs\.?\s*)?(\d{2,6})/i;
  const over = /\b(above|over|>=?)\s*(?:₹|rs\.?\s*)?(\d{2,6})/i;
  const anyNum = /(?:₹|rs\.?\s*)?(\d{2,6})/i;

  if (between.test(text)) {
    const m = text.match(between);
    const a = Number(m[1]), b = Number(m[2]);
    minPrice = Math.min(a, b); maxPrice = Math.max(a, b);
  } else if (under.test(text)) {
    const m = text.match(under); maxPrice = m && m[2] ? Number(m[2]) : null;
  } else if (over.test(text)) {
    const m = text.match(over); minPrice = m && m[2] ? Number(m[2]) : null;
  } else {
    const m = text.match(anyNum); if (m && m[1]) maxPrice = Number(m[1]);
  }

  let category = '';
  if (/\bjewel|ring|necklace|earrings?\b/.test(text)) category = 'jewelry';
  else if (/\bpaint|canvas|art|wall\s*art\b/.test(text)) category = 'paintings';
  else if (/\bdecor|wall|home\b/.test(text)) category = 'home-decor';
  else if (/\bcraft|handicraft\b/.test(text)) category = 'crafts';
  else if (/\bstationery|notebook|pen|journal\b/.test(text)) category = 'stationery';
  else if (/\bpottery|ceramic|terracotta\b/.test(text)) category = 'crafts';
  else if (/\btextile|fabric|scarf|shawl\b/.test(text)) category = 'textiles';

  const matTags = []; ['silver','gold','bamboo','clay','cotton','wool','wood','terracotta','acrylic','watercolor','leather'].forEach(m => { if (text.includes(m)) matTags.push(m); });
  const styleTags = []; ['minimalist','boho','rustic','modern','vintage','classic'].forEach(s => { if (text.includes(s)) styleTags.push(s); });
  const audTags = []; if (/\bfor\s+her\b/.test(text)) audTags.push('for her'); if (/\bfor\s+him\b/.test(text)) audTags.push('for him'); if (/\b(kids?|child|baby)\b/.test(text)) audTags.push('kids');
  const occTags = []; ['birthday','anniversary','housewarming','diwali','christmas','mothers','fathers'].forEach(o => { if (text.includes(o)) occTags.push(o); });
  const ecoTags = []; if (/\beco|sustainable|handmade|artisan\b/.test(text)) ecoTags.push('eco-friendly');
  const stop = new Set(['show','me','the','a','an','and','or','to','for','under','below','above','over','between','and','with','in','of','gift','gifts','unique','suggest']);
  const words = (text) => String(text || '').toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const kws = words(text).filter(w => !stop.has(w) && w.length > 2 && !/\d/.test(w));
  const facets = [...new Set([...matTags, ...styleTags, ...audTags, ...occTags, ...ecoTags])];
  const search = [...facets, ...kws].slice(0, 6).join(' ').trim();

  const out = {};
  if (category) out.category = category;
  if (minPrice != null) out.minPrice = minPrice;
  if (maxPrice != null) out.maxPrice = maxPrice;
  if (search) out.search = search;
  out._facets = { materials: matTags, styles: styleTags, audience: audTags, occasion: occTags, eco: ecoTags };
  return out;
}