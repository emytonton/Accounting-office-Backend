interface BlacklistEntry {
  expiresAt: number;
}

class TokenBlacklist {
  private readonly entries = new Map<string, BlacklistEntry>();

  add(token: string, expiresAt: number): void {
    this.entries.set(token, { expiresAt });
    this.cleanup();
  }

  has(token: string): boolean {
    const entry = this.entries.get(token);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(token);
      return false;
    }
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(token);
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();
