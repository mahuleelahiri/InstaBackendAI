import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (for client-side use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client with full privileges for DDL operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Map our Blueprint ColumnType to a PostgreSQL type string
 */
export function toPostgresType(colType: string): string {
  switch (colType) {
    case "integer":
      return "INTEGER";
    case "float":
      return "NUMERIC(10,2)";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "DATE";
    case "text":
    case "email":
    case "url":
    case "phone":
    case "select":
    case "textarea":
    default:
      return "TEXT";
  }
}

/**
 * Sanitize a workspace/table name to a safe SQL identifier
 */
export function safeIdentifier(id: string): string {
  return id.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 40);
}

/**
 * Build the full table name for a workspace table
 */
export function workspaceTable(workspaceId: string, tableName: string): string {
  return `ws_${safeIdentifier(workspaceId)}_${safeIdentifier(tableName)}`;
}
