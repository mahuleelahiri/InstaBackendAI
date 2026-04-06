"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { Blueprint } from "@/types/blueprint";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlueprint() {
      try {
        const res = await fetch(`/api/workspace?workspaceId=${workspaceId}`);
        if (res.ok) {
          const { workspace } = await res.json();
          setBlueprint(workspace.blueprint as Blueprint);
        }
      } catch (err) {
        console.error("Failed to fetch workspace:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlueprint();
  }, [workspaceId]);

  const activeTable = pathname.split("/").pop();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className="glass"
        style={{
          width: "260px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          padding: "1.25rem",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            marginBottom: "1.5rem",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>
            {blueprint?.theme?.icon || "⚡"}
          </span>
          <div>
            <div
              className="gradient-text"
              style={{ fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.2 }}
            >
              InstaBackend
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>
              AI Admin Panel
            </div>
          </div>
        </Link>

        {/* Workspace info */}
        {blueprint && (
          <div
            style={{
              padding: "0.75rem",
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.15)",
              borderRadius: "10px",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
              {blueprint.theme?.icon}
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              {blueprint.businessName}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              ID: {workspaceId}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.5rem",
              padding: "0 0.25rem",
            }}
          >
            Tables
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "38px",
                    background: "var(--bg-card)",
                    borderRadius: "10px",
                    animation: "pulse-glow 1.5s ease infinite",
                  }}
                />
              ))}
            </div>
          ) : blueprint?.tables ? (
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <Link
                href={`/dashboard/${workspaceId}`}
                className={`sidebar-item ${pathname === `/dashboard/${workspaceId}` ? "active" : ""}`}
              >
                <span style={{ fontSize: "1rem" }}>🏠</span>
                Overview
              </Link>
              {blueprint.tables.map((table) => (
                <Link
                  key={table.name}
                  href={`/dashboard/${workspaceId}/${table.name}`}
                  className={`sidebar-item ${activeTable === table.name ? "active" : ""}`}
                >
                  <span style={{ fontSize: "1rem" }}>{table.icon}</span>
                  {table.label}
                  <span
                    className="badge badge-cyan"
                    style={{ marginLeft: "auto", fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}
                  >
                    20+
                  </span>
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        {/* API URL section */}
        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Public API
          </div>
          <div
            className="code-block"
            style={{ fontSize: "0.65rem", wordBreak: "break-all", lineHeight: 1.5 }}
          >
            /api/data/{workspaceId}/
            <span style={{ color: "var(--accent-cyan)" }}>{"{"}"table{"}"}</span>
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
            GET · POST · PUT · DELETE
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
