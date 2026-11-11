"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types";
import { formatBdt } from "@/lib/orderUtils";
import { toast } from "sonner";

function TrackingForm() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error("Please enter your Order Number (e.g. ORD-...)");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter the Phone Number used for the order");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await ordersApi.trackPublic(orderNumber.trim(), phone.trim());
      setOrder(data?.order || null);
    } catch (err: any) {
      setOrder(null);
      toast.error(
        err?.response?.data?.message || "Order not found. Please check your order and phone number."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Tracking code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const STATUS_STEPS = [
    { key: "pending", label: "Order Placed", desc: "Received and awaiting confirmation" },
    { key: "confirmed", label: "Confirmed", desc: "Order confirmed by our team" },
    { key: "processing", label: "Processing", desc: "Packaging items for shipment" },
    { key: "shipped", label: "Handed over to Courier", desc: "In transit with delivery partner" },
    { key: "delivered", label: "Delivered", desc: "Delivered to your address" },
  ];

  const currentStatus = order?.orderStatus || "pending";
  const statusKeys = STATUS_STEPS.map((s) => s.key);
  const currentStepIdx = statusKeys.indexOf(currentStatus);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber">
            Delivery Tracking
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold mt-2 mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Track Your Order
          </h1>
          <p className="text-ink/60 text-sm">
            Enter your Order Number and Contact Phone to track live delivery status and courier updates.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-parchment/60 border border-ink/10 rounded-sm p-6 sm:p-8 mb-10 shadow-sm">
          <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1.5">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-171829-0001"
                className="w-full bg-cream border border-ink/15 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-cream border border-ink/15 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-amber transition-colors"
                required
              />
            </div>
            <div className="sm:col-span-2 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-ink text-cream text-sm font-semibold rounded-sm hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Search className="w-4 h-4" />
                {loading ? "Searching Order…" : "Track Order Status"}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <AnimatePresence>
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Order summary card */}
              <div className="bg-cream border border-ink/15 rounded-sm p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ink/10">
                  <div>
                    <span className="text-xs text-ink/50 uppercase tracking-widest">Order ID</span>
                    <h2
                      className="text-2xl font-bold font-mono text-ink mt-0.5"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {order.orderNumber}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-ink/50 uppercase tracking-widest">Status</span>
                    <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 bg-amber/10 px-3 py-1 rounded-sm mt-0.5">
                      {order.orderStatus}
                    </p>
                  </div>
                </div>

                {/* Courier Partner Info */}
                {order.courier?.provider && order.courier.provider !== "none" ? (
                  <div className="my-6 p-4 bg-parchment/60 border border-amber/30 rounded-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber/20 rounded-full flex items-center justify-center text-amber">
                        <Truck className="w-5 h-5 text-ink" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-ink/50 font-semibold">
                          Delivery Partner
                        </p>
                        <p className="text-base font-bold capitalize text-ink">
                          {order.courier.provider === "steadfast"
                            ? "Steadfast Courier"
                            : order.courier.provider === "pathao"
                            ? "Pathao Courier"
                            : order.courier.provider}
                        </p>
                      </div>
                    </div>

                    {order.courier.trackingCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink/60 font-mono">
                          Tracking: <strong>{order.courier.trackingCode}</strong>
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.courier.trackingCode)}
                          className="p-1.5 hover:bg-parchment rounded border border-ink/20 transition-colors"
                          title="Copy tracking code"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-ink/70" />
                          )}
                        </button>
                        {order.courier.provider === "steadfast" && (
                          <a
                            href={`https://steadfast.com.bd/t/${order.courier.trackingCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline font-medium ml-2"
                          >
                            Live Portal <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="my-6 p-4 bg-parchment/30 border border-ink/10 rounded-sm flex items-center gap-3 text-sm text-ink/60">
                    <Clock className="w-4 h-4 text-ink/40" />
                    <span>Your order is being prepared and will be assigned to a courier shortly.</span>
                  </div>
                )}

                {/* Progress Steps Timeline */}
                <div className="py-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/60 mb-6">
                    Timeline
                  </h3>
                  <div className="relative">
                    <div className="space-y-6">
                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;
                        return (
                          <div key={step.key} className="flex items-start gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                isDone
                                  ? "bg-ink text-cream border-ink"
                                  : "bg-parchment text-ink/30 border-ink/10"
                              } ${isCurrent ? "ring-2 ring-amber ring-offset-2" : ""}`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-amber" />
                              ) : (
                                <span className="text-xs font-semibold">{idx + 1}</span>
                              )}
                            </div>
                            <div>
                              <p
                                className={`text-sm font-bold ${
                                  isDone ? "text-ink" : "text-ink/40"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="text-xs text-ink/50 mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Details & Items */}
                <div className="pt-6 border-t border-ink/10">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/60 mb-4">
                    Items in Order
                  </h3>
                  <div className="divide-y divide-ink/5">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-parchment rounded overflow-hidden shrink-0">
                            {item.image || item.product?.images?.[0]?.url ? (
                              <Image
                                src={item.image || item.product.images[0].url}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink/30">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">{item.name}</p>
                            <p className="text-xs text-ink/50">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-ink">
                          {formatBdt(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-ink/10 flex justify-between items-center text-base font-bold">
                    <span>Total Amount (COD):</span>
                    <span className="text-amber-700">{formatBdt(order.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {searched && !loading && !order && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-parchment/40 border border-ink/10 rounded-sm"
            >
              <AlertCircle className="w-12 h-12 text-ink/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-ink">No Order Found</h3>
              <p className="text-sm text-ink/50 max-w-md mx-auto mt-1">
                Please double check your Order Number and Phone Number. If you just placed your order, it might take a few moments to sync.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackingForm />
    </Suspense>
  );
}

