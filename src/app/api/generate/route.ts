import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body as { prompt: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid business description (at least 5 characters)",
        },
        { status: 400 }
      );
    }

    const blueprint = await generateBlueprint(prompt.trim());

    // Safety check — make sure Gemini returned a valid blueprint object
    if (!blueprint || typeof blueprint !== "object") {
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    if (!blueprint.tables || !Array.isArray(blueprint.tables)) {
      return NextResponse.json(
        { error: "AI did not return any tables. Please try a more specific business description." },
        { status: 500 }
      );
    }

    // Strip id from all table columns before sending to client
    // This prevents the "column id specified more than once" error downstream
    const cleanedBlueprint = {
      ...blueprint,
      tables: blueprint.tables.map((table: any) => ({
        ...table,
        columns: table.columns.filter(
          (col: any) => col.name?.toLowerCase() !== "id"
        ),
        sampleData: table.sampleData?.map((row: any) => {
          const { id, ...rest } = row;
          return rest;
        }),
      })),
    };

    return NextResponse.json({ blueprint: cleanedBlueprint }, { status: 200 });
  } catch (err) {
    console.error("[/api/generate] Error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to generate blueprint. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}