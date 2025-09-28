export function parsePagination(req) {
    const limit = parseInt(req.query.limit ?? "10", 10);
    const offset = parseInt(req.query.offset ?? "0", 10);
    return {
        limit: Math.max(1, limit),
        offset: offset,
    };
}
