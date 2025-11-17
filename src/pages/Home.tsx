  // src/pages/Home.tsx
  // Updated: layout changed to left - center gauge - right (md+). Keeps all existing logic.
  import React, { useEffect, useMemo, useRef, useState } from "react";

  /* ---------------- Types ---------------- */
  type Gender = "Man/Boy" | "Woman/Girl" | "Non-binary" | "Prefer not to say" | "Other";
  type Married = "Yes" | "No" | "";

  type Partner = {
    label: "Person A" | "Person B";
    name: string;
    dob: string;    // yyyy-mm-dd
    tob: string;    // HH:mm (24h)
    pob: string;
    region: string;
    culture: string;
    zodiac: string;
    gender?: Gender;
    married?: Married;
    star?: string;
    height_cm?: number | "";
    proposedFirst?: "Yes" | "No" | "";
    interests: string[];
    _interestInput: string;
  };

  /* ---------------- Static Data ---------------- */
  const CULTURES = [
    "Western Culture",
    "Eastern Culture (Asian)",
    "Indian Culture",
    "African Culture",
    "Latin Culture",
    "Middle Eastern Culture",
  ];

  const ZODIAC = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
  ];

  const NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu",
    "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta",
    "Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha",
    "Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada",
    "Uttara Bhadrapada","Revati",
  ];

  const PLACE_INDEX = [
    "Andhra Pradesh, India","Arunachal Pradesh, India","Assam, India","Bihar, India",
    "Chhattisgarh, India","Goa, India","Gujarat, India","Haryana, India",
    "Himachal Pradesh, India","Jharkhand, India","Karnataka, India","Kerala, India",
    "Madhya Pradesh, India","Maharashtra, India","Manipur, India","Meghalaya, India",
    "Mizoram, India","Nagaland, India","Odisha, India","Punjab, India",
    "Rajasthan, India","Sikkim, India","Tamil Nadu, India","Telangana, India",
    "Tripura, India","Uttar Pradesh, India","Uttarakhand, India","West Bengal, India",
    "Andaman and Nicobar Islands, India","Chandigarh, India",
    "Dadra and Nagar Haveli and Daman and Diu, India","Delhi, India",
    "Jammu and Kashmir, India","Ladakh, India","Lakshadweep, India","Puducherry, India"
  ];

  const positiveQuotes = [
    "Love is composed of a single soul inhabiting two bodies.",
    "The best thing to hold onto in life is each other.",
    "True love stories never have endings.",
    "A great relationship is about two things: First, appreciating the similarities, and second, respecting the differences.",
    "Love doesn't make the world go round, love is what makes the ride worthwhile.",
    "Communication and respect are the foundation of a lasting relationship.",
    "Happiness is only real when shared.",
    "In true love, the smallest distance is too great, and the greatest distance can be bridged.",
  ];

  /* ---------------- UI Helpers ---------------- */
  function Card({ children, title, className = "" }: { children: React.ReactNode; title: string; className?: string }) {
    return (
      <section
        className={`card min-w-0 bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-4 my-4 flex flex-col h-full ${className}`}
        style={{ boxSizing: "border-box" }}
      >
        <div className="mb-3">
          <h2 className="text-base md:text-lg font-semibold mb-3">
            {(title && String(title).trim()) ? title : "Partner"}
          </h2>
        </div>
  
        {/* content area grows and scrolls when necessary */}
        <div className="flex-1 min-w-0" style={{ overflow: "auto" }}>
          {children}
        </div>
      </section>
    );
  }
  

  function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
      <span
        className="
          inline-grid
          grid-cols-[0.9fr_auto]    /* text takes full center space, X sits right */
          items-center
          bg-[var(--panel)]
          border border-[var(--border)]
          rounded-full
          px-3 py-[6px]
          text-sm
          shadow-sm
          whitespace-nowrap
          min-w-[80px]           /* wider pill for cleaner center */
        "
        style={{ lineHeight: "1.2", textAlign: "center" }}
      >
        <span className="mx-auto block truncate">{label}</span>
  
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="
            ml-2 
            flex items-center justify-center
            w-5 h-5
            rounded-full
            bg-[var(--border)]
            text-[var(--fg)]
            text-xs
            hover:bg-[var(--accent)]
            hover:text-white
            transition-all
          "
        >
          ×
        </button>
      </span>
    );
  }
  

  /* ---------------- Default partner object helper ---------------- */
  const emptyPartner = (label: "Person A" | "Person B"): Partner => ({
    label,
    name: "",
    dob: "",
    tob: "",
    pob: "",
    region: "",
    culture: "",
    zodiac: "",
    gender: undefined,
    married: "" as Married,
    star: "",
    height_cm: "",
    proposedFirst: "" as "Yes" | "No" | "",
    interests: [],
    _interestInput: ""
  });

  /* ---------------- Partner Form ---------------- */
  function PartnerForm({
    data, setData, title = "Partner",
  }: {
    data: Partner;
    setData: (p: Partner) => void;
    title?: string;
  }) {
    const [suggest, setSuggest] = useState<string[]>([]);
    const [showSuggest, setShowSuggest] = useState(false);

    const updatePOB = (val: string) => {
      setData({ ...data, pob: val });
      if (!val) { setSuggest([]); return; }
      const match = PLACE_INDEX.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
      setSuggest(match);
      setShowSuggest(match.length > 0);
    };

    const onInterestKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const value = data._interestInput.trim().replace(/,$/, "");
        if (value && !data.interests.includes(value)) {
          setData({ ...data, interests: [...data.interests, value], _interestInput: "" });
        } else {
          setData({ ...data, _interestInput: "" });
        }
      }
    };

    // compute card class based on selected gender for visual accent
    const cardClass =
      data.gender === "Man/Boy"
        ? "card-boy"
        : data.gender === "Woman/Girl"
        ? "card-girl"
        : data.gender === "Non-binary"
        ? "card-nb"
        : "";
        

    return (
      <div>
        <Card title={title} className={cardClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="text-xs opacity-70">Name *</span>
              <input className="input mt-1 w-full" required value={data.name}
                onChange={e=>setData({...data,name:e.target.value})}/>
            </label>

            <label>
              <span className="text-xs opacity-70">Gender *</span>
              <select className="select mt-1 w-full" required value={data.gender||""}
                onChange={e=>setData({...data, gender: e.target.value as Gender})}>
                <option value="">Select gender</option>
                <option>Man/Boy</option>
                <option>Woman/Girl</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              <span className="text-xs opacity-70">Married *</span>
              <select className="select mt-1 w-full" required value={data.married || ""}
                onChange={e=>setData({...data, married: e.target.value as Married})}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>

            <label className="block min-w-0">
  <span className="text-xs opacity-70">Date of Birth *</span>
  <input
    className="input mt-1 w-full min-w-0"
    type="date"
    required
    value={data.dob}
    onChange={e => { const v = e.target.value; setData({ ...data, dob: v }); }}
  />
</label>

<label className="block min-w-0">
  <span className="text-xs opacity-70">Time of Birth *</span>
  <input
    className="input mt-1 w-full min-w-0"
    type="time"
    required
    value={data.tob}
    onChange={e => setData({ ...data, tob: e.target.value })}
  />
</label>

            <label className="relative">
              <span className="text-xs opacity-70">Place of Birth *</span>
              <input
                className="input mt-1 w-full"
                required
                value={data.pob}
                onChange={e=>updatePOB(e.target.value)}
                onBlur={()=>setTimeout(()=>setShowSuggest(false),120)}
                onFocus={()=>data.pob && setShowSuggest(true)}
              />
              {showSuggest && (
                <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow">
                  {suggest.map(s => (
                    <div
                      key={s}
                      className="px-3 py-2 hover:bg-[var(--panel)] cursor-pointer"
                      onMouseDown={()=>{
                        setData({...data,pob:s});
                        setShowSuggest(false);
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </label>

            <label>
              <span className="text-xs opacity-70">Region *</span>
              <input className="input mt-1 w-full" required value={data.region}
                onChange={e=>setData({...data,region:e.target.value})}/>
            </label>

            <label>
              <span className="text-xs opacity-70">Culture *</span>
              <select className="select mt-1 w-full" required value={data.culture}
                onChange={e=>setData({...data,culture:e.target.value})}>
                <option value="">Select culture</option>
                {CULTURES.map(c=><option key={c}>{c}</option>)}
              </select>
            </label>

            <label>
              <span className="text-xs opacity-70">Zodiac Sign *</span>
              <select className="select mt-1 w-full" required value={data.zodiac}
                onChange={e=>setData({...data,zodiac:e.target.value})}>
                <option value="">Select</option>
                {ZODIAC.map(z=><option key={z}>{z}</option>)}
              </select>
            </label>

            <label>
              <span className="text-xs opacity-70">Star / Nakshatra</span>
              <select className="select mt-1 w-full" value={data.star||""}
                onChange={e=>setData({...data,star:e.target.value})}>
                <option value="">Select</option>
                {NAKSHATRAS.map(s=><option key={s}>{s}</option>)}
              </select>
            </label>

            <label>
              <span className="text-xs opacity-70">Did you propose first? *</span>
              <select className="select mt-1 w-full" required value={data.proposedFirst||""}
                onChange={e=>setData({...data,proposedFirst:e.target.value as "Yes" | "No" | ""})}>
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>

            <div className="md:col-span-2">
              <span className="text-xs opacity-70">Shared Interests (type & press Enter)</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {data.interests.map((it, idx)=>(

                  <Pill key={`${it}-${idx}`} label={it} onRemove={()=>{
                    setData({...data, interests: data.interests.filter(x=>x!==it)});
                  }}/>
                ))}
              </div>
              <input
                  className="input mt-2 w-full !text-sm"
                placeholder="e.g., Food, Music, Travel"
                value={data._interestInput}
                onChange={e=>setData({...data,_interestInput:e.target.value})}
                onKeyDown={onInterestKey}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------------- Page ---------------- */
  export default function Home() {
    const [personA, setPersonA] = useState(emptyPartner("Person A"));
    const [personB, setPersonB] = useState(emptyPartner("Person B"));
    const [oscillate, setOscillate] = useState(false);
    const [fakeGauge, setFakeGauge] = useState(0);
    const [isReportComplete, setIsReportComplete] = useState(false);

    const [finalGauge, setFinalGauge] = useState<number | null>(null);
    const [meterValue, setMeterValue] = useState<number>(0);
    const [relationshipStart, setRelationshipStart] = useState<string>("");
    const [agree, setAgree] = useState(false);
    const [gauge, setGauge] = useState<number>(0);
    const [streamedGauge, setStreamedGauge] = useState<number>(0);
    const [streamText, setStreamText] = useState<string>("");
    const [phase, setPhase] = useState<"idle" | "preload" | "streaming" | "done">("idle");

    const preloadTimer = useRef<number | null>(null);
    const typeTimer = useRef<number | null>(null);

    const reportRef = useRef<HTMLPreElement | null>(null);
    const footerRef = useRef<HTMLDivElement | null>(null);

    const [showTop, setShowTop] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [showWaitingBanner, setShowWaitingBanner] = useState(false);

    const [flowers, setFlowers] = useState<number[]>([]);

    useEffect(() => {
      if (phase !== "preload") return;
      const interval = window.setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % positiveQuotes.length);
      }, 5000);
      return () => window.clearInterval(interval);
    }, [phase]);

    const minLen = (s?: string) => !!s && s.trim().length >= 3;
    const validDobYear = (dob: string) => {
      if (!dob) return false;
      const year = dob.split("-")[0] ?? "";
      return /^\d{4}$/.test(year) && Number(year) >= 1000 && Number(year) <= 9999;
    };

    const formValid = useMemo(() => {
      const personsOk = [personA, personB].every(p =>
        minLen(p.name) &&
        validDobYear(p.dob) &&
        !!p.tob &&
        minLen(p.pob) &&
        minLen(p.region) &&
        !!p.culture &&
        !!p.zodiac &&
        !!p.proposedFirst &&
        !!p.gender &&
        !!p.married
      );
      return personsOk && !!relationshipStart && agree;
    }, [personA, personB, relationshipStart, agree]);

    useEffect(() => {
      if (finalGauge === null) return;
      setOscillate(false);
      let start = gauge, end = finalGauge;
      const dur = 1500;
      const t0 = performance.now();
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        setGauge(Math.round(start + (end - start) * ease(t)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalGauge]);

    useEffect(() => {
      return () => {
        if (preloadTimer.current !== null) window.clearInterval(preloadTimer.current);
        if (typeTimer.current !== null) window.clearInterval(typeTimer.current);
      };
    }, []);

    useEffect(()=>{
      const onScroll = () => {
        setShowTop(window.scrollY > 300);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
      if (gauge > 50 && phase === "done") {
        setFlowers(Array.from({ length: 18 }, (_, i) => i));
        const t = window.setTimeout(() => setFlowers([]), 2000);
        return () => clearTimeout(t);
      }
    }, [gauge, phase]);

    const onStart = async () => {
      setPhase("preload");
      setShowWaitingBanner(true);
      setIsReportComplete(false);
      setStreamText("");
      setFinalGauge(null);

      setGauge(0);
      setFakeGauge(0);
      setMeterValue(0);

      const suspenseInterval = window.setInterval(() => {
        setFakeGauge(g => g < 98 ? g + 1 : g);
        setMeterValue(g => g < 97 ? g + 1 : 70);
      }, 350);

      if (preloadTimer.current !== null) window.clearInterval(preloadTimer.current);
      preloadTimer.current = window.setInterval(() => {
        setGauge((g) => {
          if (g >= 70) return 60;
          return g + 1;
        });
      }, 130);

      try {
        const body = {
          partner1: {...personA, _interestInput: undefined},
          partner2: {...personB, _interestInput: undefined},
          relationship_start: new Date(relationshipStart).toISOString(),
        };

                // ---- Robust fetch + parsing (replace the old fetch block) ----
                const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, ""); // ensure no trailing slash
                const endpoint = (API_BASE || "") + "/api/report";
        
                // Do the POST
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                });
        
                // Read raw text first (safe even if empty or HTML)
                const raw = await res.text();
        
                if (!raw || raw.trim().length === 0) {
                  // Empty response — handle gracefully
                  console.error("Empty response from API", { status: res.status, statusText: res.statusText });
                  if (preloadTimer.current !== null) { window.clearInterval(preloadTimer.current); preloadTimer.current = null; }
                  setPhase("done");
                  setFinalGauge(50);
                  setStreamText(`ERROR: Empty response from server (status ${res.status})`);
                  setShowWaitingBanner(false);
                  setIsReportComplete(true);
                  return;
                }
        
                // Try to parse JSON if content-type says JSON, otherwise show raw text
                const contentType = res.headers.get("content-type") || "";
                let data: any = null;
                if (contentType.includes("application/json")) {
                  try {
                    data = JSON.parse(raw);
                  } catch (parseErr) {
                    console.error("JSON parse error:", parseErr, "raw:", raw);
                    if (preloadTimer.current !== null) { window.clearInterval(preloadTimer.current); preloadTimer.current = null; }
                    setPhase("done");
                    setFinalGauge(50);
                    setStreamText(`ERROR: Failed to parse JSON response:\n\n${raw}`);
                    setShowWaitingBanner(false);
                    setIsReportComplete(true);
                    return;
                  }
                } else {
                  // Not JSON: likely an HTML error page or plain text
                  console.warn("Non-JSON response from API", { status: res.status, raw });
                  if (preloadTimer.current !== null) { window.clearInterval(preloadTimer.current); preloadTimer.current = null; }
                  setPhase("done");
                  setFinalGauge(50);
                  setStreamText(`Server returned non-JSON response (status ${res.status}):\n\n${raw}`);
                  setShowWaitingBanner(false);
                  setIsReportComplete(true);
                  return;
                }
        
                // --- If we reached here, `data` is the parsed JSON object ---
                if (preloadTimer.current !== null) { window.clearInterval(preloadTimer.current); preloadTimer.current = null; }
                setPhase("streaming");
                setOscillate(false);
                window.clearInterval(suspenseInterval);
        
                // Defensive guards for fields we expect
                const compatibility = Number(data?.compatibility_percent ?? 50);
                const narrative = String(data?.narrative ?? "");
        
                setMeterValue(compatibility);
                setFinalGauge(compatibility);
                setShowWaitingBanner(false);
                setIsReportComplete(true);
        
                // Smooth gauge animation to final value (keeps your current approach)
                {
                  const finalValue = compatibility;
                  let frame: number;
                  const duration = 1000;
                  const start = performance.now();
                  const from = meterValue;
                  const delta = finalValue - from;
                  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
                  function step(now: number) {
                    const t = Math.min(1, (now - start) / duration);
                    const eased = ease(t);
                    setMeterValue(Math.round(from + delta * eased));
                    if (t < 1) frame = requestAnimationFrame(step);
                  }
                  frame = requestAnimationFrame(step);
                }
        
                // typewriter streaming of narrative (same logic as before)
                if (typeTimer.current !== null) { window.clearInterval(typeTimer.current); typeTimer.current = null; }
                let i = 0;
                const chunk = 4;
                const delay = 18;
                typeTimer.current = window.setInterval(() => {
                  i += chunk;
                  setStreamText(prev => {
                    const next = narrative.slice(0, Math.min(i, narrative.length));
                    const match = next.match(/(\d{2,3})\s*\%/g);
                    if (match) {
                      const percentString = match[match.length - 1].replace(/[^0-9]/g, "");
                      const percent = parseInt(percentString, 10);
                      if (percent >= 0 && percent <= 100) setStreamedGauge(percent);
                    }
                    requestAnimationFrame(() => {
                      if (reportRef.current) {
                        reportRef.current.scrollTop = reportRef.current.scrollHeight;
                      }
                    });
                    return next;
                  });
                  if (i >= narrative.length && typeTimer.current !== null) {
                    window.clearInterval(typeTimer.current);
                    typeTimer.current = null;
                    setPhase("done");
                  }
                }, delay);
                // ---- end robust fetch block ----
        

      } catch (e) {
        if (preloadTimer.current !== null) { window.clearInterval(preloadTimer.current); preloadTimer.current = null; }
        setPhase("done");
        setFinalGauge(50);
        setStreamText(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        setShowWaitingBanner(false);
        setIsReportComplete(true);
      }
    };

    const downloadReport = () => {
      if (!streamText || streamText.trim().length === 0) return;
      const whoA = `${personA.name} (${personA.gender || "—"}, married: ${personA.married || "—"})`;
      const whoB = `${personB.name} (${personB.gender || "—"}, married: ${personB.married || "—"})`;
      const header = `Both Are Online — Compatibility Report\nGenerated: ${new Date().toLocaleString()}\n\nPerson A: ${whoA}\nPerson B: ${whoB}\nCompatibility: ${gauge}%\n\n---- Report ----\n\n`;
      const blob = new Blob([header + (streamText || "No report available")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bothareonline-report-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    const scrollToTerms = () => {
      if (footerRef.current) footerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const bokehSpans = Array.from({ length: 25 }, (_, i) => <span key={i} />);

    return (
      <>
        <div className="background" aria-hidden="true">
          {bokehSpans}
        </div>

        <main className="p-6 text-[var(--fg)] min-h-screen flex flex-col relative overflow-x-hidden" style={{ zIndex: 1 }}>
          {/* waiting banner, bokeh-overlay ... keep unchanged */}
          {showWaitingBanner && (
  <div
    className="
      fixed top-20 left-1/2 -translate-x-1/2
      z-[200]
      text-center font-medium
      shadow-[0_0_22px_rgba(255,255,255,0.55)]
    "
    style={{
      background: "rgba(255,255,255,0.96)",
      color: "#000",
      borderRadius: "28px",
      border: "1px solid rgba(255,255,255,0.7)",
      padding: "14px 22px",          // ← PERFECT CONSISTENT SPACING
      maxWidth: "740px",             // ← STOP TEXT FROM STRETCHING TOO WIDE
      width: "90%",                  // ← RESPONSIVE FOR MOBILE
      lineHeight: "1.5",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
    }}
  >
    The displayed compatibility is not the actual result.  
    Please wait for the report to finish for your true score!
  </div>
)}

          <div className="bokeh-overlay" aria-hidden="true" />

          <div className="max-w-7xl mx-auto flex-1 pt-8" style={{ position: "relative", zIndex: 2 }}>
            {/* IMPORTANT: md+ shows left - center - right. items-stretch makes children same height */}
            <div id="compat-grid" className="grid grid-cols-1 md:grid-cols-[1fr_360px_1fr] gap-6 items-start md:items-stretch">
    {/* Left partner card */}
    <div className="order-1 md:order-1">
      <PartnerForm
        title={`You ${personA.gender?.includes("Man") ? "You" : personA.gender?.includes("Woman") ? "Girl" : ""}`}
        data={personA}
        setData={setPersonA}
      />
    </div>

    {/* Center gauge — placed as the middle DOM child to guarantee it's centered */}
    <div className="order-2 md:order-2 flex items-start md:items-center justify-center center-column">
      {/* sticky wrapper keeps gauge visible while you scroll the left/right cards */}
      {/* responsive center gauge wrapper */}
<div
  className="gauge-sticky-wrapper w-full max-w-[360px]"
  style={{
    // Use aspect-ratio where supported, fallback will preserve square via padding trick in older browsers
    aspectRatio: "1 / 1",
    position: "relative",
    margin: "0 auto",
  }}
>
  {/* inner container ensures svg fills the box */}
  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
    {/* svg scales to the container via viewBox */}
    <svg viewBox="0 0 320 320" preserveAspectRatio="xMidYMid meet" className="-rotate-90 w-full h-full" style={{ zIndex: 10 }}>
      <circle cx={160} cy={160} r={150} stroke="var(--border)" strokeWidth={12} fill="none" />
      <circle
        cx={160}
        cy={160}
        r={150}
        stroke="var(--accent)"
        strokeWidth={12}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${(meterValue / 100) * (2 * Math.PI * 150)} ${2 * Math.PI * 150}`}
      />
    </svg>

    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <div className="text-5xl font-semibold">{meterValue}%</div>
      <div className="text-sm opacity-70 mt-1">{phase === "preload" ? "Analyzing..." : "Compatibility"}</div>
    </div>
  </div>
</div>
    </div>

    {/* Right partner card */}
    <div className="order-3 md:order-3">
      <PartnerForm
        title={`Your Partner ${personB.gender?.includes("Woman") ? "Your Partner" : personB.gender?.includes("Man") ? "Boy" : ""}`}
        data={personB}
        setData={setPersonB}
      />
    </div>
  </div>

            <div className="h-6" />

            {/* Relationship & Consent */}
            <Card title="Relationship & Consent">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm mb-1 opacity-80">Relationship Start Date*</label>
                  <input
                    type="date"
                    value={relationshipStart}
                    onChange={e=>setRelationshipStart(e.target.value)}
                    className="input w-full max-w-full box-border"
                    required
                  />
                </div>
              </div>

              <div className="mt-3 text-sm">
                <strong>Terms &amp; Conditions</strong>
                <div className="mt-1 text-xs opacity-80">
                  Your privacy is protected as no information is stored, and all data is erased upon leaving the website.  
                  We are not responsible for any negative outcomes resulting from its use. This system-generated report is interpretive guidance only and is not guaranteed to be fully but accurate.  
                  Do not make important decisions based solely on this output.
                </div>
              </div>

              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={e=>setAgree(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                I accept the<strong>Terms & Conditions</strong>
              </label>

              <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  disabled={!formValid}
                  onClick={onStart}
                  className="btn w-full py-3 text-base rounded-xl bg-[var(--accent)] text-white disabled:opacity-50"
                >
                  Start
                </button>

                <button
                  onClick={() => {
                    setPersonA(emptyPartner("Person A"));
                    setPersonB(emptyPartner("Person B"));
                    setRelationshipStart("");
                    setAgree(false);
                    setGauge(0);
                    setStreamText("");
                    setFinalGauge(null);
                    setPhase("idle");
                  }}
                  className="btn w-full py-3 text-base rounded-xl border border-[var(--border)]"
                >
                  Reset
                </button>

                
              </div>
            </Card>

            <div className="h-6" />

            {/* Report Box */}
            <Card title="Real-time Report" className="h-full w-full">

{/* This wrapper matches the exact layout of the scroll area */}
<div className="relative w-full min-w-0">

  {/* REPORT BOX */}
  <pre
    ref={reportRef}
    className="report-box whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg)] p-4 max-h-[500px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-inner w-full"
    style={{
      maxHeight: 320,
      overflow: "auto",
      paddingRight: "48px" // ensure text never touches the copy button
    }}
  >
    {phase === "preload" && !streamText ? (
      <blockquote className="italic text-center opacity-75">
        {positiveQuotes[quoteIndex]}
      </blockquote>
    ) : (
      streamText || "Namaskaram! Fill all required fields and press start."
    )}
  </pre>

  {/* PERFECTLY ANCHORED COPY ICON */}
  <button
    onClick={() => navigator.clipboard.writeText(streamText || "")}
    className="copy-btn absolute w-9 h-9 flex items-center justify-center 
             rounded-full bg-[var(--panel)] border border-[var(--border)]
             hover:bg-[var(--accent)] hover:text-white transition-colors shadow-md"
  title="Copy report"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 1H8C6.9 1 6 1.9 6 3V5H5C3.9 5 3 5.9 3 7V21C3 22.1 3.9 23 5 23H15C16.1 23 17 22.1 17 21V19H19C20.1 19 21 18.1 21 17V5L16 1ZM15 21H5V7H6H15V21ZM19 17H17V7H9V3H16L19 6V17Z"/>
    </svg>
  </button>

</div>

<button
  onClick={downloadReport}
  disabled={!streamText || streamText.trim().length === 0}
  className={`btn w-full py-3 text-base rounded-xl border ${
    (!streamText || streamText.trim().length === 0) ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  Download Report (.txt)
</button>

</Card>

          </div>

          {showTop && (
            <button
              onClick={scrollToTop}
              aria-label="Go to top"
              style={{
                position:"fixed",
                right:30,
                bottom:30,
                zIndex:10,
                // DEFINING SIZE IN PIXELS HERE (e.g., 64px x 64px)
                width: "50px",
                height: "50px"
            }}
              className="rounded-full !w-16 !h-16 flex items-center justify-center shadow-lg bg-[var(--panel)] border border-[var(--border)] hover:bg-black hover:text-white transition-colors text-3xl"
            >
              ↑
            </button>
          )}
        </main>
      </>
    );
  }
