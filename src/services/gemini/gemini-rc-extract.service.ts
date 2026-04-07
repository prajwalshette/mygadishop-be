import { Service } from "typedi";
import * as fs from "fs";
import * as path from "path";
import { GeminiService } from "./gemini.service";
import { RCExtractedData } from "./gemini.interface";

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
    const base64Data = fileBuffer.toString("base64");

    return this.extractFromBase64(base64Data, mimeType);
  }

  /**
   * Extract RC data from a base64 string (multipart upload)
   */
  async extractFromBase64(
    base64Data: string,
    mimeType: string
  ): Promise<RCExtractedData> {
    const result = await this.geminiService.extractRC(base64Data, mimeType);
    return this.applyDefaults(result);
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

  private getMimeType(ext: string): string {
    const map: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".heic": "image/heic",
    };
    return map[ext] ?? "image/jpeg";
  }
}