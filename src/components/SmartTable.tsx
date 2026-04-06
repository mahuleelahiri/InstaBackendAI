"use client";

import type { Column } from "@/types/blueprint";

interface SmartTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
}

function formatValue(value: unknown, col: Column): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>;
  }

  switch (col.type) {
    case "boolean":
      return (
        <span className={`badge ${value ? "badge-green" : "badge-red"}`}>
          {value ? "Yes" : "No"}
        </span>
      );

    case "date":
      try {
        const d = new Date(value as string);
        return (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>
            {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        );
      } catch {
        return <span>{String(value)}</span>;
      }

    case "select":
      return <span className="badge badge-violet">{String(value)}</span>;

    case "float":
    case "integer":
      return (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: "var(--accent-cyan)" }}>
          {typeof value === "number"
            ? col.type === "float"
              ? value.toFixed(2)
              : value.toLocaleString()
            : String(value)}
        </span>
      );

    case "email":
      return (
        <a
          href={`mailto:${value}`}
          style={{ color: "var(--accent-cyan)", textDecoration: "none", fontSize: "0.875rem" }}
        >
          {String(value)}
        </a>
      );

    case "url":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-cyan)", textDecoration: "none", fontSize: "0.875rem" }}
        >
          {String(value).replace(/^https?:\/\//, "").slice(0, 30)}…
        </a>
      );

    case "phone":
      return (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>
          {String(value)}
        </span>
      );

    case "textarea":
      const text = String(value);
      return (
        <span title={text} style={{ color: "var(--text-secondary)" }}>
          {text.length > 50 ? text.slice(0, 50) + "…" : text}
        </span>
      );

    default:
      return (
        <span style={{ color: "var(--text-primary)" }}>
          {String(value).length > 40 ? String(value).slice(0, 40) + "…" : String(value)}
        </span>
      );
  }
}

export default function SmartTable({
  columns,
  rows,
  loading = false,
  onEdit,
  onDelete,
}: SmartTableProps) {
  // Visible columns (exclude "id" and "created_at" from display, keep in data)
  const visibleCols = columns.filter(
    (c) => c.name !== "id" && c.name !== "created_at"
  );

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: "48px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              animation: "pulse-glow 1.5s ease infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
        <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
          No records found
        </div>
        <div style={{ fontSize: "0.85rem" }}>
          Click &quot;Add Row&quot; to create the first entry.
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            {visibleCols.map((col) => (
              <th key={col.name}>
                {col.label}
                {col.isPrimary && (
                  <span style={{ marginLeft: "0.35rem", color: "var(--accent-cyan)", fontSize: "0.65rem" }}>
                    ★
                  </span>
                )}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th style={{ textAlign: "right" }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={(row.id as string) || idx} className="animate-fade-in">
              {visibleCols.map((col) => {
                // Try both snake_case name and camelCase
                const val = row[col.name] ?? row[col.name.toLowerCase()];
                return (
                  <td key={col.name} title={val !== null && val !== undefined ? String(val) : ""}>
                    {formatValue(val, col)}
                  </td>
                );
              })}
              {(onEdit || onDelete) && (
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                    {onEdit && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}
                        onClick={() => onEdit(row)}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="btn-danger"
                        onClick={() => onDelete(row)}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
