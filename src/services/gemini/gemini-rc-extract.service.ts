import { Service } from 'typedi';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiService } from './gemini.service';
import { RCExtractedData } from './gemini.interface';

@Service()
export class RCExtractService {
  constructor(private geminiService: GeminiService) {}

  /**
   * Extract RC data from a file path (server-side upload)
   */
  async extractFromFilePath(filePath: string): Promise<RCExtractedData> {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = this.getMimeType(ext);

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    return this.extractFromBase64(base64Data, mimeType);
  }

  /**
   * Extract RC data from a base64 string (multipart upload)
   */
  async extractFromBase64(base64Data: string, mimeType: string): Promise<RCExtractedData> {
    const result = await this.geminiService.extractRC(base64Data, mimeType);
    return this.applyDefaults(result);
  }

  /**
   * Extract RC data from 2-side RC images and merge results.
   * Merge rule: for each key, prefer the first non-null/non-empty value.
   */
  async extractFromTwoBase64(
    front: { base64Data: string; mimeType: string } | null,
    back: { base64Data: string; mimeType: string } | null,
  ): Promise<{ merged: RCExtractedData; front: RCExtractedData | null; back: RCExtractedData | null }> {
    const [frontData, backData] = await Promise.all([
      front ? this.extractFromBase64(front.base64Data, front.mimeType) : Promise.resolve(null),
      back ? this.extractFromBase64(back.base64Data, back.mimeType) : Promise.resolve(null),
    ]);

    const merged = this.mergeExtracted(frontData, backData);
    return { merged, front: frontData, back: backData };
  }

  /**
   * Extract RC data from a URL (if RC is hosted somewhere)
   */
  async extractFromUrl(imageUrl: string): Promise<RCExtractedData> {
    const result = await this.geminiService.extractRCFromUrl(imageUrl);
    return this.applyDefaults(result);
  }

  /**
   * Ensure boolean defaults and other post-processing (if needed)
   */
  private applyDefaults(data: RCExtractedData): RCExtractedData {
    return {
      ...data,
      is_hypothecation: data.is_hypothecation ?? false,
      rc_available: data.rc_available ?? true,
    };
  }

  private mergeExtracted(a: RCExtractedData | null, b: RCExtractedData | null): RCExtractedData {
    const base: RCExtractedData = this.applyDefaults((a ?? b) as RCExtractedData);
    const other = a ? b : a; // whichever wasn't used as base
    if (!other) return base;

    const out: any = { ...base };
    for (const key of Object.keys(other) as (keyof RCExtractedData)[]) {
      const vBase = out[key];
      const vOther = other[key];

      const isEmptyString = (v: unknown) => typeof v === 'string' && v.trim() === '';
      const isMissing = (v: unknown) => v === null || v === undefined || isEmptyString(v);

      if (isMissing(vBase) && !isMissing(vOther)) {
        out[key] = vOther as any;
      }
    }
    return this.applyDefaults(out as RCExtractedData);
  }

  private getMimeType(ext: string): string {
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.heic': 'image/heic',
    };
    return map[ext] ?? 'image/jpeg';
  }
}
