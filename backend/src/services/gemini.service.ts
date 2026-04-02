import { GoogleGenAI } from "@google/genai";

export interface GeminiAnalysis {
  category: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  priority_score: number;
  summary: string;
  tags: string[];
}

const MODEL = "gemini-2.0-flash";

function safeParseJSON(text: string): GeminiAnalysis | null {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.category || !parsed.sentiment || !parsed.priority_score || !parsed.summary) {
      return null;
    }

    parsed.priority_score = Math.min(10, Math.max(1, Math.round(parsed.priority_score)));
    return parsed;
  } catch {
    return null;
  }
}

export const analyzeWithGemini = async (
  title: string,
  description: string
): Promise<GeminiAnalysis | null> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "DUMMY_GEMINI_KEY") {
    console.warn("⚠️ No API key — using mock");
    return getMockAnalysis(title, description);
  }

  // Create the client INSIDE the function so it reads the env var at call time
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze this product feedback and return ONLY valid JSON with exactly these fields:
{
  "category": "Bug | Feature Request | Improvement | Other",
  "sentiment": "Positive | Neutral | Negative",
  "priority_score": number between 1-10,
  "summary": "one short sentence",
  "tags": ["tag1", "tag2"]
}

Title: ${title}
Description: ${description}

Return ONLY the JSON object, nothing else.`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const text = res.text ?? "";
    const parsed = safeParseJSON(text);

    if (!parsed) throw new Error("Invalid JSON from Gemini");
    return parsed;
  } catch (err) {
    console.error("❌ Gemini analysis failed:", err);
    return getMockAnalysis(title, description);
  }
};

export const generateWeeklySummary = async (
  feedbackItems: Array<{ title: string; description: string; ai_category?: string }>
): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "DUMMY_GEMINI_KEY") {
    return "Mock summary: UI improvements, performance issues, and feature requests dominate.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const feedbackText = feedbackItems
    .slice(0, 20)
    .map((f, i) => `${i + 1}. [${f.ai_category || "General"}] ${f.title}: ${f.description.slice(0, 100)}`)
    .join("\n");

  const prompt = `You are a product analyst. Identify the top 3 themes from this feedback and write a concise executive summary in 3-4 sentences.

Feedback:
${feedbackText}`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return res.text ?? null;
  } catch (err) {
    console.error("❌ Weekly summary failed:", err);
    return null;
  }
};

function getMockAnalysis(title: string, _description: string): GeminiAnalysis {
  const categories = ["Bug", "Feature Request", "Improvement", "Other"] as const;
  const sentiments = ["Positive", "Neutral", "Negative"] as const;

  return {
    category: categories[Math.floor(Math.random() * categories.length)],
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    priority_score: Math.floor(Math.random() * 6) + 3,
    summary: `"${title}" analyzed as feedback.`,
    tags: ["UI", "Performance"],
  };
}