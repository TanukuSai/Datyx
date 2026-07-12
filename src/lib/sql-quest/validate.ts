import type { RunResult } from "./runner";

function normalizeCell(v: string | number | null): string {
  if (v === null || v === undefined) return "\u0000NULL";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(6);
  return String(v);
}

function serializeRow(row: Array<string | number | null>): string {
  return row.map(normalizeCell).join("\u0001");
}

export interface ValidationResult {
  correct: boolean;
  reason?: string;
}

export function validate(
  got: RunResult,
  expected: RunResult,
  opts: { orderMatters?: boolean } = {},
): ValidationResult {
  if (got.columns.length !== expected.columns.length) {
    return {
      correct: false,
      reason: `Expected ${expected.columns.length} column(s), got ${got.columns.length}.`,
    };
  }
  if (got.rows.length !== expected.rows.length) {
    return {
      correct: false,
      reason: `Expected ${expected.rows.length} row(s), got ${got.rows.length}.`,
    };
  }
  const orderMatters = opts.orderMatters ?? true;
  const g = got.rows.map(serializeRow);
  const e = expected.rows.map(serializeRow);
  if (orderMatters) {
    for (let i = 0; i < g.length; i++) {
      if (g[i] !== e[i]) return { correct: false, reason: `Row ${i + 1} does not match expected output.` };
    }
    return { correct: true };
  }
  const gs = [...g].sort();
  const es = [...e].sort();
  for (let i = 0; i < gs.length; i++) {
    if (gs[i] !== es[i]) return { correct: false, reason: "Rows do not match (order-insensitive)." };
  }
  return { correct: true };
}
