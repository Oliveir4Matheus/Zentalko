import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import claudeOk from '../fixtures/llm-responses/claude-ok.json';
import geminiOk from '../fixtures/llm-responses/gemini-ok.json';
import openaiOk from '../fixtures/llm-responses/openai-ok.json';
import openrouterOk from '../fixtures/llm-responses/openrouter-ok.json';

/**
 * Default handlers: every provider returns a valid completion.
 * Individual tests override with `server.use(...)` to simulate failures.
 */
export const handlers = [
  http.post('https://api.anthropic.com/v1/messages', () => HttpResponse.json(claudeOk)),
  http.post(
    'https://generativelanguage.googleapis.com/v1beta/*',
    () => HttpResponse.json(geminiOk),
  ),
  http.post('https://api.openai.com/v1/chat/completions', () => HttpResponse.json(openaiOk)),
  http.post(
    'https://openrouter.ai/api/v1/chat/completions',
    () => HttpResponse.json(openrouterOk),
  ),
];

export const server = setupServer(...handlers);

// Named helpers that individual tests can import to simulate each failure mode.
export const failures = {
  network: () => HttpResponse.error(),
  rateLimit: () =>
    HttpResponse.json({ error: { type: 'rate_limit_error' } }, { status: 429 }),
  invalidKey: () =>
    HttpResponse.json({ error: { type: 'authentication_error' } }, { status: 401 }),
};
