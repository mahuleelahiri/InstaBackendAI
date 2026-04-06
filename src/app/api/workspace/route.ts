import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, toPostgresType, workspaceTable, safeIdentifier } from "@/lib/supabase";
import type { Blueprint, Column } from "@/types/blueprint";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blueprint } = body as { blueprint: Blueprint };

    if (!blueprint || !blueprint.tables) {
      return NextResponse.json({ error: "Invalid blueprint" }, { status: 400 });
    }

    // Generate a unique workspace ID
    const workspaceId = nanoid(12);
    blueprint.workspaceId = workspaceId;
    blueprint.createdAt = new Date().toISOString();

    // 1. Ensure the workspaces metadata table exists (no-op if it exists)
    await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS workspaces (
          id SERIAL PRIMARY KEY,
          workspace_id TEXT UNIQUE NOT NULL,
          business_name TEXT NOT NULL,
          business_description TEXT,
          blueprint JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });

    // Fallback: try direct insert and create via a different approach
    const { error: metaError } = await supabaseAdmin
      .from("workspaces")
      .insert({
        workspace_id: workspaceId,
        business_name: blueprint.businessName,
        business_description: blueprint.businessDescription,
        blueprint: blueprint,
      });

    if (metaError) {
      console.warn("[workspace] Could not save to workspaces table:", metaError.message);
      // Continue anyway — the dynamic tables are more important for the demo
    }

    // 2. Create each table and seed data
    for (const table of blueprint.tables) {
      const tableName = workspaceTable(workspaceId, table.name);
      const safeName = safeIdentifier(table.name);

      // Build CREATE TABLE SQL
      const columnDefs = table.columns.map((col: Column) => {
        const pgType = toPostgresType(col.type);
        return `  "${safeIdentifier(col.name)}" ${pgType}`;
      });

      const createSQL = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ${columnDefs.join(",\n          ")},
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabaseAdmin.rpc("exec_sql", {
        sql: createSQL,
      });

      if (createError) {
        console.error(`[workspace] Failed to create table ${tableName}:`, createError.message);
        // If exec_sql doesn't exist, remind the user to run supabase/setup.sql
        throw new Error(
          `Table creation failed. Have you run supabase/setup.sql in your Supabase SQL Editor? Error: ${createError.message}`
        );
      }

      // 3. Seed data insertion
      if (table.seedData && table.seedData.length > 0) {
        const sanitizedRows = table.seedData.map((row) => {
          const clean: Record<string, unknown> = {};
          table.columns.forEach((col: Column) => {
            const colName = safeIdentifier(col.name);
            if (row[col.name] !== undefined) {
              clean[colName] = row[col.name];
            } else if (row[colName] !== undefined) {
              clean[colName] = row[colName];
            }
          });
          return clean;
        });

        const { error: seedError } = await supabaseAdmin
          .from(tableName)
          .insert(sanitizedRows);

        if (seedError) {
          console.error(`[workspace] Failed to seed ${tableName}:`, seedError.message);
        }
      }

      console.log(`[workspace] Created and seeded table: ${tableName} (${safeIdentifier(safeName)})`);
    }

    return NextResponse.json(
      { workspaceId, blueprint },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/workspace] Error:", err);
    return NextResponse.json(
      { error: "Failed to create workspace. Check server logs." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({ workspace: data });
}
