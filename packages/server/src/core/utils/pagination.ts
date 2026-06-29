export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export function parsePaginationQuery(query: {
    page?: unknown;
    pageSize?: unknown;
}): { page: number; pageSize: number; offset: number } {
    const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number.parseInt(String(query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10) || DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;
    return { page, pageSize, offset };
}

export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
        page: Math.min(page, totalPages),
        pageSize,
        total,
        totalPages,
    };
}

export function paginateArray<T>(items: T[], page: number, pageSize: number): { items: T[]; total: number } {
    const total = items.length;
    const offset = (page - 1) * pageSize;
    return {
        items: items.slice(offset, offset + pageSize),
        total,
    };
}
