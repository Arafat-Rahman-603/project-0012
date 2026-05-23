import { Order } from "@/types";

export type OrderLike = Partial<Order> & {
  orderStatus?: string;
  status?: string;
  totalPrice?: number;
  items?: { price?: number; quantity?: number }[];
};

export function getOrderStatus(order: OrderLike): string {
  return order.orderStatus ?? order.status ?? "pending";
}

export function getOrderTotal(order: OrderLike): number {
  if (typeof order.totalPrice === "number" && !Number.isNaN(order.totalPrice)) {
    return order.totalPrice;
  }
  const items = order.items || [];
  return items.reduce(
    (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
    0
  );
}

export function formatBdt(amount?: number): string {
  return `৳${getOrderTotal({ totalPrice: amount }).toLocaleString()}`;
}

export function normalizeOrder<T extends OrderLike>(order: T): T & Order {
  const status = getOrderStatus(order);
  return {
    ...order,
    status: status as Order["status"],
    orderStatus: status,
    totalPrice: getOrderTotal(order),
    items: (order.items || []) as Order["items"],
  } as T & Order;
}

type OrderItem = Order["items"][number];

export function getOrderItemProduct(item: OrderItem) {
  return item.product && typeof item.product === "object" ? item.product : null;
}

export function getOrderItemImage(item: OrderItem): string {
  const product = getOrderItemProduct(item);
  return item.image || product?.images?.[0]?.url || "";
}

export function getOrderItemName(item: OrderItem): string {
  const product = getOrderItemProduct(item);
  return item.name || product?.name || "Product";
}

export function getOrderItemLink(item: OrderItem): string {
  const product = getOrderItemProduct(item);
  const productId = typeof item.product === "string" ? item.product : product?._id;
  return `/products/${product?.slug || productId || ""}`;
}
