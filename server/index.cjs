/**
 * server/index.cjs
 *
 * Express backend for /api/report
 * - CORS enabled (use VITE_API_BASE to match client)
 * - Retries for Gemini model calls
 * - Reads GEMINI_API_KEY from .env.local
 *
 * Install: npm i express body-parser dotenv cors @google/genai
 */

const path = require("path");

// Load environment variables from .env.local (safest explicit path inside project)
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

// --- CONFIGURATION ---

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.warn("⚠️  GEMINI_API_KEY missing in .env.local or environment variables");
}

// Use the origin from the .env.local file or default to a safe value
// Note: VITE_API_BASE is the backend URL; we need the frontend URL here.
// The user's .env.local snippet showed ALLOWED_ORIGIN=http://localhost:5173
const ALLOWED_ORIGIN_ENV = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
const PORT = Number(process.env.PORT || 4000);

// --- EXPRESS SETUP ---
const app = express(); // <--- FIX: INITIALIZATION MUST BE HERE

// Trust reverse proxy headers if behind one (Render provides a proxy)
app.set("trust proxy", true);

// Body parser
app.use(bodyParser.json({ limit: "2mb" }));

// --- CORS CONFIGURATION (Consolidated & Corrected) ---
const allowedList = (ALLOWED_ORIGIN_ENV || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  // Use the function to check against the allowed list
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server or curl)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list or if '*' is allowed
    if (allowedList.length === 0 || allowedList.includes("*") || allowedList.includes(origin)) {
      return callback(null, true);
    }
    
    // Block the request
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true, // Allow cookies/sessions if needed
  optionsSuccessStatus: 204,
};

// Apply the single, correct CORS middleware
app.use(cors(corsOptions));
// --- END CORS CONFIGURATION ---


// ---------------- UTILITY FNS ----------------

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

const ZODIAC_TABLE = {
  Aries: { Leo: 85, Sagittarius: 85, Gemini: 78, Aquarius: 80, default: 60 },
  Taurus: { Virgo: 88, Capricorn: 85, Cancer: 80, Pisces: 83, default: 60 },
  Gemini: { Libra: 85, Aquarius: 89, Aries: 82, Leo: 78, Capricorn: 62, default: 60 },
  Cancer: { Scorpio: 82, Pisces: 82, Taurus: 78, Virgo: 76, default: 60 },
  Leo: { Aries: 85, Sagittarius: 85, Gemini: 78, Libra: 80, default: 60 },
  Virgo: { Taurus: 88, Capricorn: 88, Cancer: 78, Scorpio: 80, default: 60 },
  Libra: { Gemini: 85, Aquarius: 85, Leo: 80, Sagittarius: 80, default: 60 },
  Scorpio: { Cancer: 82, Pisces: 82, Virgo: 80, Capricorn: 80, default: 60 },
  Sagittarius: { Aries: 85, Leo: 85, Libra: 80, Aquarius: 80, default: 60 },
  Capricorn: { Taurus: 85, Virgo: 88, Scorpio: 80, Pisces: 83, Gemini: 62, default: 60 },
  Aquarius: { Gemini: 89, Libra: 85, Aries: 80, Sagittarius: 80, default: 60 },
  Pisces: { Cancer: 82, Scorpio: 82, Taurus: 83, Capricorn: 83, default: 60 },
};

function score(p1, p2, startISO) {
  const row = ZODIAC_TABLE[p1.zodiac] ?? { default: 60 };
  const base = row[p2.zodiac] ?? row.default ?? 60;

  const overlap = new Set(p1.interests.filter((x) => p2.interests.includes(x))).size;

  const start = new Date(startISO);
  const now = new Date();
  const months =
    Math.max(
      0,
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    );

  const durBonus = Math.min(10, Math.floor(months / 3));

  return clamp(Math.round(base * 0.6 + overlap * 4 + 20 + durBonus), 40, 95);
}

