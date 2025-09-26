import { db } from "backend/src/database";

export function getTotal(baseQuery: string, params: any[] = []): number {
  const query = `SELECT COUNT(*) as total FROM (${baseQuery})`;
  const stmt = db.prepare<any[], { total: number }>(query);
  return stmt.get(params)?.total || 0
}
