import express, { Router } from 'express';
import { db } from '../../database.js';
import { parsePagination } from '../../functions/pagination.js';
import { getTotal } from '../../functions/getTotal.js';
import { PaginationResult, Client, ClientMonthlyTotal } from '../../types.js';

const router: Router = express.Router();

router.get('/', (req, res) => {
  const { limit, offset } = parsePagination(req);
  let { clientId } = req.query;

  let baseQuery = `
    SELECT
      co_cliente as clientId,
      no_razao as companyName,
      no_fantasia as tradeName,
      no_contato as contactName,
      nu_telefone as phone,
      nu_ramal as phoneExtension,
      nu_cnpj as cnpj,
      ds_endereco as address,
      nu_numero as addressNumber,
      ds_complemento as addressComplement,
      no_bairro as neighborhood,
      nu_cep as zipCode,
      no_pais as country,
      co_ramo as industryId,
      co_cidade as cityId,
      co_status as statusId,
      ds_site as website,
      ds_email as email,
      ds_cargo_contato as contactPosition,
      tp_cliente as clientType,
      ds_referencia as reference,
      co_complemento_status as statusComplementId,
      nu_fax as fax,
      ddd2 as phoneAreaCode2,
      telefone2 as phone2
    FROM cao_cliente
    WHERE
      cao_cliente.tp_cliente = 'A'
  `;

  const params: any[] = [];

  if (clientId) {
    const clientIdList: number[] = [];
    if (Array.isArray(clientId)) {
      clientId.forEach(id => {
        const numId = Number(id);
        if (!isNaN(numId)) {
          clientIdList.push(numId);
        }
      });
    } else {
      const numId = Number(clientId);
      if (!isNaN(numId)) {
        clientIdList.push(numId);
      }
    }

    if (clientIdList.length > 0) {
      const placeholders = clientIdList.map(() => '?').join(',');
      baseQuery += ` AND co_cliente IN (${placeholders})`;
      params.push(...clientIdList);
    }
  }

  const finalQuery = `
    ${baseQuery}
    ORDER BY co_cliente DESC
    LIMIT ? OFFSET ?
  `;

  const total = getTotal(baseQuery, params);
  const hasNext = offset + limit < total;

  params.push(limit, offset);

  const stmt = db.prepare<any[], Client>(finalQuery);
  const clients = stmt.all(...params);

  const result: PaginationResult<Client> = {
    limit,
    offset,
    total,
    hasNext,
    content: clients,
  };

  res.json(result);
});

router.get('/monthly-totals', (req, res) => {
  const { limit, offset } = parsePagination(req);
  let { start, end, clientId } = req.query;
  start = start as string;
  end = end as string;

  if (!start || !end) {
    return res.status(400).json({ error: 'start and end are required parameters' });
  }

  const yearMonthRegex = /^\d{4}-\d{2}$/;
  if (!yearMonthRegex.test(start) || !yearMonthRegex.test(end)) {
    return res.status(400).json({
      error: 'Invalid year month format. Use YYYY-MM format (e.g., 2024-01)',
    });
  }

  const clientIdList: string[] = [];
  if (Array.isArray(clientId)) {
    clientIdList.push(...clientId.filter(id => typeof id === "string") as string[])
  } else if (typeof clientId === "string") {
    clientIdList.push(clientId)
  }

  let clientCte = `
    SELECT
      cao_cliente.co_cliente
    FROM cao_cliente
    WHERE cao_cliente.tp_cliente = 'A'
  `;

  const queryParams = [];
  if (clientIdList.length > 0) {
    const placeholders = clientIdList.map(() => '?').join(',');
    clientCte += ` AND cao_cliente.co_cliente IN (${placeholders})`;
    queryParams.push(...clientIdList);
  }
  queryParams.push(start, end)

  const baseQuery = `
    WITH client AS (${clientCte}),
    monthly_revenue AS (
      SELECT
        client.co_cliente,
        CAST(strftime('%Y', cao_fatura.data_emissao) AS INTEGER) as year,
        CAST(strftime('%m', cao_fatura.data_emissao) AS INTEGER) as month,
        cao_fatura.valor as invoice_value,
        cao_fatura.valor * cao_fatura.total_imp_inc / 100.0 as taxes_value,
        cao_fatura.valor - (cao_fatura.valor * cao_fatura.total_imp_inc / 100.0) as net_invoice_value
      FROM cao_fatura
      INNER JOIN client ON cao_fatura.co_cliente = client.co_cliente
      WHERE cao_fatura.data_emissao IS NOT NULL
        AND strftime('%Y-%m', cao_fatura.data_emissao) >= ?
        AND strftime('%Y-%m', cao_fatura.data_emissao) <= ?
    ),
    aggregated_data AS (
      SELECT
        monthly_revenue.co_cliente,
        monthly_revenue.year,
        monthly_revenue.month,
        ROUND(SUM(monthly_revenue.invoice_value), 2) as invoice_value,
        ROUND(SUM(monthly_revenue.taxes_value), 2) as taxes_value,
        ROUND(SUM(monthly_revenue.net_invoice_value), 2) as net_value
      FROM monthly_revenue
      GROUP BY monthly_revenue.co_cliente, monthly_revenue.year, monthly_revenue.month
    )
    SELECT
      aggregated_data.co_cliente as clientId,
      aggregated_data.year,
      aggregated_data.month,
      aggregated_data.invoice_value as invoiceValue,
      aggregated_data.taxes_value as taxesValue,
      aggregated_data.net_value as netValue
    FROM aggregated_data
  `;

  const finalQuery = `
    ${baseQuery}
    ORDER BY aggregated_data.co_cliente, aggregated_data.year, aggregated_data.month
    LIMIT ? OFFSET ?
  `;

  const total = getTotal(baseQuery, queryParams);
  const hasNext = offset + limit < total;

  queryParams.push(limit, offset)
  let stmt = db.prepare<(string | number)[], ClientMonthlyTotal>(finalQuery);
  let monthly = stmt.all(...queryParams);

  let result: PaginationResult<ClientMonthlyTotal> = {
      limit,
      offset,
      total,
      hasNext,
      content: monthly
  };

  res.json(result)
});

export default router;
