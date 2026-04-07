import { Service } from "typedi";
import { GEMINI_API_KEY_ONE, GEMINI_API_KEY_TWO } from "@/config/env";
import { geminiCache, GeminiKeyStatus } from "@/services/redis/cache/gemini.cache";

// ──────────────────────────────────────────────
// Main Rate Limiter + Key Rotator
// ──────────────────────────────────────────────
@Service()
export class GeminiKeyManager {
  private apiKeys: string[];

  constructor() {
    // Load both keys from env
    if (!GEMINI_API_KEY_ONE || !GEMINI_API_KEY_TWO) {
      throw new Error("GEMINI_API_KEY_ONE and GEMINI_API_KEY_TWO must be set");
    }

    this.apiKeys = [GEMINI_API_KEY_ONE, GEMINI_API_KEY_TWO];
  }

  /**
   * Check status of a single key
   */
  async getKeyStatus(keyIndex: number): Promise<GeminiKeyStatus> {
    return geminiCache.getKeyStatus(keyIndex);
  }

  /**
   * Get next available key (round-robin + rate check)
   */
  async getAvailableKey(): Promise<{
    apiKey: string;
    keyIndex: number;
  } | null> {
    // Check both keys
    for (let i = 0; i < this.apiKeys.length; i++) {
      const status = await this.getKeyStatus(i);
      if (status.is_available) {
        return { apiKey: this.apiKeys[i], keyIndex: i };
      }
    }

    // All keys exhausted
    return null;
  }

  /**
   * Increment counters after a successful call
   */
  async recordUsage(keyIndex: number): Promise<void> {
    await geminiCache.recordUsage(keyIndex);
  }

  /**
   * Temporarily block a key (e.g. got 429 from Gemini)
   */
  async blockKey(keyIndex: number, ttlSeconds = 60): Promise<void> {
    await geminiCache.blockKey(keyIndex, ttlSeconds);
    console.warn(
      `[GeminiKeyManager] Key ${keyIndex} blocked for ${ttlSeconds}s`
    );
  }

  /**
   * Get status of all keys (for monitoring/dashboard)
   */
  async getAllKeyStatuses(): Promise<GeminiKeyStatus[]> {
    return Promise.all(this.apiKeys.map((_, i) => this.getKeyStatus(i)));
  }

  /**
   * Reset all counters (useful for testing)
   */
  async resetAll(): Promise<void> {
    await geminiCache.resetAll(this.apiKeys.length);
  }
}
