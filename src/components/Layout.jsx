// src/components/Layout.jsx
import React from "react";
import "../styles/globals.css";

export default function Layout({ children }) {
  return (
    <>
      {/* Global Bokeh Background */}
      <div className="background" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div
        className="min-h-screen text-[var(--fg)] relative overflow-x-hidden"
        style={{ zIndex: 1 }}
      >
        {/* ===== NAVBAR ===== */}
        <nav className="nav-glass fixed inset-x-0 top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            {/* Left spacer */}
            <div className="nav-left w-1/3 flex items-center"></div>

            {/* Centered Logo */}
            <div className="nav-center w-1/3 flex items-center justify-center">
              <div className="flex items-baseline gap-2">
                <div
                  className="text-xl font-bold"
                  style={{ color: "var(--pink)" }}
                >
                  Both
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: "var(--fg)" }}
                >
                  Are Online
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="nav-right w-1/3 flex items-center justify-end">
              <button
                className="btn-heart theme-toggle"
                aria-label="Toggle theme"
                title="Toggle theme"
                onClick={() => {
                  document.documentElement.classList.toggle("dark");
                }}
              >
                <span className="theme-heart">♡</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Push content below navbar */}
        <div className="pt-20">
          <main className="max-w-7xl mx-auto px-6">{children}</main>
        </div>
      </div>
    </>
  );
}
