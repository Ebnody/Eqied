// Net-balance + debt-simplification engine.
//
// Given:
//   - expenses (with paidByMemberId + splits[])
//   - loans    (lender → borrower, amount, paid)
//   - settlements (already-recorded transfers between members)
//
// Compute each member's net balance (positive = is owed; negative = owes),
// then emit a minimal set of transfers using greedy creditor↔debtor matching.

export interface BalanceInputs {
  memberIds: string[];
  expenses: Array<{
    paidByMemberId: string;
    splits: Array<{ memberId: string; share: number }>;
  }>;
  loans: Array<{
    lenderMemberId: string;
    borrowerMemberId: string;
    /** Outstanding amount = amount - paid. */
    outstanding: number;
  }>;
  settlements: Array<{
    fromMemberId: string;
    toMemberId: string;
    amount: number;
  }>;
}

export interface MemberBalance {
  memberId: string;
  /** Positive = net creditor (others owe this member). Negative = net debtor. */
  net: number;
  paid: number;
  share: number;
  loansLent: number;
  loansBorrowed: number;
  settlementsPaid: number;
  settlementsReceived: number;
}

export interface SettlementTransfer {
  fromMemberId: string; // debtor
  toMemberId: string; // creditor
  amount: number; // santim
}

export interface SettlementResult {
  balances: MemberBalance[];
  /** Suggested transfers that bring everyone to zero with minimal hops. */
  transfers: SettlementTransfer[];
}

export function computeBalances(input: BalanceInputs): SettlementResult {
  const map = new Map<string, MemberBalance>();
  for (const id of input.memberIds) {
    map.set(id, {
      memberId: id,
      net: 0,
      paid: 0,
      share: 0,
      loansLent: 0,
      loansBorrowed: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
    });
  }

  const ensure = (id: string) => {
    let b = map.get(id);
    if (!b) {
      b = {
        memberId: id,
        net: 0,
        paid: 0,
        share: 0,
        loansLent: 0,
        loansBorrowed: 0,
        settlementsPaid: 0,
        settlementsReceived: 0,
      };
      map.set(id, b);
    }
    return b;
  };

  // 1. Expenses: payer is credited the full amount; each split member is debited their share.
  for (const e of input.expenses) {
    const splitSum = e.splits.reduce((a, s) => a + s.share, 0);
    const payer = ensure(e.paidByMemberId);
    payer.paid += splitSum;
    payer.net += splitSum;
    for (const s of e.splits) {
      const m = ensure(s.memberId);
      m.share += s.share;
      m.net -= s.share;
    }
  }

  // 2. Loans: outstanding amount increases lender's net (they're owed) and decreases borrower's.
  for (const l of input.loans) {
    if (l.outstanding <= 0) continue;
    const lender = ensure(l.lenderMemberId);
    const borrower = ensure(l.borrowerMemberId);
    lender.loansLent += l.outstanding;
    lender.net += l.outstanding;
    borrower.loansBorrowed += l.outstanding;
    borrower.net -= l.outstanding;
  }

  // 3. Settlements: payer's net rises (they discharged debt), receiver's falls.
  for (const s of input.settlements) {
    const from = ensure(s.fromMemberId);
    const to = ensure(s.toMemberId);
    from.settlementsPaid += s.amount;
    from.net += s.amount;
    to.settlementsReceived += s.amount;
    to.net -= s.amount;
  }

  const balances = Array.from(map.values());
  const transfers = simplify(balances.map((b) => ({ memberId: b.memberId, net: b.net })));

  return { balances, transfers };
}

// Greedy debt-simplification.
// Repeatedly pair the largest creditor with the largest debtor; settle the
// smaller of the two magnitudes. Produces at most n-1 transfers.
export function simplify(
  netBalances: Array<{ memberId: string; net: number }>
): SettlementTransfer[] {
  // Work with cloned mutable values to avoid mutating caller data.
  const creditors = netBalances
    .filter((b) => b.net > 0)
    .map((b) => ({ memberId: b.memberId, value: b.net }))
    .sort((a, b) => b.value - a.value);
  const debtors = netBalances
    .filter((b) => b.net < 0)
    .map((b) => ({ memberId: b.memberId, value: -b.net }))
    .sort((a, b) => b.value - a.value);

  const transfers: SettlementTransfer[] = [];

  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const amount = Math.min(c.value, d.value);
    // Skip rounding-noise transfers (< 1 santim).
    if (amount > 0) {
      transfers.push({
        fromMemberId: d.memberId,
        toMemberId: c.memberId,
        amount,
      });
    }
    c.value -= amount;
    d.value -= amount;
    if (c.value === 0) i++;
    if (d.value === 0) j++;
  }

  return transfers;
}
