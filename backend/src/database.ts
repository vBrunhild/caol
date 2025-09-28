import sql from "better-sqlite3";

/*
 * Optei por sqlite pela praticidade e simplicidade para entrega.
 *
 * O uso de sqlite como banco de dados trás problemas de precisão de valores numéricos,
 * pois o memso trata todos os valors numéricos como float.
 *
 * Normalmente por isso o mesmo não seria ideal para propósitos de cálculos de valores monetários.
 * Em um projeto real um db mais adequado como postgresql seria utilizado.
 */

export const db: sql.Database = new sql(process.env.DB_PATH);
