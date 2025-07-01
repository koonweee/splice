export const storage = {
  getApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('splice_api_key');
  },

  setApiKey(apiKey: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('splice_api_key', apiKey);
  },

  getSecret(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('splice_secret');
  },

  setSecret(secret: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('splice_secret', secret);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('splice_api_key');
    localStorage.removeItem('splice_secret');
  },

  hasApiKey(): boolean {
    return !!this.getApiKey();
  },

  hasSecret(): boolean {
    return !!this.getSecret();
  }
};