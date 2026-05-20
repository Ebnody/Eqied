// Expense-split math. All money is santim (integer ETB cents).
// Three modes:
//   equal   — split evenly across the chosen member IDs; remainder pennies
//             are distributed to the first N members so totals match exactly.
//   percent — `parts[i]` are percentages (0..100). Must sum to 100.
//   exact   — `parts[i]` are exact santim amounts. Must sum to expense amount.

export type SplitType = "equal" | "percent" | "exact";

export interface SplitParticipant {
  memberId: string;
  /** Used by `percent` and `exact`; ignored for `equal`. */
  part?: number;
}

export interface ComputedSplit {
  memberId: string;
  share: number; // santim
}

export interface SplitError {
  code:
    | "no_participants"
    | "amount_invalid"
    | "missing_parts"
    | "percent_sum_invalid"
    | "exact_sum_invalid"
    | "negative_part";
  message: string;
}

export type SplitResult =
  | { ok: true; splits: ComputedSplit[] }
  | { ok: false; error: SplitError };

export function computeSplits(
  type: SplitType,
  totalSantim: number,
  participants: SplitParticipant[]
): SplitResult {
  if (!Number.isInteger(totalSantim) || totalSantim <= 0) {
    return {
      ok: false,
      error: { code: "amount_invalid", message: "Amount must be a positive integer (santim)." },
    };
  }
  if (!participants.length) {
    return {
      ok: false,
      error: { code: "no_participants", message: "At least one participant is required." },
    };
  }

  // De-dup memberIds preserving order.
  const seen = new Set<string>();
  const unique = participants.filter((p) => {
    if (seen.has(p.memberId)) return false;
    seen.add(p.memberId);
    return true;
  });

  if (type === "equal") {
    const n = unique.length;
    const base = Math.floor(totalSantim / n);
    const remainder = totalSantim - base * n;
    const splits = unique.map((p, i) => ({
      memberId: p.memberId,
      share: base + (i < remainder ? 1 : 0),
    }));
    return { ok: true, splits };
  }

  // For percent / exact we need parts
  for (const p of unique) {
    if (p.part == null) {
      return {
        ok: false,
        error: {
          code: "missing_parts",
          message: "Each participant must include a `part` for percent/exact splits.",
        },
      };
    }
    if (p.part < 0) {
      return {
        ok: false,
        error: { code: "negative_part", message: "Parts cannot be negative." },
      };
    }
  }

  if (type === "percent") {
    const sum = unique.reduce((acc, p) => acc + (p.part ?? 0), 0);
    // Allow a tiny floating-point slack (e.g. 99.999).
    if (Math.abs(sum - 100) > 0.01) {
      return {
        ok: false,
        error: {
          code: "percent_sum_invalid",
          message: `Percentages must sum to 100 (got ${sum.toFixed(2)}).`,
        },
      };
    }
    // Compute raw shares, then nudge the largest one so they add to totalSantim.
    const raw = unique.map((p) => ({
      memberId: p.memberId,
      share: Math.round((totalSantim * (p.part ?? 0)) / 100),
    }));
    const drift = totalSantim - raw.reduce((a, s) => a + s.share, 0);
    if (drift !== 0) {
      // Apply drift to the participant with the largest share.
      let idx = 0;
      for (let i = 1; i < raw.length; i++) {
        if (raw[i].share > raw[idx].share) idx = i;
      }
      raw[idx].share += drift;
    }
    return { ok: true, splits: raw };
  }

  // exact
  const sum = unique.reduce((acc, p) => acc + (p.part ?? 0), 0);
  if (sum !== totalSantim) {
    return {
      ok: false,
      error: {
        code: "exact_sum_invalid",
        message: `Exact amounts must sum to ${totalSantim} (got ${sum}).`,
      },
    };
  }
  return {
    ok: true,
    splits: unique.map((p) => ({ memberId: p.memberId, share: p.part ?? 0 })),
  };
}
