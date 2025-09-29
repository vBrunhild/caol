import express from 'express';
import { db } from '../../database.js';
import { parsePagination } from '../../functions/pagination.js';
import { getTotal } from '../../functions/getTotal.js';
const router = express.Router();
router.get('/', (req, res) => {
    const { limit, offset } = parsePagination(req);
    const baseQuery = `
    SELECT
      cao_usuario.co_usuario AS id,
      cao_usuario.no_usuario AS name,
      cao_usuario.co_usuario_autorizacao AS authorizationUserId,
      cao_usuario.nu_matricula AS registrationNumber,
      cao_usuario.dt_nascimento AS birthDate,
      cao_usuario.dt_admissao_empresa AS companyAdmissionDate,
      cao_usuario.dt_desligamento AS companyDismissalDate,
      cao_usuario.dt_inclusao AS inclusionDate,
      cao_usuario.dt_expiracao AS expirationDate,
      cao_usuario.nu_cpf AS cpf,
      cao_usuario.nu_rg AS rg,
      cao_usuario.no_orgao_emissor AS issuingAgency,
      cao_usuario.uf_orgao_emissor AS issuingState,
      cao_usuario.ds_endereco AS address,
      cao_usuario.no_email AS email,
      cao_usuario.no_email_pessoal AS personalEmail,
      cao_usuario.nu_telefone AS phone,
      cao_usuario.dt_alteracao AS lastModified,
      cao_usuario.url_foto AS photoUrl,
      cao_usuario.instant_messenger AS instantMessenger,
      cao_usuario.icq AS icq,
      cao_usuario.msn AS msn,
      cao_usuario.yms AS yahooMessenger,
      cao_usuario.ds_comp_end AS addressComplement,
      cao_usuario.ds_bairro AS neighborhood,
      cao_usuario.nu_cep AS postalCode,
      cao_usuario.no_cidade AS city,
      cao_usuario.uf_cidade AS state,
      cao_usuario.dt_expedicao AS issueDate
    FROM cao_usuario
    INNER JOIN permissao_sistema ON cao_usuario.co_usuario = permissao_sistema.co_usuario
    WHERE permissao_sistema.co_sistema = 1
      AND permissao_sistema.in_ativo = 'S'
      AND permissao_sistema.co_tipo_usuario in (0, 1, 2)
  `;
    const finalQuery = `
    ${baseQuery}
    ORDER BY cao_usuario.co_usuario
    LIMIT ? OFFSET ?
  `;
    const stmt = db.prepare(finalQuery);
    const users = stmt.all(limit, offset);
    const total = getTotal(baseQuery);
    const hasNext = offset + limit < total;
    const result = {
        limit,
        offset,
        total,
        hasNext,
        content: users,
    };
    res.json(result);
});
router.get('/monthly-totals', (req, res) => {
    const { limit, offset } = parsePagination(req);
    let { start, end, userId } = req.query;
    start = start;
    end = end;
    if (!start || !end) {
        return res.status(400).json({ error: 'start and end are required paremeters' });
    }
    const yearMonthRegex = /^\d{4}-\d{2}$/;
    if (!yearMonthRegex.test(start) || !yearMonthRegex.test(end)) {
        return res.status(400).json({
            error: 'Invalid year month format. Use YYYY-MM format (e.g., 2024-01)',
        });
    }
    const userIdList = [];
    if (Array.isArray(userId)) {
        userIdList.push(...userId.filter(id => typeof id === "string"));
    }
    else if (typeof userId === "string") {
        userIdList.push(userId);
    }
    let consultantCte = `
    SELECT
      cao_usuario.co_usuario
    FROM cao_usuario
    INNER JOIN permissao_sistema ON cao_usuario.co_usuario = permissao_sistema.co_usuario
    WHERE permissao_sistema.co_sistema = 1
      AND permissao_sistema.in_ativo = 'S'
      AND permissao_sistema.co_tipo_usuario in (0, 1, 2)
  `;
    const queryParams = [];
    if (userIdList.length > 0) {
        const placeholders = userIdList.map(() => '?').join(',');
        consultantCte += ` AND cao_usuario.co_usuario IN (${placeholders})`;
        queryParams.push(...userIdList);
    }
    queryParams.push(start, end);
    const baseQuery = `
    WITH consultant AS (${consultantCte}),
    monthly_revenue AS (
      SELECT
        consultant.co_usuario,
        CAST(strftime('%Y', cao_fatura.data_emissao) AS INTEGER) as year,
        CAST(strftime('%m', cao_fatura.data_emissao) AS INTEGER) as month,
        cao_fatura.valor as invoice_value,
        cao_fatura.valor * cao_fatura.total_imp_inc / 100.0 as taxes_value,
        cao_fatura.valor - (cao_fatura.valor * cao_fatura.total_imp_inc / 100.0) as net_invoice_value,
        (cao_fatura.valor - (cao_fatura.valor * cao_fatura.total_imp_inc / 100.0)) * cao_fatura.comissao_cn / 100.0 as comission_value
      FROM cao_fatura
      INNER JOIN cao_os ON cao_fatura.co_os = cao_os.co_os
      INNER JOIN consultant ON cao_os.co_usuario = consultant.co_usuario
      WHERE cao_fatura.data_emissao IS NOT NULL
        AND strftime('%Y-%m', cao_fatura.data_emissao) >= ?
        AND strftime('%Y-%m', cao_fatura.data_emissao) <= ?
    ),
    aggregated_data AS (
      SELECT
        monthly_revenue.co_usuario,
        monthly_revenue.year,
        monthly_revenue.month,
        ROUND(SUM(monthly_revenue.invoice_value), 2) as invoice_value,
        ROUND(SUM(monthly_revenue.taxes_value), 2) as taxes_value,
        ROUND(SUM(monthly_revenue.net_invoice_value), 2) as net_value,
        ROUND(SUM(monthly_revenue.comission_value), 2) as comission_value
      FROM monthly_revenue
      GROUP BY monthly_revenue.co_usuario, monthly_revenue.year, monthly_revenue.month
    )
    SELECT
      aggregated_data.co_usuario as userId,
      aggregated_data.year,
      aggregated_data.month,
      aggregated_data.invoice_value as invoiceValue,
      aggregated_data.taxes_value as taxesValue,
      aggregated_data.net_value as netValue,
      aggregated_data.comission_value as comissionValue,
      cao_salario.brut_salario as fixedCost,
      ROUND(aggregated_data.net_value - aggregated_data.comission_value - cao_salario.brut_salario, 2) as profit
    FROM aggregated_data
    INNER JOIN cao_salario ON aggregated_data.co_usuario = cao_salario.co_usuario
  `;
    const finalQuery = `
    ${baseQuery}
    ORDER BY aggregated_data.co_usuario, aggregated_data.year, aggregated_data.month
    LIMIT ? OFFSET ?
  `;
    const total = getTotal(baseQuery, queryParams);
    const hasNext = offset + limit < total;
    queryParams.push(limit, offset);
    let stmt = db.prepare(finalQuery);
    let monthly = stmt.all(...queryParams);
    let result = {
        limit,
        offset,
        total,
        hasNext,
        content: monthly
    };
    res.json(result);
});
export default router;
