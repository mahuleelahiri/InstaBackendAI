import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, workspaceTable, safeIdentifier } from "@/lib/supabase";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; table: string }> }
) {
  const { workspaceId, table } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100");
  const search = searchParams.get("search") || "";
  const tableName = workspaceTable(workspaceId, table);

  let query = supabaseAdmin
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: `Table not found or query failed: ${error.message}` },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  // Client-side search filter if needed
  let filtered = data || [];
  if (search && filtered.length > 0) {
    const lower = search.toLowerCase();
    filtered = filtered.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(lower)
      )
    );
  }

  return NextResponse.json(
    { data: filtered, count: filtered.length },
    { headers: CORS_HEADERS }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; table: string }> }
) {
  const { workspaceId, table } = await params;
  const tableName = workspaceTable(workspaceId, table);
  const body = await request.json();

  // Sanitize keys
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    sanitized[safeIdentifier(k)] = v;
  }
  // Remove id if included — let DB generate it
  delete sanitized["id"];

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .insert(sanitized)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ data }, { status: 201, headers: CORS_HEADERS });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; table: string }> }
) {
  const { workspaceId, table } = await params;
  const tableName = workspaceTable(workspaceId, table);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Query param 'id' is required for PUT" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const body = await request.json();
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    sanitized[safeIdentifier(k)] = v;
  }
  delete sanitized["id"];
  delete sanitized["created_at"];

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .update(sanitized)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ data }, { headers: CORS_HEADERS });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; table: string }> }
) {
  const { workspaceId, table } = await params;
  const tableName = workspaceTable(workspaceId, table);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Query param 'id' is required for DELETE" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
