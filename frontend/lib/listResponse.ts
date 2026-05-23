/** Backend paginatedResponse returns { success, data: T[], pagination }. */

type ListKey = "products" | "orders" | "users" | "categories";

export function extractList<T>(payload: unknown, key?: ListKey): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const obj = payload as Record<string, unknown>;

  if (Array.isArray(obj.data)) return obj.data as T[];
  if (key && Array.isArray(obj[key])) return obj[key] as T[];

  return [];
}

export function extractTotal(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;
  const obj = payload as Record<string, unknown>;
  const pagination = obj.pagination as { total?: number } | undefined;
  if (typeof pagination?.total === "number") return pagination.total;
  if (Array.isArray(obj.data)) return obj.data.length;
  return 0;
}
