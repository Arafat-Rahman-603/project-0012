"use client";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem, isLoading } =
    useCartStore();

  const items = cart?.items || [];
  const total = cart?.totalPrice || items.reduce(
    (s, i) => s + (i.product.discountPrice ?? i.product.price) * i.quantity, 0
  );

  const handleUpdate = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    await updateItem(itemId, qty);
  };

  const handleRemove = async (itemId: string) => {
    await removeItem(itemId);
    toast.success("Item removed");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-cream z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" />
                <h2
                  className="text-xl font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Your Cart
                </h2>
                {items.length > 0 && (
                  <span className="text-xs bg-ink text-cream px-1.5 py-0.5 rounded-sm">
                    {items.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-parchment rounded-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center"
                >
                  <div className="w-16 h-16 bg-parchment rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-ink/30" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink/80">Your cart is empty</p>
                    <p className="text-sm text-ink/50 mt-1">
                      Add some products to get started
                    </p>
                  </div>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="text-sm font-medium px-5 py-2 bg-ink text-cream rounded-sm hover:bg-ink/90 transition-colors"
                  >
                    Browse Products
                  </Link>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-3 bg-parchment/50 rounded-sm"
                      >
                        {/* Image */}
                        <div className="w-18 h-18 w-[72px] h-[72px] bg-parchment rounded-sm overflow-hidden shrink-0">
                          {item.product.images?.[0] ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              width={72}
                              height={72}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-ink/20" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight line-clamp-2">
                            {item.product.name}
                          </p>
                          <p className="text-sm font-semibold mt-1 text-amber-500">
                            ৳
                            {(
                              item.product.discountPrice ?? item.product.price
                            ).toLocaleString()}
                          </p>

                          {/* Qty controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                handleUpdate(item._id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1 || isLoading}
                              className="w-6 h-6 rounded-sm bg-parchment hover:bg-ink/10 flex items-center justify-center transition-colors disabled:opacity-40"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdate(item._id, item.quantity + 1)
                              }
                              disabled={isLoading}
                              className="w-6 h-6 rounded-sm bg-parchment hover:bg-ink/10 flex items-center justify-center transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRemove(item._id)}
                              className="ml-auto text-ink/30 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-ink/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink/60">Subtotal</span>
                  <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                    ৳{total?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-ink/40">
                  Shipping & taxes calculated at checkout
                </p>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors"
                >
                  Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="block text-center text-sm text-ink/60 hover:text-ink transition-colors py-1"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
