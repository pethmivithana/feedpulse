import { analyzeWithGemini } from '../services/gemini.service';

// ✅ Test 10 — Gemini mock returns correct structure
test('analyzeWithGemini — returns mock when no API key set', async () => {
  const original = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'DUMMY_GEMINI_KEY';

  const result = await analyzeWithGemini('Test title', 'Test description that is long enough');

  expect(result).not.toBeNull();
  expect(result?.category).toBeDefined();
  expect(result?.sentiment).toMatch(/Positive|Neutral|Negative/);
  expect(result?.priority_score).toBeGreaterThanOrEqual(1);
  expect(result?.priority_score).toBeLessThanOrEqual(10);
  expect(Array.isArray(result?.tags)).toBe(true);

  process.env.GEMINI_API_KEY = original;
});