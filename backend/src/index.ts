import { db } from 'backend/src/database';
import { parsePagination, getTotal } from 'backend/src/functions';
import { PaginationResult } from 'backend/src/types/pagination';
import express from 'express';
import { User } from 'shared/src/types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/v1/consultant', (req, res) => {
  const { limit, offset } = parsePagination(req);

  const baseQuery = `
    FROM cao_usuario
    INNER JOIN permissao_sistema ON cao_usuario.co_usuario = permissao_sistema.co_usuario
    WHERE permissao_sistema.co_sistema = 1
      AND permissao_sistema.in_ativo = 'S'
      AND permissao_sistema.co_tipo_usuario in (0, 1, 2)
  `;

  const dataStmt = db.prepare<[number, number], User>(`
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
      ${baseQuery}
    ORDER BY cao_usuario.co_usuario
    LIMIT ? OFFSET ?
  `);

  const users = dataStmt.all(limit, offset);
  const total = getTotal(baseQuery);
  const hasNext = offset + limit < total;

  const result: PaginationResult<User> = {
    limit,
    offset,
    total,
    hasNext,
    content: users,
  };

  res.json(result);
});

app.get('/api/v1/consultant/monthly-totals', (req, res) => {
  const { start, end, userIds } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'start and end are required paremeters' });
  }

  const yearMonthRegex = /^\d{4}-\d{2}$/;
  if (!yearMonthRegex.test(start as string) || !yearMonthRegex.test(end as string)) {
    return res.status(400).json({
      error: 'Invalid year month format. Use YYYY-MM format (e.g., 2024-01)',
    });
  }

  let userIdList: string[] | null = null;
  if (userIds) {
    try {
      userIdList = Array.isArray(userIds) ? userIds as string[] : null;
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid userIds format',
      });
    }
  }

  let baseQuery = `
    SELECT
      cao_usuario.co_usuario as userId,
      cao_usuario.no_usuario as userName,
      CAST(strftime('%Y', cao_fatura.data_emissao) AS INTEGER) as year,
      CAST(strftime('%m', cao_fatura.data_emissao) AS INTEGER) as month,
      SUM(cao_fatura.valor - (cao_fatura.valor * cao_fatura.total_imp_inc / 100)) as netValue
    FROM cao_fatura
    INNER JOIN cao_os ON cao_fatura.co_os = cao_os.co_os
    INNER JOIN cao_usuario ON cao_os.co_usuario = cao_usuario.co_usuario
    INNER JOIN permissao_sistema ON cao_usuario.co_usuario = permissao_sistema.co_usuario
    WHERE permissao_sistema.co_sistema = 1
      AND permissao_sistema.in_ativo = 'S'
      AND permissao_sistema.co_tipo_usuario IN (0, 1, 2)
      AND cao_fatura.data_emissao IS NOT NULL
  `;

  let stmt = db.prepare<[string, string], Record<string, any>>(baseQuery);
  res.json(stmt.all('', ''))
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
