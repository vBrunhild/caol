import express, { Router } from 'express';
import { db } from '../../database.js';
import { parsePagination } from '../../functions/pagination.js';
import { getTotal } from '../../functions/getTotal.js';
import { PaginationResult, ServiceOrder } from '../../types.js';

const router: Router = express.Router();

router.get('/', (req, res) => {
  const { limit, offset } = parsePagination(req);
  let { userId, startRequestDate, endRequestDate } = req.query;

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (startRequestDate && !isoDateRegex.test(startRequestDate as string)) {
    return res.status(400).json({
      error: 'Invalid startRequestDate format. Use YYYY-MM-DD format (e.g., 2024-01-01)',
    });
  }

  if (endRequestDate && !isoDateRegex.test(endRequestDate as string)) {
    return res.status(400).json({
      error: 'Invalid endRequestDate format. Use YYYY-MM-DD format (e.g., 2024-01-01)',
    });
  }

  const userIdList: string[] = [];
  if (Array.isArray(userId)) {
    userIdList.push(...userId.filter(id => typeof id === "string") as string[]);
  } else if (typeof userId === "string") {
    userIdList.push(userId);
  }

  let baseQuery = `
    SELECT
      co_os as serviceOrderId,
      nu_os as orderNumber,
      co_sistema as systemId,
      co_usuario as consultantId,
      co_arquitetura as architectureId,
      ds_os as description,
      ds_caracteristica as characteristics,
      ds_requisito as requirements,
      dt_inicio as startDate,
      dt_fim as endDate,
      co_status as statusId,
      diretoria_sol as requestingDepartment,
      dt_sol as requestDate,
      nu_tel_sol as requestPhone,
      ddd_tel_sol as requestPhoneAreaCode,
      nu_tel_sol2 as requestPhone2,
      ddd_tel_sol2 as requestPhone2AreaCode,
      usuario_sol as requestingUser,
      dt_imp as implementationDate,
      dt_garantia as warrantyDate,
      co_email as emailId,
      co_os_prospect_rel as prospectRelationId
    FROM cao_os
  `;

  const filters: string[] = [];
  const params: any[] = [];

  if (userIdList.length > 0) {
    const placeholders = userIdList.map(() => '?').join(',');
    filters.push(`cao_os.co_usuario IN (${placeholders})`);
    params.push(...userIdList);
  }

  if (startRequestDate) {
    filters.push('cao_os.dt_sol >= ?');
    params.push(startRequestDate);
  }

  if (endRequestDate) {
    filters.push('cao_os.dt_sol <= ?');
    params.push(endRequestDate);
  }

  if (filters.length > 0) {
    baseQuery += ' WHERE ' + filters.join(' AND ');
  }

  const finalQuery = `
    ${baseQuery}
    ORDER BY dt_sol DESC, co_os DESC
    LIMIT ? OFFSET ?
  `;

  const total = getTotal(baseQuery, params);
  const hasNext = offset + limit < total;

  params.push(limit, offset);
  const stmt = db.prepare<any[], ServiceOrder>(finalQuery);
  const serviceOrders = stmt.all(...params);

  const result: PaginationResult<ServiceOrder> = {
    limit,
    offset,
    total,
    hasNext,
    content: serviceOrders,
  };

  res.json(result);
});

export default router;
