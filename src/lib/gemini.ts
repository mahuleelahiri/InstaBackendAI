import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Blueprint, Table, Theme } from "@/types/blueprint";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a backend architect AI. Given a one-sentence business description, you must generate a complete backend blueprint as a single valid JSON object.

RULES:
1. Generate EXACTLY 3–5 relevant database tables for the business
2. Each table must have 4–8 columns (including an "id" column as TEXT type isPrimary=false — do NOT mark id as isPrimary)
3. One column per table should have isPrimary: true (the main display field, e.g. name, title, medicine_name)
4. Column types: text, integer, float, boolean, date, select, email, url, phone, textarea
5. For "select" type, always provide an "options" array with 3–6 realistic choices
6. Generate EXACTLY 12 realistic seed data rows per table. NOT generic. Use real-sounding names, prices, dates, etc.
7. Seed data must match column types (booleans as true/false, integers as numbers, dates as "YYYY-MM-DD" strings)
8. Do NOT include an "id" field in seedData rows — these will be auto-generated
9. Theme colors must be valid hex codes matching the business vibe
10. Return ONLY valid JSON, no markdown, no explanation

OUTPUT FORMAT (strict):
{
  "businessName": "string — derived from the prompt",
  "businessDescription": "string — the original prompt",
  "tables": [
    {
      "name": "table_name_snake_case",
      "label": "Table Display Name",
      "icon": "single emoji",
      "columns": [
        {
          "name": "column_name",
          "label": "Column Label",
          "type": "text|integer|float|boolean|date|select|email|url|phone|textarea",
          "options": ["only for select type"],
          "required": true,
          "hint": "optional UI hint",
          "isPrimary": false
        }
      ],
      "seedData": [
        { "column_name": "value", ... }
      ]
    }
  ],
  "theme": {
    "primaryColor": "#hexcode",
    "secondaryColor": "#hexcode",
    "accentColor": "#hexcode",
    "icon": "single emoji for the business",
    "darkMode": true,
    "businessType": "pharmacy|retail|education|food|sports|tech|healthcare|finance|other"
  }
}`;

// Model cascade: try each in order when one is overloaded
const MODEL_CASCADE = [
  "gemini-2.5-flash",       // fastest, confirmed working
  "gemini-2.5-flash-lite",  // lightweight fallback, confirmed working
  "gemini-2.0-flash",       // older fallback
];

export async function generateBlueprint(prompt: string): Promise<Blueprint> {

  const userMessage = `Business description: "${prompt}"

Generate the backend blueprint JSON now.`;

  let lastError: unknown;

  // Try each model in the cascade; move to the next on transient errors
  for (let modelIdx = 0; modelIdx < MODEL_CASCADE.length; modelIdx++) {
    const modelName = MODEL_CASCADE[modelIdx];
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.7, maxOutputTokens: 65536 },
    });

    // Each model gets up to 2 attempts (handles a single transient blip)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[gemini] Trying ${modelName} (attempt ${attempt + 1})…`);
        const result = await model.generateContent([
          { text: SYSTEM_PROMPT },
          { text: userMessage },
        ]);

        const text = result.response.text().trim();

        // Strip any markdown code fences if Gemini adds them
        const jsonText = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        let parsed: Omit<Blueprint, "workspaceId" | "createdAt">;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          const match = jsonText.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("Gemini did not return valid JSON");
          parsed = JSON.parse(match[0]);
        }

        if (!parsed.tables || !Array.isArray(parsed.tables)) {
          throw new Error("Blueprint missing tables array");
        }

        console.log(`[gemini] Success with ${modelName}`);
        return {
          workspaceId: "",
          businessName: parsed.businessName || "My Business",
          businessDescription: parsed.businessDescription || prompt,
          tables: parsed.tables as Table[],
          theme: parsed.theme as Theme,
          createdAt: new Date().toISOString(),
        };
      } catch (err: unknown) {
        lastError = err;
        const errStr = String(err);

        // Fast-fail on definitive API key errors — no point retrying
        if (
          errStr.includes("API_KEY_INVALID") ||
          errStr.includes("API key expired") ||
          errStr.includes("API_KEY_SERVICE_BLOCKED") ||
          errStr.includes("invalid API key") ||
          errStr.includes("400")
        ) {
          throw new Error(
            "Gemini API key is invalid or expired. Please go to aistudio.google.com/app/apikey, create a new key, and paste it into .env.local as GEMINI_API_KEY=..."
          );
        }

        // Model not found (deprecated / wrong name) — skip to next model immediately
        if (errStr.includes("404") || errStr.includes("Not Found")) {
          const nextModel = MODEL_CASCADE[modelIdx + 1];
          console.log(
            `[gemini] ${modelName} not available (404).${
              nextModel ? ` Skipping to ${nextModel}…` : " No more models to try."
            }`
          );
          break; // break inner loop → advance modelIdx
        }

        const isTransient =
          errStr.includes("429") ||
          errStr.includes("503") ||
          errStr.includes("quota") ||
          errStr.includes("Too Many Requests") ||
          errStr.includes("Service Unavailable") ||
          errStr.includes("high demand");

        if (isTransient) {
          if (attempt === 1) {
            // Both attempts on this model failed — fall back to next model
            const nextModel = MODEL_CASCADE[modelIdx + 1];
            if (nextModel) {
              console.log(`[gemini] ${modelName} overloaded. Falling back to ${nextModel}…`);
              await new Promise((r) => setTimeout(r, 1500));
            }
            break; // break inner loop → advance modelIdx
          } else {
            // First attempt failed — one quick retry on same model
            console.log(`[gemini] ${modelName} transient error, retrying once…`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
        }

        // Non-transient, non-key, non-404 error — surface immediately
        throw err;
      }
    }
  }

  throw new Error(
    "All Gemini models are currently overloaded. Please try again in a minute."
  );
}
