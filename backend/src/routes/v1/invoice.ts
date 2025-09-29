import express, { Router } from 'express';
import { db } from '../../database.js';
import { parsePagination } from '../../functions/pagination.js';
import { getTotal } from '../../functions/getTotal.js';
import { PaginationResult, Invoice } from '../../types.js';

const router: Router = express.Router();

router.get('/', (req, res) => {
  const { limit, offset } = parsePagination(req);
  let { startIssueDate, endIssueDate, serviceOrderId } = req.query;

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (startIssueDate && !isoDateRegex.test(startIssueDate as string)) {
    return res.status(400).json({
      error: 'Invalid startRequestDate format. Use YYYY-MM-DD format (e.g., 2024-01-01)',
    });
  }

  if (endIssueDate && !isoDateRegex.test(endIssueDate as string)) {
    return res.status(400).json({
      error: 'Invalid endRequestDate format. Use YYYY-MM-DD format (e.g., 2024-01-01)',
    });
  }

  const serviceOrderIdList: string[] = [];
  if (Array.isArray(serviceOrderId)) {
    serviceOrderIdList.push(...serviceOrderId.filter(id => typeof id === "string") as string[]);
  } else if (typeof serviceOrderId === "string") {
    serviceOrderIdList.push(serviceOrderId);
  }

  let baseQuery = `
    SELECT
      cao_fatura.co_fatura as invoiceId,
      cao_fatura.co_cliente as clientId,
      cao_fatura.co_sistema as systemId,
      cao_fatura.co_os as serviceOrderId,
      cao_fatura.num_nf as invoiceNumber,
      cao_fatura.valor as value,
      cao_fatura.data_emissao as issueDate,
      cao_fatura.corpo_nf as invoiceBody,
      cao_fatura.comissao_cn as commissionPercentage,
      cao_fatura.total_imp_inc as taxPercentage
    FROM cao_fatura
  `;

  const filters: string[] = [];
  const params: any[] = [];

  if (startIssueDate) {
    filters.push('cao_fatura.data_emissao >= ?');
    params.push(startIssueDate);
  }

  if (endIssueDate) {
    filters.push('cao_fatura.data_emissao <= ?');
    params.push(endIssueDate)
  }

  if (serviceOrderIdList.length > 0) {
    const placeholders = serviceOrderIdList.map(() => '?').join(',');
    filters.push(`cao_fatura.co_os IN (${placeholders})`);
    params.push(...serviceOrderIdList);
  }

  if (filters.length > 0) {
    baseQuery += ' WHERE ' + filters.join(' AND ')
  }

  const finalQuery = `
    ${baseQuery}
    ORDER BY cao_fatura.data_emissao DESC, cao_fatura.co_fatura DESC
    LIMIT ? OFFSET ?
  `;

  const total = getTotal(baseQuery, params);
  const hasNext = offset + limit < total;

  params.push(limit, offset);
  const stmt = db.prepare<any[], Invoice>(finalQuery);
  const invoices = stmt.all(...params);

  const result: PaginationResult<Invoice> = {
    limit,
    offset,
    total,
    hasNext,
    content: invoices,
  };

  res.json(result);
});

export default router;
