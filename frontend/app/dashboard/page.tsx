"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Heart,
  User,
  MapPin,
  ChevronRight,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types";
import { useAuthHydration } from "@/hooks/useAuthHydration";
import { extractList } from "@/lib/listResponse";
import { getOrderStatus, formatBdt, normalizeOrder } from "@/lib/orderUtils";

export default function DashboardPage() {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();
  const { isReady, isAuthenticated: authOk } = useAuthHydration();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!authOk) {
      router.push("/login");
      return;
    }
    if (user?.role === "admin") {
      router.replace("/admin");
      return;
    }
    fetchMe();
    ordersApi
      .myOrders()
      .then(({ data }) =>
        setOrders(extractList<Order>(data, "orders").map(normalizeOrder).slice(0, 5))
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isReady, authOk, user?.role]);

  if (!isReady || !user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const wishlistCount = user.wishlist?.length || 0;

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 text-ink/40 text-sm mb-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>Account</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p className="text-ink/50 text-sm mt-1">{user.email}</p>
          {!user.isEmailVerified && (
            <p className="mt-3 text-sm text-amber-600 bg-amber/10 inline-block px-3 py-1.5 rounded-sm">
              Verify your email to place orders and leave reviews.{" "}
              <Link href={`/verify-email?email=${encodeURIComponent(user.email)}`} className="underline font-medium">
                Enter code
              </Link>
            </p>
          )}
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Wishlist items", value: wishlistCount, icon: Heart, href: "/profile?tab=wishlist" },
            { label: "Saved addresses", value: user.addresses?.length || 0, icon: MapPin, href: "/profile?tab=addresses" },
            {
              label: "Account status",
              value: user.isEmailVerified ? "Verified" : "Pending",
              icon: CheckCircle2,
              href: user.isEmailVerified ? "/profile" : `/verify-email?email=${encodeURIComponent(user.email)}`,
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="border border-ink/10 rounded-sm p-5 hover:border-ink/25 transition-colors group"
            >
              <card.icon className="w-5 h-5 text-ink/40 mb-3 group-hover:text-amber transition-colors" />
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {card.value}
              </p>
              <p className="text-xs text-ink/50 mt-1">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Recent orders
              </h2>
              <Link href="/orders" className="text-sm text-amber-500 hover:text-amber-600 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-sm" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-dashed border-ink/20 rounded-sm py-12 text-center">
                <Package className="w-10 h-10 text-ink/20 mx-auto mb-2" />
                <p className="text-sm text-ink/50">No orders yet</p>
                <Link href="/products" className="text-sm text-amber-500 mt-2 inline-block">
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/orders/${order._id}`}
                    className="flex items-center justify-between border border-ink/10 rounded-sm p-4 hover:bg-parchment/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-ink/40 capitalize">{getOrderStatus(order)}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatBdt(order.totalPrice)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Quick links
            </h2>
            <div className="space-y-2">
              {[
                { icon: User, label: "Edit profile", href: "/profile" },
                { icon: Package, label: "My orders", href: "/orders" },
                { icon: Heart, label: "Wishlist", href: "/profile?tab=wishlist" },
                { icon: MapPin, label: "Addresses", href: "/profile?tab=addresses" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 border border-ink/10 rounded-sm hover:bg-parchment transition-colors text-sm"
                >
                  <item.icon className="w-4 h-4 text-ink/40" />
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto text-ink/30" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
