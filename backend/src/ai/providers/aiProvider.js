/**
 * Conceptual AI provider contract.
 * Implementations: GroqProvider
 *
 * @typedef {Object} ChatMessage
 * @property {'system'|'user'|'assistant'|'tool'} role
 * @property {string} content
 * @property {string} [name]
 * @property {string} [tool_call_id]
 * @property {object[]} [tool_calls]
 *
 * @typedef {Object} ChatCompletionOptions
 * @property {ChatMessage[]} messages
 * @property {string} [model]
 * @property {number} [temperature]
 * @property {boolean} [json]
 * @property {object[]} [tools]
 * @property {string|object} [toolChoice]
 * @property {string} [agentType]
 * @property {string} [userId]
 * @property {string} [tripId]
 *
 * @typedef {Object} ChatCompletionResult
 * @property {string} content
 * @property {object[]} [toolCalls]
 * @property {object} usage
 * @property {string} model
 * @property {number} keyPoolSlot
 * @property {number} latencyMs
 */

export class AiProvider {
  /**
   * @param {ChatCompletionOptions} _options
   * @returns {Promise<ChatCompletionResult>}
   */
  async chat(_options) {
    throw new Error('AiProvider.chat must be implemented');
  }
}
