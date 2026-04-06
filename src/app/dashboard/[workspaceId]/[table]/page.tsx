"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Blueprint, Table, Column } from "@/types/blueprint";
import SmartTable from "@/components/SmartTable";
import SmartForm from "@/components/SmartForm";

export default function TablePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const tableName = params.table as string;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [tableConfig, setTableConfig] = useState<Table | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState("");
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    setApiUrl(`${window.location.origin}/api/data/${workspaceId}/${tableName}`);
  }, [workspaceId, tableName]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/data/${workspaceId}/${tableName}?limit=100&search=${encodeURIComponent(search)}`
      );
      if (res.ok) {
        const { data } = await res.json();
        setRows(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch rows:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, tableName, search]);

  useEffect(() => {
    async function init() {
      try {
        const wsRes = await fetch(`/api/workspace?workspaceId=${workspaceId}`);
        if (wsRes.ok) {
          const { workspace } = await wsRes.json();
          const bp = workspace.blueprint as Blueprint;
          setBlueprint(bp);
          const tbl = bp.tables.find((t) => t.name === tableName) || null;
          setTableConfig(tbl);
        }
      } catch (err) {
        console.error("Failed to load blueprint:", err);
      }
    }
    init();
  }, [workspaceId, tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this row?")) return;
    await fetch(`/api/data/${workspaceId}/${tableName}?id=${id}`, {
      method: "DELETE",
    });
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleFormSubmit(data: Record<string, unknown>) {
    if (editRow) {
      // Update
      const res = await fetch(
        `/api/data/${workspaceId}/${tableName}?id=${editRow.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (res.ok) {
        const { data: updated } = await res.json();
        setRows((prev) =>
          prev.map((r) => (r.id === editRow.id ? updated : r))
        );
      }
    } else {
      // Create
      const res = await fetch(`/api/data/${workspaceId}/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchData();
      }
    }
    setShowForm(false);
    setEditRow(null);
  }

  const columns = tableConfig?.columns || [];

  return (
    <div style={{ padding: "2rem 2.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.75rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.75rem" }}>{tableConfig?.icon || "🗂️"}</span>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {tableConfig?.label || tableName}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              {rows.length} records · {columns.length} columns
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: "200px" }}
          />
          <button
            id="add-row-btn"
            className="btn-primary"
            onClick={() => {
              setEditRow(null);
              setShowForm(true);
            }}
          >
            + Add Row
          </button>
        </div>
      </div>

      {/* API URL strip */}
      {apiUrl && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.625rem 1rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            overflowX: "auto",
          }}
        >
          <span className="badge badge-green" style={{ flexShrink: 0 }}>GET</span>
          <span className="code" style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", flex: 1, whiteSpace: "nowrap" }}>
            {apiUrl}
          </span>
          <button
            className="btn-ghost"
            style={{ flexShrink: 0, fontSize: "0.75rem" }}
            onClick={() => navigator.clipboard.writeText(apiUrl)}
          >
            Copy
          </button>
          <a
            href={apiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{ flexShrink: 0, fontSize: "0.75rem" }}
          >
            Open ↗
          </a>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && tableConfig && (
        <div style={{ marginBottom: "1.5rem" }}>
          <SmartForm
            columns={columns}
            initialData={editRow || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditRow(null);
            }}
            title={editRow ? `Edit ${tableConfig.label}` : `Add ${tableConfig.label}`}
          />
        </div>
      )}

      {/* Table */}
      <div className="glass" style={{ borderRadius: "14px", overflow: "hidden" }}>
        <SmartTable
          columns={columns}
          rows={rows}
          loading={loading}
          onEdit={(row) => {
            setEditRow(row);
            setShowForm(true);
          }}
          onDelete={(row) => handleDelete(row.id as string)}
        />
      </div>
    </div>
  );
}
