export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginationResult<T> {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
  content: T[];
}
