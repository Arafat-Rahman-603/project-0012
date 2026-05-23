"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/api";
import { Address } from "@/types";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateItem, removeItem, clearCart, isLoading } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "confirm">("cart");
  const paymentMethod = "cod";
  const [placing, setPlacing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Address>();

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (s, i) => s + (i.product.discountPrice ?? i.product.price) * i.quantity, 0
  );
  const shipping = subtotal > 2000 ? 0 : 80;
  const total = subtotal + shipping;

  const placeOrder = async (address: Address) => {
    setPlacing(true);
    try {
      await ordersApi.create({
        shippingAddress: address,
        paymentMethod,
      });
      await clearCart();
      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-ink/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view cart</h2>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-ink text-cream text-sm font-medium rounded-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && checkoutStep === "cart") {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-parchment rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-ink/20" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-ink/50 mb-6">Add products to get started</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors"
          >
            Browse Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          {["cart", "address", "confirm"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  checkoutStep === step
                    ? "bg-ink text-cream"
                    : i < ["cart", "address", "confirm"].indexOf(checkoutStep)
                    ? "bg-amber text-ink"
                    : "bg-parchment text-ink/40"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm capitalize hidden sm:inline ${
                  checkoutStep === step ? "font-semibold" : "text-ink/40"
                }`}
              >
                {step === "confirm" ? "Payment" : step}
              </span>
              {i < 2 && <div className="w-8 h-px bg-ink/15 hidden sm:block" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Content */}
          <div>
            <AnimatePresence mode="wait">
              {checkoutStep === "cart" && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1
                      className="text-2xl font-bold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Shopping Cart
                    </h1>
                    <span className="text-sm text-ink/50">{items.length} items</span>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="flex gap-4 p-4 border border-ink/10 rounded-sm hover:border-ink/20 transition-colors"
                      >
                        <Link
                          href={`/products/${item.product.slug || item.product._id}`}
                          className="w-20 h-20 bg-parchment rounded-sm overflow-hidden shrink-0"
                        >
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-ink/20" />
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.product.slug || item.product._id}`}
                            className="text-sm font-medium hover:text-amber-500 transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {item.product.brand && (
                            <p className="text-xs text-ink/40 mt-0.5">{item.product.brand}</p>
                          )}
                          <p className="text-sm font-semibold mt-1" style={{ fontFamily: "var(--font-display)" }}>
                            ৳{(item.product.discountPrice ?? item.product.price).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeItem(item._id)}
                            className="text-ink/30 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center border border-ink/15 rounded-sm">
                            <button
                              onClick={() => updateItem(item._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isLoading}
                              className="px-2 py-1.5 hover:bg-parchment transition-colors disabled:opacity-40"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateItem(item._id, item.quantity + 1)}
                              disabled={isLoading}
                              className="px-2 py-1.5 hover:bg-parchment transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-ink/40">
                            = ৳{((item.product.discountPrice ?? item.product.price) * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {checkoutStep === "address" && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h1
                    className="text-2xl font-bold mb-6"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Shipping Address
                  </h1>

                  <form
                    id="address-form"
                    onSubmit={handleSubmit(placeOrder)}
                    className="grid grid-cols-2 gap-4"
                  >
                    {[
                      { name: "fullName" as const, label: "Full Name", placeholder: "John Doe", col: 2 },
                      { name: "phone" as const, label: "Phone", placeholder: "01XXXXXXXXX", col: 1 },
                      { name: "addressLine1" as const, label: "Address", placeholder: "123 Main St", col: 2 },
                      { name: "city" as const, label: "City", placeholder: "Dhaka", col: 1 },
                      { name: "state" as const, label: "State/Division", placeholder: "Dhaka", col: 1 },
                      { name: "postalCode" as const, label: "Postal Code", placeholder: "1200", col: 1 },
                      { name: "country" as const, label: "Country", placeholder: "BD", col: 1 },
                    ].map((field) => (
                      <div key={field.name} className={field.col === 2 ? "col-span-2" : ""}>
                        <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5 text-ink/60">
                          {field.label}
                        </label>
                        <input
                          {...register(field.name, { required: `${field.label} is required` })}
                          placeholder={field.placeholder}
                          className="w-full bg-parchment border border-ink/10 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-amber transition-colors"
                        />
                        {errors[field.name] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[field.name]?.message}
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="col-span-2 p-4 bg-parchment border border-ink/10 rounded-sm">
                      <p className="text-xs font-semibold tracking-wider uppercase text-ink/50 mb-1">
                        Payment method
                      </p>
                      <p className="text-sm font-medium">Cash on Delivery (COD)</p>
                      <p className="text-xs text-ink/40 mt-1">
                        Pay when your order is delivered. Online payment is not available yet.
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-6">
              {checkoutStep !== "cart" && (
                <button
                  onClick={() =>
                    setCheckoutStep(checkoutStep === "address" ? "cart" : "address")
                  }
                  className="px-5 py-2.5 border border-ink/15 text-sm font-medium rounded-sm hover:bg-parchment transition-colors"
                >
                  Back
                </button>
              )}
              {checkoutStep === "cart" ? (
                <button
                  onClick={() => setCheckoutStep("address")}
                  className="flex-1 sm:flex-none px-8 py-2.5 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  form="address-form"
                  disabled={placing}
                  className="flex-1 sm:flex-none px-8 py-2.5 bg-amber text-ink text-sm font-semibold rounded-sm hover:bg-amber-light transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {placing ? "Placing Order…" : "Place Order"}{" "}
                  {!placing && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="border border-ink/10 rounded-sm p-5 space-y-4 sticky top-28">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Order Summary
              </h2>
              <div className="space-y-2 text-sm">
                {items.slice(0, 3).map((item) => (
                  <div key={item._id} className="flex justify-between gap-2">
                    <span className="text-ink/60 line-clamp-1 flex-1">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="shrink-0">
                      ৳{((item.product.discountPrice ?? item.product.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-ink/40">+{items.length - 3} more items</p>
                )}
              </div>
              <div className="border-t border-ink/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/60">Subtotal</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">Shipping</span>
                  <span className={shipping === 0 ? "text-green-600" : ""}>
                    {shipping === 0 ? "Free" : `৳${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-ink/40">
                    Free shipping on orders over ৳2,000
                  </p>
                )}
              </div>
              <div className="border-t border-ink/10 pt-4 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  ৳{total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
