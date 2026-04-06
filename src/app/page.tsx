"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Blueprint } from "@/types/blueprint";

const STEPS = [
  { id: "ai", label: "Analyzing with Gemini AI…", icon: "🤖" },
  { id: "blueprint", label: "Designing database schema…", icon: "🗂️" },
  { id: "tables", label: "Creating database tables…", icon: "🏗️" },
  { id: "seeding", label: "Seeding realistic data…", icon: "🌱" },
  { id: "api", label: "Wiring up REST API…", icon: "⚡" },
  { id: "done", label: "Your backend is live!", icon: "🚀" },
];

const EXAMPLES = [
  "I need a backend for a Pharmacy",
  "Build me a Cricket Academy management system",
  "I want a backend for a Tiffin Delivery Service",
  "Create a Pet Shop inventory system",
  "I need a backend for a Space Tourism Agency",
  "Build me a Library management system",
];

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState("");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setError("");
    setLoading(true);
    setCurrentStep(0);

    try {
      // Step 0: AI generation
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!genRes.ok) {
        const { error: e } = await genRes.json();
        throw new Error(e || "Generation failed");
      }

      const { blueprint } = (await genRes.json()) as { blueprint: Blueprint };
      setCurrentStep(1);
      await sleep(400);
      setCurrentStep(2);

      // Step 2: Create workspace
      const wsRes = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint }),
      });

      if (!wsRes.ok) {
        const { error: e } = await wsRes.json();
        throw new Error(e || "Workspace creation failed");
      }

      const { workspaceId } = await wsRes.json();
      setCurrentStep(3);
      await sleep(500);
      setCurrentStep(4);
      await sleep(400);
      setCurrentStep(5);
      await sleep(800);

      router.push(`/dashboard/${workspaceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setCurrentStep(-1);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      {/* Header */}
      <div
        className="animate-slide-up"
        style={{ textAlign: "center", marginBottom: "3rem" }}
      >
        {/* Logo badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 1rem",
            background: "rgba(0, 212, 255, 0.08)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: "999px",
            marginBottom: "1.5rem",
            fontSize: "0.8rem",
            color: "var(--accent-cyan)",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          <span className="animate-pulse-glow" style={{ fontSize: "0.6rem" }}>
            ●
          </span>
          POWERED BY GEMINI 1.5 FLASH + SUPABASE
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: "1rem",
            letterSpacing: "-0.03em",
          }}
        >
          <span className="gradient-text">InstaBackend</span>
          <span style={{ color: "var(--text-primary)" }}> AI</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "var(--text-secondary)",
            maxWidth: "540px",
            lineHeight: 1.6,
            margin: "0 auto 0.75rem",
          }}
        >
          Type one sentence. Get a{" "}
          <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>
            live REST API
          </span>
          , a seeded database with 20+ realistic rows, and a beautiful admin
          panel — all in{" "}
          <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
            15 seconds
          </span>
          .
        </p>
      </div>

      {/* Main Card */}
      <div
        className="glass animate-slide-up"
        style={{
          width: "100%",
          maxWidth: "680px",
          borderRadius: "20px",
          padding: "2rem",
          animationDelay: "0.1s",
        }}
      >
        {!loading ? (
          <>
            <label
              htmlFor="business-prompt"
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "0.75rem",
              }}
            >
              Describe your business
            </label>

            <textarea
              id="business-prompt"
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I need a backend for a Pharmacy"
              rows={3}
              className="input-field"
              style={{
                resize: "none",
                fontSize: "1.05rem",
                marginBottom: "1rem",
                lineHeight: 1.6,
              }}
            />

            {/* Example chips */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="btn-ghost"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}
                >
                  {ex}
                </button>
              ))}
            </div>

            {error && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "10px",
                  color: "#f87171",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              id="generate-btn"
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: "1rem", padding: "0.875rem" }}
            >
              Generate My Backend →
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.75rem",
              }}
            >
              Press ⌘+Enter to generate · No signup required
            </p>
          </>
        ) : (
          /* Loading state with step ticker */
          <div style={{ padding: "1rem 0" }}>
            <div
              style={{
                textAlign: "center",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "0.75rem",
                  animation: "spin 2s linear infinite",
                  display: "inline-block",
                }}
              >
                ⚙️
              </div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                Building your backend…
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                &quot;{prompt}&quot;
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {STEPS.map((step, idx) => {
                const done = idx < currentStep;
                const active = idx === currentStep;
                return (
                  <div
                    key={step.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      background: active
                        ? "rgba(0, 212, 255, 0.06)"
                        : done
                        ? "rgba(16, 217, 168, 0.04)"
                        : "transparent",
                      border: active
                        ? "1px solid rgba(0, 212, 255, 0.2)"
                        : done
                        ? "1px solid rgba(16, 217, 168, 0.15)"
                        : "1px solid transparent",
                      transition: "all 0.3s ease",
                      opacity: idx > currentStep ? 0.3 : 1,
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>
                      {done ? "✅" : active ? step.icon : step.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: active ? 600 : 400,
                        color: active
                          ? "var(--accent-cyan)"
                          : done
                          ? "var(--accent-green)"
                          : "var(--text-muted)",
                      }}
                    >
                      {step.label}
                    </span>
                    {active && (
                      <span
                        style={{
                          marginLeft: "auto",
                          width: "16px",
                          height: "16px",
                          border: "2px solid var(--accent-cyan)",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {done && (
                      <span style={{ marginLeft: "auto", color: "var(--accent-green)", fontSize: "0.8rem" }}>
                        Done
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      {!loading && (
        <div
          className="animate-slide-up"
          style={{
            display: "flex",
            gap: "2.5rem",
            marginTop: "3rem",
            animationDelay: "0.2s",
          }}
        >
          {[
            { value: "15s", label: "Setup time" },
            { value: "20+", label: "Rows per table" },
            { value: "4", label: "REST methods" },
            { value: "∞", label: "Workspaces" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                className="gradient-text"
                style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1 }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "3rem",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          textAlign: "center",
        }}
      >
        Built with ❤️ using Next.js · Gemini 1.5 Flash · Supabase
      </footer>
    </main>
  );
}
