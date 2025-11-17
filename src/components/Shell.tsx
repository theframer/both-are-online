// src/components/Shell.jsx
import React, { useEffect, useState } from "react";
import "../styles/globals.css"; // adjust path if your CSS path differs
import ContactForm from "../ContactForm.jsx";// adjust path if your ContactForm is elsewhere

export default function Shell({ children }) {
  const NAV_HEIGHT = 64; // px - used to push content down

  const [showContactModal, setShowContactModal] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") return stored;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
        return "dark";
      return "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <>
      {/* bokeh background */}
      <div className="background" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="min-h-screen relative" style={{ zIndex: 1 }}>
        {/* FULL-WIDTH NAV */}
        <nav
          className="nav-glass full-width-nav"
          style={{ height: NAV_HEIGHT }}
          role="navigation"
          aria-label="Top navigation"
        >
          <div className="nav-row">
            <div className="nav-left">{/* reserved */}</div>

            <div className="nav-center" aria-hidden>
              <div className="logo">
                <span style={{ color: "var(--pink)", fontWeight: 700, fontSize: 18 }}>
                  Both
                </span>
                <span
                  style={{
                    color: "var(--fg)",
                    fontWeight: 700,
                    fontSize: 18,
                    marginLeft: 6,
                  }}
                >
                  Are Online
                </span>
              </div>
            </div>

            <div className="nav-right">
              <div className="location hidden md:block">Kerala, India</div>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="btn-heart ml-3"
                title="Toggle theme"
              >
                <span className="theme-heart" aria-hidden>
                  {theme === "dark" ? "🌙" : "☀️"}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* push the page content down so it doesn't hide behind nav */}
        <div style={{ paddingTop: NAV_HEIGHT }}>
          <main className="max-w-7xl mx-auto px-6">{children}</main>
        </div>

        {/* footer — single clean panel */}
        <footer className="site-footer w-full mt-8">
          <div className="footer-panel max-w-7xl mx-auto p-6 bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-sm">
            <div className="footer-inner grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT */}
              <div className="left-footer text-left">
                <div
                  className="text-xl font-bold"
                  style={{ color: "var(--pink)", fontWeight: 700, fontSize: 18 }}
                >
                  Both
                </div>
                <div
                  className="text-xl font-bold mb-2"
                  style={{
                    color: "var(--fg)",
                    fontWeight: 700,
                    fontSize: 18,
                    marginLeft: 6,
                  }}
                >
                  Are Online
                </div>

                <div
                  className="text-sm opacity-80 leading-relaxed"
                  style={{ fontSize: 10 }}
                >
                  <div>Powered by Google Gemini</div>
                  <div>Made by two couples, built from lived experience</div>
                  <div>Kerala, India</div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="right-footer md:flex md:flex-col md:items-end md:justify-center text-left md:text-right">
                <div className="mt-2 text-sm opacity-80">
                <button type="button" onClick={() => setShowContactModal(true)} className="contact-btn">
  Contact Us
</button>

                </div>

                <div
                  className="mt-4 text-xs opacity-70"
                  style={{ fontSize: 10 }}
                >
                  Copyright © 2025 trudev. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* ⬇️ Contact modal rendered here */}
        {showContactModal && (
          <ContactForm onClose={() => setShowContactModal(false)} />
        )}
      </div>
    </>
  );
}
