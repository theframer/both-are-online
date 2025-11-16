/* ────────────────────────────────────────────────

   EXPRESS BACKEND FOR /api/report

   Uses GEMINI_API_KEY from .env.local

   Make sure you install:

   npm install express body-parser dotenv @google/genai

   ──────────────────────────────────────────────── */

   const path = require("path");

   // Load environment variables from .env.local
   require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });
   
   const express = require("express");
   const bodyParser = require("body-parser");
   const { GoogleGenAI } = require("@google/genai");
   
   // API KEY
   const GEMINI_KEY = process.env.GEMINI_API_KEY;
   if (!GEMINI_KEY) {
     console.warn("⚠️  GEMINI_API_KEY missing in .env.local");
   }
   
   const app = express();
   const PORT = 4000;
   
   app.use(bodyParser.json({ limit: "2mb" }));
   
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
   
     const months =
       Math.max(0, (new Date().getFullYear() - new Date(startISO).getFullYear()) * 12 +
         (new Date().getMonth() - new Date(startISO).getMonth()));
   
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
     const A = data.partner1;
     const B = data.partner2;
     return `
   Perform a realistic relationship analysis.
   
   Person A:
   Name: ${A.name}
   Gender: ${A.gender}
   DOB: ${ddmmyyyy(A.dob)}
   Time: ${hhmmAMPM(A.tob)}
   Place: ${A.pob}
   Zodiac: ${A.zodiac}
   Interests: ${A.interests.join(", ")}
   
   Person B:
   Name: ${B.name}
   Gender: ${B.gender}
   DOB: ${ddmmyyyy(B.dob)}
   Time: ${hhmmAMPM(B.tob)}
   Place: ${B.pob}
   Zodiac: ${B.zodiac}
   Interests: ${B.interests.join(", ")}
   
   Relationship Start: ${ddmmyyyy(data.relationship_start)}
   
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
     const ai = new GoogleGenAI({ apiKey });
     const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"];
     const delays = [200, 500, 1200, 2500]; // Delay in milliseconds
   
     for (const model of models) {
       let lastErr;
       for (let attempt = 0; attempt < delays.length; attempt++) {
         try {
           console.log(`Attempting model: ${model}, Retry: ${attempt + 1}/${delays.length}`);
           
           const res = await ai.models.generateContent({ model, contents: promptText });
           
           // 🛠️ FIX APPLIED: Correctly access the 'text' property, which is a string.
           const text = String(res?.text || "").trim();
           
           if (text) {
             console.log(`Successfully received response from ${model}.`);
             return text;
           }
           lastErr = new Error("Empty response");
         } catch (err) {
           lastErr = err;
           console.error(`Error with ${model} on attempt ${attempt + 1}: ${err.message}`);
           
           // Wait before the next retry
           await new Promise((r) => setTimeout(r, delays[attempt]));
         }
       }
     }
     
     // Throw a descriptive error if all attempts fail
     const finalError = new Error(`All Gemini models overloaded/unavailable after retries. Last error: ${lastErr?.message || "Unknown error"}`);
     throw finalError;
   }
   
   // ---------------- API ROUTE ----------------
   
   app.post("/api/report", async (req, res) => {
     try {
       const body = req.body;
   
       // Ensure the API key is present before calling the function
       if (!GEMINI_KEY) {
           throw new Error("GEMINI_API_KEY environment variable is not set.");
       }
       
       const scoreValue = score(body.partner1, body.partner2, body.relationship_start);
       const prompt = buildTemplate(body);
       
       // 🛠️ FIX APPLIED: Use the correct function name and pass the API key.
       const text = await callGeminiWithRetry(GEMINI_KEY, prompt); 
   
       res.json({
         compatibility_percent: scoreValue,
         narrative: text,
       });
     } catch (err) {
       // Log the actual error on the server side
       console.error("API Report Error:", err.message || err);
       
       res.json({
         compatibility_percent: 50,
         // Provide a clearer error message to the client
         narrative: `SERVER ERROR: Failed to generate report. ${String(err.message || err)}`,
       });
     }
   });
   
   // ---------------- START SERVER ----------------
   
   app.listen(PORT, () => {
     console.log(`API READY → http://localhost:${PORT}/api/report`);
   });