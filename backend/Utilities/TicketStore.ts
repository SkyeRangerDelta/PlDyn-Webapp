/**
 * In-memory store for short-lived, single-use SSE tickets.
 * Tickets replace long-lived JWTs in URL query parameters.
 */
export class TicketStore {
  private tickets = new Map<string, { expiresAt: number; userId: string }>();

  /** Create a ticket bound to a user that expires after `ttlMs` milliseconds (default 30s). */
  create(userId: string, ttlMs = 30_000): string {
    const ticket = crypto.randomUUID();
    this.tickets.set(ticket, { expiresAt: Date.now() + ttlMs, userId });
    return ticket;
  }

  /** Consume a ticket. Returns the associated userId if valid, or null if invalid/expired. Single-use: deleted after validation. */
  validate(ticket: string): string | null {
    const entry = this.tickets.get(ticket);
    this.tickets.delete(ticket); // Always delete — single use

    if (!entry) return null;
    return Date.now() < entry.expiresAt ? entry.userId : null;
  }

  /** Purge expired tickets to prevent unbounded growth. */
  cleanup(): void {
    const now = Date.now();
    for (const [ticket, { expiresAt }] of this.tickets) {
      if (now >= expiresAt) {
        this.tickets.delete(ticket);
      }
    }
  }

  /**
   * Start a periodic cleanup timer that purges expired tickets.
   * @param intervalMs How often to run cleanup (default 60 seconds).
   * @returns The timer ID (for clearing in tests or shutdown).
   */
  startCleanupScheduler(intervalMs = 60_000): number {
    return setInterval(() => this.cleanup(), intervalMs);
  }
}
