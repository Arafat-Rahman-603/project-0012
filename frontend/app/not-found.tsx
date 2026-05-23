"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="text-center max-w-lg">
        <div className="relative inline-block mb-8">
          <p className="text-[120px] md:text-[180px] font-bold leading-none text-parchment select-none"
            style={{ fontFamily: "var(--font-display)" }}>404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-ink rounded-sm flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-cream" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Page Not Found</h1>
        <p className="text-ink/60 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to shopping.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-cream text-sm font-medium rounded-sm hover:bg-ink/90 transition-colors">
            Go Home <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 border border-ink/15 text-sm font-medium rounded-sm hover:bg-parchment transition-colors">
            <Search className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
