import { Service } from 'typedi';
import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import { GeminiKeyManager } from './gemini-key-manager';
import { RCExtractedData, RC_EXTRACTION_PROMPT } from './gemini.interface';

// ──────────────────────────────────────────────
// Retry config
// ──────────────────────────────────────────────
const MAX_RETRIES = 2; // try up to 2 keys before giving up

@Service()
export class GeminiService {
  constructor(private keyManager: GeminiKeyManager) {}

  /**
   * Core method: call Gemini with auto key rotation + retry
   */
  public async callWithRotation(parts: Part[], prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const selected = await this.keyManager.getAvailableKey();

      if (!selected) {
        throw new Error('All Gemini API keys are rate limited. Please try again later.');
      }

      const { apiKey, keyIndex } = selected;

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model: GenerativeModel = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
        });

        const result = await model.generateContent([prompt, ...parts]);

        // ✅ Success — record usage
        await this.keyManager.recordUsage(keyIndex);

        return result.response.text().trim();
      } catch (error: any) {
        lastError = error;

        const status = error?.status ?? error?.httpStatus;

        if (status === 429) {
          // Rate limited by Gemini — block this key for 60s and try next
          console.warn(`[GeminiService] Key ${keyIndex} got 429. Rotating to next key.`);
          await this.keyManager.blockKey(keyIndex, 60);
          continue; // retry loop with next key
        }

        if (status === 503 || status === 500) {
          // Gemini server error — short block + retry
          await this.keyManager.blockKey(keyIndex, 10);
          continue;
        }

        // Any other error (400, auth error etc.) — throw immediately
        throw error;
      }
    }

    throw lastError ?? new Error('Gemini call failed after retries');
  }

  /**
   * Extract RC data from a base64 string
   */
  async extractRC(base64Data: string, mimeType: string): Promise<RCExtractedData> {
    const imagePart: Part = {
      inlineData: { data: base64Data, mimeType },
    };

    const rawText = await this.callWithRotation([imagePart], RC_EXTRACTION_PROMPT);
    return this.parseJSON<RCExtractedData>(rawText);
  }

  /**
   * Extract RC data from a URL
   */
  async extractRCFromUrl(imageUrl: string): Promise<RCExtractedData> {
    const urlPart: Part = {
      fileData: { fileUri: imageUrl, mimeType: 'image/jpeg' },
    };

    const rawText = await this.callWithRotation([urlPart], RC_EXTRACTION_PROMPT);
    return this.parseJSON<RCExtractedData>(rawText);
  }

  /**
   * Key Status (for monitoring route)
   */
  async getKeyStatuses() {
    return this.keyManager.getAllKeyStatuses();
  }

  /**
   * JSON Parser helper
   */
  private parseJSON<T>(rawText: string): T {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error(`Failed to parse Gemini JSON response.\nRaw: ${rawText}`);
    }
  }
}
