// Client-only SQLite runner backed by sql.js.
// The WASM binary is served from /wasm/sql-wasm.wasm (see public/wasm/).

import type { Database, SqlJsStatic } from "sql.js";

let sqlPromise: Promise<SqlJsStatic> | null = null;

async function getSql(): Promise<SqlJsStatic> {
  if (typeof window === "undefined") {
    throw new Error("SQL runner is browser-only");
  }
  if (!sqlPromise) {
    // Dynamic import so this module never lands in SSR bundles.
    const initSqlJs = (await import("sql.js")).default;
    sqlPromise = initSqlJs({ locateFile: () => "/wasm/sql-wasm.wasm" });
  }
  return sqlPromise;
}

export interface RunResult {
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

export interface RunOutcome {
  ok: boolean;
  result?: RunResult;
  error?: string;
  elapsedMs: number;
}

export async function runQuery(setup: string, query: string, verification?: string): Promise<RunOutcome> {
  const start = performance.now();
  let db: Database | null = null;
  try {
    const SQL = await getSql();
    db = new SQL.Database();
    db.exec(setup);
    db.exec(query);
    const finalQuery = verification || query;
    const res = db.exec(finalQuery);
    const first = res[res.length - 1]; // The final SELECT statement.
    if (!first) {
      return {
        ok: true,
        result: { columns: [], rows: [] },
        elapsedMs: performance.now() - start,
      };
    }
    return {
      ok: true,
      result: {
        columns: first.columns,
        rows: first.values.map((row) => row.map((v) => (v as string | number | null) ?? null)),
      },
      elapsedMs: performance.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      elapsedMs: performance.now() - start,
    };
  } finally {
    db?.close();
  }
}
