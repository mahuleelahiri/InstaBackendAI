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

export async function generateBlueprint(prompt: string): Promise<Blueprint> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 65536,
    },
  });

  const userMessage = `Business description: "${prompt}"

Generate the backend blueprint JSON now.`;

  // Retry up to 2 times on 429 rate limit
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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

      // Never retry key errors — fail fast with clear message
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

      // On rate limit (429), wait then retry
      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("Too Many Requests")) {
        const retryMatch = errStr.match(/retryDelay["\s:]+(\d+)/);
        const waitSecs = retryMatch ? parseInt(retryMatch[1]) + 2 : 15;
        if (attempt < 2) {
          console.log(`[gemini] Rate limited. Waiting ${waitSecs}s before retry ${attempt + 1}/2…`);
          await new Promise((r) => setTimeout(r, waitSecs * 1000));
          continue;
        }
        throw new Error(
          `Rate limit exceeded. Please wait a minute and try again.`
        );
      }

      // Any other error — surface it immediately
      throw err;
    }
  }

  throw lastError;
}
