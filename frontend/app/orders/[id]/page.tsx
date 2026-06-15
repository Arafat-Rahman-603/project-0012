"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Package, Clock, CheckCircle2, Truck, XCircle,
  MapPin, CreditCard, ChevronLeft, ShoppingBag, X
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import Link from "next/link";
import {
  getOrderItemImage,
  getOrderItemLink,
  getOrderItemName,
  getOrderStatus,
  normalizeOrder,
} from "@/lib/orderUtils";

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-500", bg: "bg-amber/10" },
  processing: { label: "Processing", icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-500", bg: "bg-purple-50" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    ordersApi.get(id)
      .then(({ data }) => setOrder(normalizeOrder(data?.order || data)))
      .catch(() => { toast.error("Order not found"); router.push("/orders"); })
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated]);

  const handleCancel = async () => {
    try {
      await ordersApi.cancel(id);
      setOrder(prev => prev ? { ...prev, status: "cancelled" } : null);
      toast.success("Order cancelled");
    } catch { toast.error("Cannot cancel this order"); }
  };

  if (isLoading) return (
    <div className="pt-24 max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-sm" />)}
    </div>
  );

  if (!order) return null;

  const status = getOrderStatus(order);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const currentStep = STATUS_STEPS.indexOf(status);
  const isCancelled = status === "cancelled";

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back */}
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" /> All Orders
          </Link>

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-ink/50 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium ${statusCfg.bg} ${statusCfg.color}`}>
              <StatusIcon className="w-4 h-4" /> {statusCfg.label}
            </span>
          </div>

          {/* Progress tracker */}
          {!isCancelled && (
            <div className="mb-8 p-5 bg-parchment/40 rounded-sm">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-ink/10 z-0" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-amber z-0 transition-all duration-700"
                  style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
                {STATUS_STEPS.map((step, i) => {
                  const cfg = STATUS_CONFIG[step];
                  const Icon = cfg.icon;
                  const done = i <= currentStep;
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        done ? "bg-amber border-amber text-ink" : "bg-cream border-ink/20 text-ink/30"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-[10px] font-semibold tracking-wider uppercase hidden sm:block ${done ? "text-ink" : "text-ink/30"}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border border-ink/10 rounded-sm overflow-hidden mb-5">
            <div className="px-5 py-3 border-b border-ink/10 bg-parchment/30">
              <h2 className="font-semibold text-sm">Items ({order.items.length})</h2>
            </div>
            <div className="divide-y divide-ink/10">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Link href={getOrderItemLink(item)}
                    className="w-14 h-14 bg-parchment rounded-sm overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
                    {getOrderItemImage(item)
                      ? <img src={getOrderItemImage(item)} alt={getOrderItemName(item)} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-ink/20" /></div>
                    }
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={getOrderItemLink(item)}
                      className="text-sm font-medium hover:text-amber-500 transition-colors line-clamp-2">
                      {getOrderItemName(item)}
                    </Link>
                    <p className="text-xs text-ink/40 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0" style={{ fontFamily: "var(--font-display)" }}>
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Shipping */}
            <div className="border border-ink/10 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-ink/40" />
                <h2 className="font-semibold text-sm">Shipping Address</h2>
              </div>
              <div className="text-sm text-ink/60 space-y-0.5">
                <p className="font-medium text-ink">{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                <p>{order.shippingAddress?.country}</p>
                <p className="pt-1">{order.shippingAddress?.phone}</p>
              </div>
            </div>

            {/* Payment & Total */}
            <div className="border border-ink/10 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-ink/40" />
                <h2 className="font-semibold text-sm">Payment</h2>
              </div>
              <p className="text-sm text-ink/60 capitalize mb-4">{order.paymentMethod}</p>
              <div className="space-y-2 text-sm border-t border-ink/10 pt-4">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>৳{order.items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>Shipping</span>
                  <span>{order.totalPrice > 2000 ? "Free" : "৳80"}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-ink/10">
                  <span>Total</span>
                  <span className="text-base" style={{ fontFamily: "var(--font-display)" }}>৳{order.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note to Seller */}
          {((order as any).notes || (order as any).noteImage?.url) && (
            <div className="mt-5 border border-amber/20 bg-amber/5 rounded-sm p-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-ink/40 mb-1">Note to Seller</p>
              {(order as any).notes && (
                <p className="text-sm text-ink/70 leading-relaxed">{(order as any).notes}</p>
              )}
              {(order as any).noteImage?.url && (
                <div className="mt-3">
                  <img
                    src={(order as any).noteImage.url}
                    alt="Order Note Attachment"
                    className="max-w-[200px] h-auto object-cover rounded-sm border border-amber/20 cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setLightboxImage((order as any).noteImage.url);
                      setIsLightboxOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Cancel */}
          {["pending", "processing"].includes(status) && (
            <div className="mt-6 pt-6 border-t border-ink/10 flex justify-end">
              <button onClick={handleCancel}
                className="text-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-5 py-2 rounded-sm transition-colors">
                Cancel Order
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsLightboxOpen(false);
              setLightboxImage(null);
            }}
            className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
                setLightboxImage(null);
              }}
              className="absolute top-6 right-6 text-cream/70 hover:text-cream hover:bg-cream/10 p-2 rounded-full transition-all"
              aria-label="Close fullscreen view"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={lightboxImage}
              alt="Order Note Attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-sm select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
