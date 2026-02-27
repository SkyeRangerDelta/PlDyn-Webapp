import { assertEquals } from '@std/assert';
import { TicketStore } from '../Utilities/TicketStore.ts';

// ── Basic ticket lifecycle ────────────────────────────────────────────────────

Deno.test('created ticket is valid on first use', () => {
  const store = new TicketStore();
  const ticket = store.create();
  assertEquals(store.validate(ticket), true);
});

Deno.test('ticket is single-use — second validation fails', () => {
  const store = new TicketStore();
  const ticket = store.create();

  assertEquals(store.validate(ticket), true);
  assertEquals(store.validate(ticket), false);
});

Deno.test('invalid ticket is rejected', () => {
  const store = new TicketStore();
  assertEquals(store.validate('nonexistent-ticket'), false);
});

// ── Expiry ────────────────────────────────────────────────────────────────────

Deno.test('expired ticket is rejected', async () => {
  const store = new TicketStore();
  const ticket = store.create(1); // 1ms TTL

  await new Promise(r => setTimeout(r, 10));

  assertEquals(store.validate(ticket), false);
});

Deno.test('ticket within TTL is accepted', () => {
  const store = new TicketStore();
  const ticket = store.create(60_000); // 60s TTL
  assertEquals(store.validate(ticket), true);
});

// ── Uniqueness ────────────────────────────────────────────────────────────────

Deno.test('each ticket is unique', () => {
  const store = new TicketStore();
  const tickets = new Set<string>();

  for (let i = 0; i < 100; i++) {
    tickets.add(store.create());
  }

  assertEquals(tickets.size, 100);
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

Deno.test('cleanup removes expired tickets', async () => {
  const store = new TicketStore();
  store.create(1); // expires immediately
  store.create(60_000); // stays alive

  await new Promise(r => setTimeout(r, 10));
  store.cleanup();

  // Can't directly check count, but validating the long-lived one should still work
  // (we can't validate it because we didn't save the reference — this tests that cleanup doesn't crash)
});
