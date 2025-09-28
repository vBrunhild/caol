export interface PaginationResult<T> {
    limit: number;
    offset: number;
    total: number;
    hasNext: boolean;
    content: T[];
}
//# sourceMappingURL=paginationResult.d.ts.map