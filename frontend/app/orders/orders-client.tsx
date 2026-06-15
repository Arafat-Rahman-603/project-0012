"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types";
import { useAuthHydration } from "@/hooks/useAuthHydration";
import { extractList } from "@/lib/listResponse";
import {
  getOrderItemImage,
  getOrderItemName,
  getOrderStatus,
  formatBdt,
  normalizeOrder,
} from "@/lib/orderUtils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber/10",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  processing: {
    label: "Processing",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
};

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuthHydration();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    ordersApi
      .myOrders()
      .then(({ data }) => setOrders(extractList<Order>(data, "orders").map(normalizeOrder)))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setIsLoading(false));
  }, [isReady, isAuthenticated]);

  const handleCancel = async (id: string) => {
    try {
      await ordersApi.cancel(id);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: "cancelled" } : o))
      );
      toast.success("Order cancelled");
    } catch {
      toast.error("Cannot cancel this order");
    }
  };

  if (!isReady) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              My Orders
            </h1>
            <p className="text-ink/50 text-sm mt-1">
              Track and manage your orders
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-sm" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-parchment rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-10 h-10 text-ink/20" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-ink/50 mb-6">
                Start shopping to see your orders here
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => {
                const status = getOrderStatus(order);
                const statusCfg =
                  STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-ink/10 rounded-sm overflow-hidden hover:border-ink/20 transition-colors"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between p-4 bg-parchment/40 border-b border-ink/10">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-ink/40">Order ID</p>
                          <p className="text-sm font-mono font-medium">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-ink/40">Placed</p>
                          <p className="text-sm">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ink/40">Total</p>
                          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                            {formatBdt(order.totalPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm ${statusCfg.bg} ${statusCfg.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusCfg.label}
                        </span>
                        <Link
                          href={`/orders/${order._id}`}
                          className="text-ink/40 hover:text-ink transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {order.items.slice(0, 4).map((item, j) => (
                          <div
                            key={j}
                            className="w-14 h-14 shrink-0 bg-parchment rounded-sm overflow-hidden"
                          >
                            {getOrderItemImage(item) ? (
                              <Image
                                src={getOrderItemImage(item)}
                                alt={getOrderItemName(item)}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-ink/20" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-14 h-14 shrink-0 bg-parchment rounded-sm flex items-center justify-center text-xs text-ink/50 font-medium">
                            +{order.items.length - 4}
                          </div>
                        )}

                        {/* Item names */}
                        <div className="flex-1 min-w-0 ml-2">
                          <p className="text-sm font-medium line-clamp-1">
                            {order.items
                              .slice(0, 2)
                              .map((i) => getOrderItemName(i))
                              .join(", ")}
                            {order.items.length > 2 &&
                              ` +${order.items.length - 2} more`}
                          </p>
                          <p className="text-xs text-ink/40 mt-0.5">
                            {order.items.length} item
                            {order.items.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-ink/40 mt-1">
                            Via {order.paymentMethod.toUpperCase()} ·{" "}
                            {order.shippingAddress?.city}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {["pending", "confirmed", "processing"].includes(status) && (
                        <div className="mt-3 pt-3 border-t border-ink/10 flex justify-end">
                          <button
                            onClick={() => handleCancel(order._id)}
                            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
