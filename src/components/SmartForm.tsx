"use client";

import { useState } from "react";
import type { Column } from "@/types/blueprint";

interface SmartFormProps {
  columns: Column[];
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  title?: string;
}

function SmartInput({
  col,
  value,
  onChange,
}: {
  col: Column;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  switch (col.type) {
    case "boolean":
      return (
        <label className="toggle-wrapper">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      );

    case "select":
      return (
        <select
          className="input-field"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {col.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "date":
      return (
        <input
          type="date"
          className="input-field"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          required={col.required}
        />
      );

    case "integer":
      return (
        <input
          type="number"
          step="1"
          className="input-field"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
          placeholder={col.hint || col.label}
          required={col.required}
        />
      );

    case "float":
      return (
        <input
          type="number"
          step="0.01"
          className="input-field"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder={col.hint || col.label}
          required={col.required}
        />
      );

    case "email":
      return (
        <input
          type="email"
          className="input-field"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={col.hint || "email@example.com"}
          required={col.required}
        />
      );

    case "url":
      return (
        <input
          type="url"
          className="input-field"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={col.hint || "https://example.com"}
          required={col.required}
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          className="input-field"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={col.hint || "+91 98765 43210"}
          required={col.required}
        />
      );

    case "textarea":
      return (
        <textarea
          className="input-field"
          rows={3}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={col.hint || col.label}
          required={col.required}
          style={{ resize: "vertical" }}
        />
      );

    default:
      return (
        <input
          type="text"
          className="input-field"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={col.hint || col.label}
          required={col.required}
        />
      );
  }
}

export default function SmartForm({
  columns,
  initialData,
  onSubmit,
  onCancel,
  title = "Add Row",
}: SmartFormProps) {
  const editableCols = columns.filter((c) => c.name !== "id" && c.name !== "created_at");

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    editableCols.forEach((col) => {
      if (initialData && initialData[col.name] !== undefined) {
        init[col.name] = initialData[col.name];
      } else {
        switch (col.type) {
          case "boolean": init[col.name] = false; break;
          case "integer": case "float": init[col.name] = null; break;
          default: init[col.name] = "";
        }
      }
    });
    return init;
  });

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="glass"
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(0,212,255,0.2)",
      }}
    >
      {/* Form header */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          background: "rgba(0,212,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>
          {title}
        </h3>
        <button
          type="button"
          className="btn-ghost"
          onClick={onCancel}
          style={{ padding: "0.3rem 0.7rem" }}
        >
          ✕ Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {editableCols.map((col) => (
            <div key={col.name}>
              <label
                htmlFor={`field-${col.name}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.4rem",
                }}
              >
                {col.label}
                {col.required && (
                  <span style={{ color: "var(--accent-orange)", fontSize: "0.7rem" }}>*</span>
                )}
                <span
                  className="badge"
                  style={{
                    fontSize: "0.6rem",
                    padding: "0.1rem 0.35rem",
                    background: "rgba(139,92,246,0.1)",
                    color: "var(--accent-violet)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    marginLeft: "auto",
                    fontWeight: 500,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  {col.type}
                </span>
              </label>

              {/* Boolean gets full-row treatment */}
              {col.type === "boolean" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", height: "38px" }}>
                  <SmartInput
                    col={col}
                    value={formData[col.name]}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, [col.name]: val }))
                    }
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {formData[col.name] ? "Yes" : "No"}
                  </span>
                </div>
              ) : (
                <SmartInput
                  col={col}
                  value={formData[col.name]}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, [col.name]: val }))
                  }
                />
              )}

              {col.hint && (
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {col.hint}
                </p>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            id="form-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(0,0,0,0.3)",
                    borderTopColor: "rgba(0,0,0,0.8)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                  }}
                />
                Saving…
              </>
            ) : initialData ? (
              "Update Row"
            ) : (
              "Add Row"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
