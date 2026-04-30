import redis from '@/config/redis';

export interface onboardTempToken {
  email: string;
  password: string;
  type: 'onboardTempToken';
  token: string;
  createdAt: Date;
}

export class onboardTempTokenCache {
  private static getKey(email: string, type: 'onboardTempToken'): string {
    return `token:${type}:${email}`;
  }

  static async setOnboardTempToken(email: string, password: string, token: string, type: 'onboardTempToken'): Promise<void> {
    const key = this.getKey(email, type);
    const tokenData: onboardTempToken = {
      email,
      type,
      token,
      password,
      createdAt: new Date(),
    };

    await redis.setex(key, 3600, JSON.stringify(tokenData)); // 1 hour expiry
  }

  static async getOnboardTempToken(email: string, type: 'onboardTempToken'): Promise<onboardTempToken | null> {
    const key = this.getKey(email, type);
    const data = await redis.get(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  static async deleteOnboardTempToken(email: string, type: 'onboardTempToken'): Promise<void> {
    const key = this.getKey(email, type);
    await redis.del(key);
  }
}