function ddmmyyyy(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function hhmmAMPM(t) {
  const [hS, mS] = (t || "").split(":");
  let h = parseInt(hS || "0", 10);
  let m = parseInt(mS || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function buildTemplate(data) {
  const A = data.partner1 || {};
  const B = data.partner2 || {};
  return `
Perform a realistic relationship analysis.

Person A:
Name: ${A.name || "—"}
Gender: ${A.gender || "—"}
DOB: ${A.dob ? ddmmyyyy(A.dob) : "—"}
Time: ${A.tob ? hhmmAMPM(A.tob) : "—"}
Place: ${A.pob || "—"}
Zodiac: ${A.zodiac || "—"}
Interests: ${Array.isArray(A.interests) ? A.interests.join(", ") : "—"}

Person B:
Name: ${B.name || "—"}
Gender: ${B.gender || "—"}
DOB: ${B.dob ? ddmmyyyy(B.dob) : "—"}
Time: ${B.tob ? hhmmAMPM(B.tob) : "—"}
Place: ${B.pob || "—"}
Zodiac: ${B.zodiac || "—"}
Interests: ${Array.isArray(B.interests) ? B.interests.join(", ") : "—"}

Relationship Start: ${data.relationship_start ? ddmmyyyy(data.relationship_start) : "—"}

Give:
1) Emotional analysis
2) Lifestyle analysis
3) Problems
4) Future potential
5) Compatibility percent (0-100)
`.trim();
}

// ---------------- AI CALL ----------------

async function callGeminiWithRetry(apiKey, promptText) {
  // Create client with provided apiKey
  const ai = new GoogleGenAI({ apiKey });

  // model order is conservative — try smaller/fast models first, then fallback
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"];
  const delays = [200, 500, 1200, 2500];

  let lastErr = null;

  for (const model of models) {
    for (let attempt = 0; attempt < delays.length; attempt++) {
      try {
        console.log(`AI: model=${model} attempt=${attempt + 1}`);
        // The @google/genai package response shape can vary by version.
        // We'll attempt a models.generateContent call and extract text robustly.
        const res = await ai.models.generateContent({
          model,
          contents: promptText,
        });

        // Best-effort extraction of text
        let text = "";

        // Some SDK versions return { text } or { output: [{ content: { text } }] } etc.
        if (res == null) {
          text = "";
        } else if (typeof res === "string") {
          text = res;
        } else if (typeof res.text === "string") {
          text = res.text;
        } else if (Array.isArray(res.output) && res.output.length) {
          // attempt common nested shapes
          const first = res.output[0];
          if (typeof first === "string") text = first;
          else if (first?.content?.text) text = String(first.content.text);
          else if (first?.text) text = String(first.text);
        } else if (res?.content?.text) {
          text = String(res.content.text);
        } else {
          // fallback stringify to inspect
          text = String(res?.text || "");
        }

        text = (text || "").trim();

        if (text) {
          console.log(`AI success (model=${model})`);
          return text;
        }

        lastErr = new Error("Empty response from model");
      } catch (err) {
        lastErr = err;
        console.error(`AI error (model=${model}) attempt=${attempt + 1}:`, err && err.message ? err.message : err);
        // wait before retry
        await new Promise((r) => setTimeout(r, delays[Math.min(attempt, delays.length - 1)]));
      }
    }
  }

  throw new Error(`All Gemini models failed after retries. Last error: ${lastErr?.message || "unknown"}`);
}

// ---------------- API ROUTE ----------------

// ---------------- API ROUTE ----------------

app.post("/api/report", async (req, res) => {
  try {
    const body = req.body || {};

    if (!GEMINI_KEY) {
      // Missing key is a server config error — return a clear message
      // This MUST be the first check.
      return res.status(500).json({
         compatibility_percent: 50,
         narrative: "SERVER CONFIGURATION ERROR: GEMINI_API_KEY not set. Check Render Environment variables.",
      });
    }

    // Validate minimal payload shape
    if (!body.partner1 || !body.partner2 || !body.relationship_start) {
      return res.status(400).json({
        compatibility_percent: 50,
        narrative: "Bad request: missing partner1, partner2 or relationship_start in request body.",
      });
    }

    const scoreValue = score(body.partner1, body.partner2, body.relationship_start);
    const prompt = buildTemplate(body);

    // Call Gemini with retries. This is the part that might timeout.
    let text = "";
    try {
        text = await callGeminiWithRetry(GEMINI_KEY, prompt);
    } catch (aiError) {
        console.error("AI Generation Failed:", aiError);
        // If AI call fails, return a safe, descriptive JSON response instead of crashing.
        return res.status(504).json({ // 504 Gateway Timeout is often appropriate here
            compatibility_percent: scoreValue, 
            narrative: `AI REPORT FAILED (504 Timeout/Error). Status: ${aiError.message || "Unknown AI error occurred."}`,
        });
    }


    // If the AI call succeeds, return the result
    return res.json({
      compatibility_percent: scoreValue,
      narrative: text,
    });
  } catch (err) {
    console.error("API Report UNHANDLED Error:", err && err.message ? err.message : err);

    // This is the safety net for any crash outside the AI block
    return res.status(500).json({
      compatibility_percent: 50,
      narrative: `SERVER FATAL ERROR (500): Failed to process request. ${String(err && err.message ? err.message : err)}`,
    });
  }
});

// Health check and root route (helpful for "Cannot GET /" debugging)
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("Compatibility API is up. POST to /api/report");
});

app.listen(PORT, () => {
  console.log(`API READY → http://localhost:${PORT}/api/report (listening on ${PORT})`);
  console.log(`ALLOWED_ORIGIN=${ALLOWED_ORIGIN_ENV}`);
});