import { supabaseAdmin } from "@/lib/supabase";
import type { Blueprint } from "@/types/blueprint";
import Link from "next/link";

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "3rem" }}>🔍</div>
        <h2 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Workspace not found</h2>
        <p style={{ color: "var(--text-muted)" }}>
          This workspace ID does not exist or has expired.
        </p>
        <Link href="/" className="btn-primary">
          ← Create a new backend
        </Link>
      </div>
    );
  }

  const blueprint = data.blueprint as Blueprint;

  return (
    <div style={{ padding: "2rem 2.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "2.5rem" }}>{blueprint.theme?.icon}</span>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {blueprint.businessName}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {blueprint.businessDescription}
            </p>
          </div>
          <span className="badge badge-green" style={{ marginLeft: "auto" }}>
            ● Live
          </span>
        </div>

        {/* API base URL */}
        <div
          className="code-block"
          style={{ marginTop: "1rem", fontSize: "0.8rem" }}
        >
          <span style={{ color: "var(--text-muted)" }}>Base URL: </span>
          <span style={{ color: "var(--accent-cyan)" }}>
            /api/data/{workspaceId}/{"{"}"table{"}"}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {[
          { label: "Tables", value: blueprint.tables?.length || 0, icon: "🗂️", color: "var(--accent-cyan)" },
          { label: "Total Rows", value: `${(blueprint.tables?.length || 0) * 20}+`, icon: "📊", color: "var(--accent-green)" },
          { label: "API Methods", value: 4, icon: "⚡", color: "var(--accent-violet)" },
          { label: "Status", value: "Live", icon: "🚀", color: "var(--accent-orange)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass glass-hover"
            style={{ padding: "1.25rem", borderRadius: "14px" }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tables grid */}
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
      >
        Database Tables
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {blueprint.tables?.map((table) => (
          <Link
            key={table.name}
            href={`/dashboard/${workspaceId}/${table.name}`}
            style={{ textDecoration: "none" }}
          >
            <div
              className="glass glass-hover"
              style={{ padding: "1.25rem", borderRadius: "14px", cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>{table.icon}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {table.label}
                  </span>
                </div>
                <span className="badge badge-green" style={{ fontSize: "0.65rem" }}>
                  20+
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {table.columns?.slice(0, 4).map((col) => (
                  <span
                    key={col.name}
                    className="badge badge-cyan"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {col.label}
                  </span>
                ))}
                {(table.columns?.length || 0) > 4 && (
                  <span className="badge" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                    +{table.columns.length - 4} more
                  </span>
                )}
              </div>

              <div
                style={{
                  marginTop: "0.875rem",
                  fontSize: "0.75rem",
                  color: "var(--accent-cyan)",
                  fontWeight: 500,
                }}
              >
                View Table →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* API Endpoints */}
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
      >
        Live API Endpoints
      </h2>
      <div className="glass" style={{ borderRadius: "14px", overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {blueprint.tables?.flatMap((table) => [
              {
                method: "GET",
                path: `/api/data/${workspaceId}/${table.name}`,
                desc: `List all ${table.label}`,
                color: "var(--accent-green)",
              },
              {
                method: "POST",
                path: `/api/data/${workspaceId}/${table.name}`,
                desc: `Create a new ${table.label.slice(0, -1)}`,
                color: "var(--accent-cyan)",
              },
            ]).slice(0, 8).map((ep, i) => (
              <tr key={i}>
                <td>
                  <span
                    className="badge code"
                    style={{
                      background: "transparent",
                      border: `1px solid ${ep.color}`,
                      color: ep.color,
                    }}
                  >
                    {ep.method}
                  </span>
                </td>
                <td>
                  <span className="code" style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    {ep.path}
                  </span>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{ep.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
