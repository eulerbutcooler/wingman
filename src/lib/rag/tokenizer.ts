import { Tiktoken, encoding_for_model } from 'tiktoken';

/**
 * TokenCounter class for accurate token counting using tiktoken
 * Uses cl100k_base encoding which is compatible with most modern models
 */
class TokenCounter {
  private encoder: Tiktoken | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initializeEncoder();
  }

  private initializeEncoder() {
    try {
      // Use gpt-4 model which uses cl100k_base encoding (compatible with most modern models)
      this.encoder = encoding_for_model('gpt-4');
      this.initialized = true;
      console.log('✅ Tokenizer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize tokenizer:', error);
      this.encoder = null;
      this.initialized = false;
    }
  }

  /**
   * Count tokens in text accurately
   */
  count(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }

    if (!this.initialized || !this.encoder) {
      // Fallback: word-based estimation (1 token ≈ 0.75 words)
      console.warn('⚠️ Using fallback token counting (tokenizer not initialized)');
      return Math.ceil(text.trim().split(/\s+/).length / 0.75);
    }

    try {
      const tokens = this.encoder.encode(text);
      return tokens.length;
    } catch (error) {
      console.warn('⚠️ Token encoding failed, using fallback:', error);
      // Fallback to word-based estimation
      return Math.ceil(text.trim().split(/\s+/).length / 0.75);
    }
  }

  /**
   * Check if text exceeds token limit
   */
  exceedsLimit(text: string, limit: number): boolean {
    return this.count(text) > limit;
  }

  /**
   * Truncate text to fit within token limit
   */
  truncate(text: string, maxTokens: number): string {
    if (!text || maxTokens <= 0) {
      return '';
    }

    const currentTokens = this.count(text);
    if (currentTokens <= maxTokens) {
      return text;
    }

    if (!this.initialized || !this.encoder) {
      // Fallback: word-based truncation
      const words = text.split(/\s+/);
      const estimatedWords = Math.floor(maxTokens * 0.75);
      return words.slice(0, estimatedWords).join(' ');
    }

    try {
      const tokens = this.encoder.encode(text);
      if (tokens.length <= maxTokens) {
        return text;
      }

      const truncatedTokens = tokens.slice(0, maxTokens);
      const decoded = this.encoder.decode(truncatedTokens);
      // Convert Uint8Array to string if needed
      return typeof decoded === 'string' ? decoded : new TextDecoder().decode(decoded);
    } catch (error) {
      console.warn('⚠️ Token truncation failed, using fallback:', error);
      // Fallback to word-based truncation
      const words = text.split(/\s+/);
      const estimatedWords = Math.floor(maxTokens * 0.75);
      return words.slice(0, estimatedWords).join(' ');
    }
  }

  /**
   * Cleanup encoder resources
   */
  cleanup() {
    if (this.encoder) {
      try {
        this.encoder.free();
      } catch (error) {
        console.warn('⚠️ Error cleaning up tokenizer:', error);
      }
    }
  }
}

// Singleton instance
export const tokenCounter = new TokenCounter();

/**
 * Count tokens in text
 * @param text - Text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
  return tokenCounter.count(text);
}

/**
 * Truncate text to fit within token limit
 * @param text - Text to truncate
 * @param maxTokens - Maximum number of tokens
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  return tokenCounter.truncate(text, maxTokens);
}

/**
 * Check if text exceeds token limit
 * @param text - Text to check
 * @param limit - Token limit
 * @returns True if exceeds limit
 */
export function exceedsTokenLimit(text: string, limit: number): boolean {
  return tokenCounter.exceedsLimit(text, limit);
}
