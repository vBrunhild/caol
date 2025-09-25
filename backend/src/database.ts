import sql from "better-sqlite3";

export const db: sql.Database = new sql(process.env.DB_PATH);
