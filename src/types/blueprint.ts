export type ColumnType =
  | "text"
  | "integer"
  | "float"
  | "boolean"
  | "date"
  | "select"
  | "email"
  | "url"
  | "phone"
  | "textarea";

export interface Column {
  name: string;         // snake_case DB column name
  label: string;        // Human-readable label
  type: ColumnType;
  options?: string[];   // For "select" type
  required?: boolean;
  hint?: string;        // UI hint e.g. "Expiry date of the medicine"
  isPrimary?: boolean;  // Mark as the display/primary field
}

export interface Table {
  name: string;         // snake_case table name (e.g. "medicines")
  label: string;        // Display name (e.g. "Medicines")
  icon: string;         // Emoji icon
  columns: Column[];
  seedData: Record<string, unknown>[];
}

export interface Theme {
  primaryColor: string;    // hex color
  secondaryColor: string;  // hex color
  accentColor: string;     // hex color
  icon: string;            // Emoji for the business
  darkMode: boolean;
  businessType: string;    // e.g. "pharmacy", "retail", "education"
}

export interface Blueprint {
  workspaceId: string;
  businessName: string;
  businessDescription: string;
  tables: Table[];
  theme: Theme;
  createdAt: string;
}

export interface WorkspaceMeta {
  id: string;
  workspace_id: string;
  business_name: string;
  business_description: string;
  blueprint: Blueprint;
  created_at: string;
}
