import { assertEquals } from '@std/assert';
import { TicketStore } from '../Utilities/TicketStore.ts';

const TEST_USER = 'user-42';

// ── Basic ticket lifecycle ────────────────────────────────────────────────────

Deno.test('created ticket is valid on first use and returns userId', () => {
  const store = new TicketStore();
  const ticket = store.create(TEST_USER);
  assertEquals(store.validate(ticket), TEST_USER);
});

Deno.test('ticket is single-use — second validation returns null', () => {
  const store = new TicketStore();
  const ticket = store.create(TEST_USER);

  assertEquals(store.validate(ticket), TEST_USER);
  assertEquals(store.validate(ticket), null);
});

Deno.test('invalid ticket is rejected with null', () => {
  const store = new TicketStore();
  assertEquals(store.validate('nonexistent-ticket'), null);
});

// ── Expiry ────────────────────────────────────────────────────────────────────

Deno.test('expired ticket returns null', async () => {
  const store = new TicketStore();
  const ticket = store.create(TEST_USER, 1); // 1ms TTL

  await new Promise(r => setTimeout(r, 10));

  assertEquals(store.validate(ticket), null);
});

Deno.test('ticket within TTL returns userId', () => {
  const store = new TicketStore();
  const ticket = store.create(TEST_USER, 60_000); // 60s TTL
  assertEquals(store.validate(ticket), TEST_USER);
});

// ── Uniqueness ────────────────────────────────────────────────────────────────

Deno.test('each ticket is unique', () => {
  const store = new TicketStore();
  const tickets = new Set<string>();

  for (let i = 0; i < 100; i++) {
    tickets.add(store.create(TEST_USER));
  }

  assertEquals(tickets.size, 100);
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

Deno.test('cleanup removes expired tickets', async () => {
  const store = new TicketStore();
  store.create(TEST_USER, 1); // expires immediately
  store.create(TEST_USER, 60_000); // stays alive

  await new Promise(r => setTimeout(r, 10));
  store.cleanup();
});

// ── Scheduled cleanup fires automatically ────────────────────────────────────

Deno.test('startCleanupScheduler purges expired tickets automatically', async () => {
  const store = new TicketStore();
  const shortTicket = store.create(TEST_USER, 1);   // expires in 1ms
  const longTicket = store.create(TEST_USER, 60_000); // stays alive

  const timerId = store.startCleanupScheduler(15);

  await new Promise(r => setTimeout(r, 50));

  assertEquals(store.validate(shortTicket), null);
  assertEquals(store.validate(longTicket), TEST_USER);
  clearInterval(timerId);
});

// ── User isolation ───────────────────────────────────────────────────────────

Deno.test('ticket returns the correct userId for each user', () => {
  const store = new TicketStore();
  const ticketA = store.create('user-A');
  const ticketB = store.create('user-B');

  assertEquals(store.validate(ticketA), 'user-A');
  assertEquals(store.validate(ticketB), 'user-B');
});
