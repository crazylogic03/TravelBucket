import Groq from 'groq-sdk';
import { AiProvider } from './aiProvider.js';
import { groqKeyPool } from '../key-pool/groqKeyPool.js';
import { getPrisma } from '../../db/prisma.js';

/**
 * llama-3.3-70b-versatile was retired by Groq (Aug 2026).
 * Prefer gpt-oss then Qwen for structured JSON / tool calling.
 */
export const DEFAULT_MODEL = 'openai/gpt-oss-120b';
export const MODEL_FALLBACKS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
];

/**
 * Groq provider with key-pool rotation and model fallbacks.
 */
export class GroqProvider extends AiProvider {
  /**
   * @param {import('./aiProvider.js').ChatCompletionOptions} options
   */
  async chat(options) {
    if (!groqKeyPool.hasKeys()) {
      const err = new Error('AI service unavailable: no Groq API keys configured');
      err.statusCode = 503;
      err.code = 'AI_NO_KEYS';
      throw err;
    }

    const preferred = options.model || DEFAULT_MODEL;
    const modelsToTry = [
      preferred,
      ...MODEL_FALLBACKS.filter((m) => m !== preferred),
    ];

    const prisma = getPrisma();
    let lastError = null;
    let keyAttempts = 0;

    for (const model of modelsToTry) {
      // Reset key cooldowns between model switches for model_not_found cases
      for (; keyAttempts < groqKeyPool.maxAttempts * modelsToTry.length; keyAttempts++) {
        const slot = groqKeyPool.selectHealthyKey();
        if (!slot) break;

        const started = Date.now();
        let aiRun = null;

        try {
          aiRun = await prisma.aiRun.create({
            data: {
              userId: options.userId || null,
              tripId: options.tripId || null,
              agentType: options.agentType || 'generic',
              model,
              provider: 'groq',
              keyPoolSlot: slot.slot,
              status: 'STARTED',
            },
          });
        } catch {
          // Observability should not block AI
        }

        try {
          const client = new Groq({ apiKey: slot.key });
          const body = {
            model,
            messages: options.messages,
            temperature: options.temperature ?? 0.4,
          };
          if (options.json) {
            body.response_format = { type: 'json_object' };
          }
          if (options.tools?.length) {
            body.tools = options.tools;
            body.tool_choice = options.toolChoice || 'auto';
          }

          const completion = await client.chat.completions.create(body);
          const choice = completion.choices?.[0]?.message;
          const latencyMs = Date.now() - started;

          groqKeyPool.markSuccess(slot);

          if (aiRun) {
            await prisma.aiRun
              .update({
                where: { id: aiRun.id },
                data: {
                  status: 'SUCCESS',
                  latencyMs,
                  inputTokens: completion.usage?.prompt_tokens ?? null,
                  outputTokens: completion.usage?.completion_tokens ?? null,
                },
              })
              .catch(() => {});
          }

          return {
            content: choice?.content || '',
            toolCalls: choice?.tool_calls || [],
            usage: completion.usage || {},
            model,
            keyPoolSlot: slot.slot,
            latencyMs,
          };
        } catch (err) {
          lastError = err;
          const status = err?.status || err?.statusCode;
          const message = String(err?.message || '');
          const modelMissing =
            status === 404 ||
            /model_not_found|does not exist|do not have access/i.test(message);
          const rateLimited = status === 429;

          if (aiRun) {
            await prisma.aiRun
              .update({
                where: { id: aiRun.id },
                data: {
                  status: 'FALLBACK',
                  errorCode: modelMissing
                    ? 'MODEL_NOT_FOUND'
                    : rateLimited
                      ? 'RATE_LIMIT'
                      : 'PROVIDER_ERROR',
                  latencyMs: Date.now() - started,
                },
              })
              .catch(() => {});
          }

          if (modelMissing) {
            // Try next model; do not punish the key
            break;
          }

          groqKeyPool.markFailure(slot, { rateLimited });

          // Hard client errors (except auth) — stop this model loop
          if (status && status !== 429 && status < 500 && status !== 401 && status !== 403) {
            break;
          }
        }
      }
    }

    const detail = lastError?.message ? `: ${lastError.message}` : '';
    const err = new Error(`AI service unavailable${detail}`);
    err.statusCode = 503;
    err.code = 'AI_UNAVAILABLE';
    err.cause = lastError;
    throw err;
  }
}

export const groqProvider = new GroqProvider();
