import { Request } from 'express';
import { PaginationParams } from 'backend/src/types/pagination';

export function parsePagination(req: Request): PaginationParams {
  const limit = parseInt(req.query.limit as string ?? "10", 10);
  const offset = parseInt(req.query.offset as string ?? "0", 10);
  return {
    limit: Math.max(1, limit),
    offset: offset,
  }
}
