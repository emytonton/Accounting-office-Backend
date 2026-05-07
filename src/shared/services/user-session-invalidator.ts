// Tracks the timestamp from which all tokens issued for a user must be rejected.
// Used to invalidate every active session of a user (e.g., when inactivating).
class UserSessionInvalidator {
  private readonly invalidatedAt = new Map<string, number>();

  invalidateAllSessions(userId: string): void {
    // Use seconds (matches JWT iat) to avoid drift when comparing.
    this.invalidatedAt.set(userId, Math.floor(Date.now() / 1000));
  }

  isTokenInvalidated(userId: string, issuedAt?: number): boolean {
    const cutoff = this.invalidatedAt.get(userId);
    if (!cutoff) return false;
    if (!issuedAt) return true;
    // <= so tokens issued during the same second as inactivation are still rejected.
    return issuedAt <= cutoff;
  }

  clear(userId: string): void {
    this.invalidatedAt.delete(userId);
  }
}

export const userSessionInvalidator = new UserSessionInvalidator();
