import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http } from 'msw';
import { server, failures } from '../helpers/msw-server';
// @ts-expect-error — module does not exist yet (Red phase).
import { createLlmRouter } from '@/server/llm/router';

/**
 * Multi-provider router with BYOK + automatic fallback.
 * Fallback triggers: network error, 429 rate-limit, 401 invalid key.
 * Must respect the user-defined ordering.
 */
describe('llm router (fallback)', () => {
  const userKeys = {
    claude: 'sk-ant-test',
    gemini: 'g-test',
    openai: 'sk-openai-test',
    openrouter: 'or-test',
  };

  beforeEach(() => {
    server.resetHandlers();
  });

  it('should call the first provider in user order when it succeeds', async () => {
    const calls: string[] = [];
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => {
        calls.push('claude');
        return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }));
      }),
    );
    const router = createLlmRouter({ order: ['claude', 'openai'], keys: userKeys });

    await router.complete({ prompt: 'hi' });

    expect(calls).toEqual(['claude']);
  });

  it('should fall back to the next provider on network error', async () => {
    const calls: string[] = [];
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => {
        calls.push('claude');
        return failures.network();
      }),
      http.post('https://api.openai.com/v1/chat/completions', () => {
        calls.push('openai');
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
        );
      }),
    );
    const router = createLlmRouter({ order: ['claude', 'openai'], keys: userKeys });

    const out = await router.complete({ prompt: 'hi' });

    expect(calls).toEqual(['claude', 'openai']);
    expect(out.text).toBeDefined();
  });

  it('should fall back on 429 rate-limit error', async () => {
    const calls: string[] = [];
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => {
        calls.push('claude');
        return failures.rateLimit();
      }),
      http.post('https://api.openai.com/v1/chat/completions', () => {
        calls.push('openai');
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
        );
      }),
    );
    const router = createLlmRouter({ order: ['claude', 'openai'], keys: userKeys });

    await router.complete({ prompt: 'hi' });

    expect(calls).toEqual(['claude', 'openai']);
  });

  it('should fall back on 401 invalid-key error', async () => {
    const calls: string[] = [];
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => {
        calls.push('claude');
        return failures.invalidKey();
      }),
      http.post('https://api.openai.com/v1/chat/completions', () => {
        calls.push('openai');
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
        );
      }),
    );
    const router = createLlmRouter({ order: ['claude', 'openai'], keys: userKeys });

    await router.complete({ prompt: 'hi' });

    expect(calls).toEqual(['claude', 'openai']);
  });

  it('should respect custom ordering gemini → openrouter → openai', async () => {
    const calls: string[] = [];
    server.use(
      http.post('https://generativelanguage.googleapis.com/*', () => {
        calls.push('gemini');
        return failures.rateLimit();
      }),
      http.post('https://openrouter.ai/api/v1/chat/completions', () => {
        calls.push('openrouter');
        return failures.network();
      }),
      http.post('https://api.openai.com/v1/chat/completions', () => {
        calls.push('openai');
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
        );
      }),
    );
    const router = createLlmRouter({
      order: ['gemini', 'openrouter', 'openai'],
      keys: userKeys,
    });

    await router.complete({ prompt: 'hi' });

    expect(calls).toEqual(['gemini', 'openrouter', 'openai']);
  });

  it('should throw AllProvidersFailedError when every provider fails', async () => {
    server.use(
      http.post('https://api.anthropic.com/v1/messages', failures.rateLimit),
      http.post('https://api.openai.com/v1/chat/completions', failures.invalidKey),
    );
    const router = createLlmRouter({ order: ['claude', 'openai'], keys: userKeys });

    await expect(router.complete({ prompt: 'hi' })).rejects.toThrow(/AllProvidersFailed/);
  });

  it('should NOT fall back on non-retriable errors like 400 bad-request', async () => {
    const calls: string[] = [];
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => {
        calls.push('claude');
        return new Response(JSON.stringify({ error: 'bad prompt' }), { status: 400 });
      }),
    );
    const router = createLlmRouter({ order: ['claude', 'openai'], keys: userKeys });

    await expect(router.complete({ prompt: 'hi' })).rejects.toBeDefined();
    expect(calls).toEqual(['claude']); // must not cascade on user error
  });

  it('should skip providers that have no key configured', async () => {
    const calls: string[] = [];
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () => {
        calls.push('openai');
        return new Response(
          JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
        );
      }),
    );
    const router = createLlmRouter({
      order: ['claude', 'openai'],
      keys: { openai: 'sk-openai-test' }, // no claude key
    });

    await router.complete({ prompt: 'hi' });

    expect(calls).toEqual(['openai']);
  });
});
