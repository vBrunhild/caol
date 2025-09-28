import { db } from "../database.js";
export function getTotal(baseQuery, params = []) {
    const query = `SELECT COUNT(*) as total FROM (${baseQuery})`;
    const stmt = db.prepare(query);
    return stmt.get(params)?.total || 0;
}
