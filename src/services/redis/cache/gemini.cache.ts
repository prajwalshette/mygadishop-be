import redis from "@/config/redis";

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────
export const GEMINI_RATE_LIMIT = {
  RPM: 15, // requests per minute per key (Gemini free tier = 15 RPM)
  RPD: 1500, // requests per day per key (Gemini free tier = 1500 RPD)
  WINDOW_MINUTE: 60, // seconds
  WINDOW_DAY: 86400, // seconds
};

export interface GeminiKeyStatus {
  key_index: number;
  rpm_used: number;
  rpd_used: number;
  rpm_remaining: number;
  rpd_remaining: number;
  is_available: boolean;
}

// ──────────────────────────────────────────────
// Redis Key Helpers
// ──────────────────────────────────────────────
const redisKeys = {
  rpm: (keyIndex: number) => `gemini:key${keyIndex}:rpm`,
  rpd: (keyIndex: number) => `gemini:key${keyIndex}:rpd`,
  blocked: (keyIndex: number) => `gemini:key${keyIndex}:blocked`,
};

// ──────────────────────────────────────────────
// Gemini Cache Class
// ──────────────────────────────────────────────
export class GeminiCache {
  /**
   * Check status of a single key
   */
  async getKeyStatus(keyIndex: number): Promise<GeminiKeyStatus> {
    const [rpm_used, rpd_used, blocked] = await Promise.all([
      redis.get(redisKeys.rpm(keyIndex)),
      redis.get(redisKeys.rpd(keyIndex)),
      redis.get(redisKeys.blocked(keyIndex)),
    ]);

    const rpm = parseInt(rpm_used ?? "0");
    const rpd = parseInt(rpd_used ?? "0");

    return {
      key_index: keyIndex,
      rpm_used: rpm,
      rpd_used: rpd,
      rpm_remaining: Math.max(0, GEMINI_RATE_LIMIT.RPM - rpm),
      rpd_remaining: Math.max(0, GEMINI_RATE_LIMIT.RPD - rpd),
      is_available:
        !blocked &&
        rpm < GEMINI_RATE_LIMIT.RPM &&
        rpd < GEMINI_RATE_LIMIT.RPD,
    };
  }

  /**
   * Increment counters after a successful call
   */
  async recordUsage(keyIndex: number): Promise<void> {
    const rpmKey = redisKeys.rpm(keyIndex);
    const rpdKey = redisKeys.rpd(keyIndex);

    const pipeline = redis.pipeline();

    // Increment RPM — expire in 60s
    pipeline.incr(rpmKey);
    pipeline.expire(rpmKey, GEMINI_RATE_LIMIT.WINDOW_MINUTE);

    // Increment RPD — expire in 24h
    pipeline.incr(rpdKey);
    pipeline.expire(rpdKey, GEMINI_RATE_LIMIT.WINDOW_DAY);

    await pipeline.exec();
  }

  /**
   * Temporarily block a key (e.g. got 429 from Gemini)
   */
  async blockKey(keyIndex: number, ttlSeconds = 60): Promise<void> {
    await redis.set(redisKeys.blocked(keyIndex), "1", "EX", ttlSeconds);
  }

  /**
   * Reset all counters (useful for testing)
   */
  async resetAll(apiKeyCount: number): Promise<void> {
    const keys: string[] = [];
    for (let i = 0; i < apiKeyCount; i++) {
      keys.push(redisKeys.rpm(i), redisKeys.rpd(i), redisKeys.blocked(i));
    }
    if (keys.length > 0) await redis.del(...keys);
  }
}

export const geminiCache = new GeminiCache();
