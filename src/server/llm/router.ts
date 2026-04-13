/**
 * Multi-provider LLM router with BYOK + automatic fallback.
 *
 * Fallback triggers (retriable): network error, 401, 403, 429.
 * Non-retriable (e.g. 400) aborts immediately — never cascades.
 */

import { logger } from '@/server/logger';

const log = logger.child({ module: 'llm-router' });

export type Provider = 'claude' | 'gemini' | 'openai' | 'openrouter';

export class AllProvidersFailedError extends Error {
  constructor(public errors: unknown[]) {
    super('AllProvidersFailed');
    this.name = 'AllProvidersFailedError';
  }
}

export interface LlmCompletion {
  text: string;
  provider: Provider;
}

export interface RouterOptions {
  order: Provider[];
  keys: Partial<Record<Provider, string>>;
}

const RETRIABLE_STATUS = new Set([401, 403, 429]);

async function callProvider(p: Provider, prompt: string, key: string): Promise<Response> {
  switch (p) {
    case 'claude':
      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    case 'openai':
      return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    case 'openrouter':
      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
          'http-referer': process.env.APP_URL ?? 'http://localhost:3100',
          'x-title': 'learnEnglish',
        },
        body: JSON.stringify({
          // Default to a capable free model. Override via OPENROUTER_MODEL.
          model: process.env.OPENROUTER_MODEL ?? 'openai/gpt-oss-120b:free',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    case 'gemini':
      return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
        },
      );
  }
}

function extractText(p: Provider, data: unknown): string {
  const d = data as Record<string, unknown>;
  switch (p) {
    case 'claude': {
      const content = d.content as Array<{ type: string; text?: string }> | undefined;
      return content?.[0]?.text ?? '';
    }
    case 'openai':
    case 'openrouter': {
      const choices = d.choices as Array<{ message?: { content?: string } }> | undefined;
      return choices?.[0]?.message?.content ?? '';
    }
    case 'gemini': {
      const candidates = d.candidates as
        | Array<{ content?: { parts?: Array<{ text?: string }> } }>
        | undefined;
      return candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }
  }
}

export interface LlmRouter {
  complete(input: { prompt: string }): Promise<LlmCompletion>;
}

export function createLlmRouter({ order, keys }: RouterOptions): LlmRouter {
  return {
    async complete({ prompt }) {
      const errors: unknown[] = [];

      for (const p of order) {
        const key = keys[p];
        if (!key) continue;

        let resp: Response;
        try {
          resp = await callProvider(p, prompt, key);
        } catch (err) {
          // Network-level failure → fall back.
          log.warn({ provider: p, reason: 'network' }, 'llm.fallback');
          errors.push(err);
          continue;
        }

        if (resp.ok) {
          const data = await resp.json();
          return { text: extractText(p, data), provider: p };
        }

        if (RETRIABLE_STATUS.has(resp.status)) {
          log.warn({ provider: p, status: resp.status }, 'llm.fallback');
          errors.push(new Error(`${p} HTTP ${resp.status}`));
          continue;
        }

        // Non-retriable (e.g. 400 bad-request): surface immediately, no cascade.
        log.error({ provider: p, status: resp.status }, 'llm.non_retriable');
        throw new Error(`${p} HTTP ${resp.status}`);
      }

      log.error({ order }, 'llm.all_providers_failed');
      throw new AllProvidersFailedError(errors);
    },
  };
}
