const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';
const API_URL = 'https://api.anthropic.com/v1/messages';

export interface EntryForAnalysis {
  date: string;
  pain: number;
  energy: number;
  mood: number;
  sleepHrs: number;
  sleepQuality: number;
  notes: string;
  medications: string[];
  foodTags: string[];
}

export interface Insight {
  title: string;
  description: string;
  variables: string[];
  confidence: 'high' | 'medium' | 'low';
  trend: 'positive' | 'negative' | 'neutral';
}

export interface InsightsResult {
  insights: Insight[];
  digest: string;
  avgPain: number;
  avgEnergy: number;
  avgMood: number;
  avgSleep: number;
}

export async function generateInsights(
  entries: EntryForAnalysis[]
): Promise<InsightsResult> {
  const avgPain = avg(entries.map((e) => e.pain));
  const avgEnergy = avg(entries.map((e) => e.energy));
  const avgMood = avg(entries.map((e) => e.mood));
  const avgSleep = avg(entries.map((e) => e.sleepHrs));

  const prompt = `
You are a health pattern analyst. Analyze the following ${entries.length} days of symptom journal data and find meaningful correlations and patterns.

DATA (newest first):
${JSON.stringify(entries, null, 2)}

AVERAGES:
- Pain: ${avgPain}/10
- Energy: ${avgEnergy}/10  
- Mood: ${avgMood}/10
- Sleep: ${avgSleep} hours

Your job is to find real patterns — especially LAGGED effects (did something on day N affect day N+1 or N+2?), weekly cycles, and correlations between variables like sleep/pain, food/mood, medications/energy.

Respond with ONLY a valid JSON object in this exact format, no other text:
{
  "insights": [
    {
      "title": "Short punchy title under 10 words",
      "description": "2-3 sentences explaining the pattern with specific numbers from the data",
      "variables": ["Variable 1", "Variable 2"],
      "confidence": "high" | "medium" | "low",
      "trend": "positive" | "negative" | "neutral"
    }
  ],
  "digest": "2-3 sentence plain English summary of the week. Conversational tone, like a friend reading your journal."
}

Rules:
- Find 3-5 insights maximum
- Only report patterns that actually exist in the data
- Use specific numbers and dates when describing patterns
- confidence is high if pattern appears 5+ times, medium if 3-4 times, low if 2-3 times
- Be honest if data is too limited — say so in the digest
- Never invent patterns that aren't in the data
`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  return {
    insights: parsed.insights ?? [],
    digest: parsed.digest ?? '',
    avgPain,
    avgEnergy,
    avgMood,
    avgSleep,
  };
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}