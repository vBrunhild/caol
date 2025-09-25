import { db } from "backend/src/database";

export function getTotal(baseQuery: string): number {
  const stmt = db.prepare<[], { total: number }>(`
    SELECT COUNT(*) AS total
    ${baseQuery}
  `);

  return stmt.get()?.total || 0
}
