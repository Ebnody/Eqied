// In-process SSE pub/sub for live group updates.
// Each group has a set of subscriber callbacks. API routes call `publish(...)`
// after a mutation; the SSE route's stream subscribes and forwards events.
//
// NOTE: this is single-process only. In a multi-instance deploy you'd swap
// this for Redis pub/sub, but for the current single-node setup it is enough.

export type RoommateEventKind =
  | "expense_added"
  | "expense_updated"
  | "expense_deleted"
  | "loan_added"
  | "loan_updated"
  | "settlement_recorded"
  | "member_joined"
  | "member_invited"
  | "balances_changed";

export interface RoommateEvent {
  kind: RoommateEventKind;
  groupId: string;
  /** Optional small payload; clients may also just refetch on receipt. */
  data?: Record<string, unknown>;
  ts: number;
}

type Listener = (event: RoommateEvent) => void;

// Use a module-level singleton stored on globalThis so HMR doesn't drop subscribers.
declare global {
  // eslint-disable-next-line no-var
  var __roommateEventBus: Map<string, Set<Listener>> | undefined;
}

const channels: Map<string, Set<Listener>> =
  globalThis.__roommateEventBus ?? new Map();
if (!globalThis.__roommateEventBus) globalThis.__roommateEventBus = channels;

export function subscribe(groupId: string, listener: Listener): () => void {
  let set = channels.get(groupId);
  if (!set) {
    set = new Set();
    channels.set(groupId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) channels.delete(groupId);
  };
}

export function publish(
  groupId: string,
  kind: RoommateEventKind,
  data?: Record<string, unknown>
): void {
  const set = channels.get(groupId);
  if (!set || set.size === 0) return;
  const event: RoommateEvent = { kind, groupId, data, ts: Date.now() };
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      // ignore subscriber errors so one bad client doesn't break others
    }
  }
}
