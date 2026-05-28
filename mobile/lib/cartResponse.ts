import { Cart, CartItem, Product } from "@/types";

export function parseCartPayload(payload: unknown): Cart | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const rawItems = Array.isArray(data.items) ? data.items : [];

  const items: CartItem[] = rawItems
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      _id: String(item._id ?? ""),
      product: (item.product ?? {}) as Product,
      quantity: Number(item.quantity ?? 1),
    }));

  return {
    _id: String(data._id ?? ""),
    user: String(data.user ?? ""),
    items,
    totalPrice: Number(data.totalPrice ?? data.subtotal ?? 0),
  };
}
