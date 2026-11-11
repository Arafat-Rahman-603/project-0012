"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Shield, Truck, RotateCcw } from "lucide-react";
import { productsApi, categoriesApi } from "@/lib/api";
import { Product, Category } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { extractList } from "@/lib/listResponse";
import { defaultSiteSettings, useSiteSettings } from "@/hooks/useSiteSettings";

const fallbackBannerImages = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=85",
];

export default function HomeClient() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const { settings } = useSiteSettings();
  
  const bannerImages =
    settings.banners.length > 0
      ? settings.banners.map((banner) => banner.url)
      : fallbackBannerImages;

  const currentBanner = settings.banners?.[activeBanner];
  
  const activeTitle = currentBanner?.title || settings.heroTitle || defaultSiteSettings.heroTitle;
  const activeSubtitle = currentBanner?.subtitle || settings.heroSubtitle || defaultSiteSettings.heroSubtitle;
  const activeCtaText = currentBanner?.ctaText || settings.heroCtaText || defaultSiteSettings.heroCtaText;
  const activeCtaHref = currentBanner?.ctaHref || settings.heroCtaHref || defaultSiteSettings.heroCtaHref;
  
  const activeTextColor = currentBanner?.textColor || "#F8F6F0";
  const activeButtonBg = currentBanner?.buttonBg || "#D97706";
  const activeButtonColor = currentBanner?.buttonColor || "#0A0A0A";

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          productsApi.list({ featured: true, limit: 8 }),
          categoriesApi.list(),
        ]);
        setFeaturedProducts(extractList<Product>(prodRes.data, "products"));
        setCategories(extractList<Category>(catRes.data, "categories"));
      } catch (e) {
        // API not connected, show demo state
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (bannerImages.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % bannerImages.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [bannerImages.length]);

  return (
    <div className="pt-14 sm:pt-16 md:pt-18">
      {/* Hero */}
      <section className="relative min-h-[70vh] md:min-h-[78vh] flex items-center overflow-hidden stripe-bg">
        {bannerImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeBanner ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image}
              alt={`Banner ${index + 1}`}
              fill
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : "low"}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/50 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/70" />

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-15 pointer-events-none">
          <div className="absolute top-16 right-16 w-56 h-56 rounded-full border-[32px] border-cream/25" />
          <div className="absolute bottom-16 right-32 w-36 h-36 rounded-full border-[20px] border-amber/40" />
          <div className="absolute top-1/2 right-8 w-16 h-72 bg-cream/10 transform rotate-12 -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-200 mb-4 px-3 py-1 bg-amber/15 rounded-sm border border-amber/30 backdrop-blur-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber" />
              {settings.siteName || defaultSiteSettings.siteName}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeBanner}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight"
                  style={{ color: activeTextColor, fontFamily: "var(--font-display)" }}
                >
                  {activeTitle}
                </h1>

                <p
                  className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl max-w-xl leading-relaxed opacity-90 font-medium"
                  style={{ color: activeTextColor }}
                >
                  {activeSubtitle}
                </p>

                <div className="mt-7 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
                  <Link
                    href={activeCtaHref}
                    style={{ backgroundColor: activeButtonBg, color: activeButtonColor }}
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-sm font-semibold rounded-sm hover:opacity-95 transition-all hover:gap-3 shadow-md"
                  >
                    {activeCtaText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/products?featured=true"
                    style={{ borderColor: `${activeTextColor}80`, color: activeTextColor }}
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 border-2 text-sm font-semibold rounded-sm hover:bg-cream/10 transition-all backdrop-blur-xs"
                  >
                    Explore Featured Products
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {bannerImages.length > 1 && (
              <div className="mt-6 flex items-center gap-2">
                {bannerImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveBanner(index)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      index === activeBanner ? "w-8 bg-amber" : "w-3 bg-cream/40 hover:bg-cream/70"
                    }`}
                    aria-label={`Banner ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* In-flow Stats Bar */}
            <div className="mt-8 sm:mt-12 pt-6 border-t border-cream/20 flex flex-wrap gap-6 sm:gap-12">
              {[
                { value: "10k+", label: "Products" },
                { value: "99%", label: "Satisfaction" },
                { value: "64", label: "Districts" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p
                    className="text-xl sm:text-2xl font-bold text-cream"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-cream/70 tracking-wider uppercase mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-10 md:py-14 max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex items-end justify-between mb-6 md:mb-8"
          >
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-ink/40 mb-1">
                Shop By
              </p>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Categories
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-semibold text-ink/70 hover:text-ink flex items-center gap-1 transition-colors link-amber"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.slice(0, 8).map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <Link
                  href={`/products?category=${cat._id}`}
                  className="group flex items-center gap-3 p-3 sm:p-4 bg-parchment/60 hover:bg-ink hover:text-cream rounded-sm border border-ink/5 transition-all duration-200"
                >
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-sm object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-sm bg-ink/10 group-hover:bg-cream/10 flex items-center justify-center text-lg shrink-0">
                      🛍
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-[11px] text-ink/50 group-hover:text-cream/60 truncate mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-10 md:py-14 bg-parchment/40 border-y border-ink/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex items-end justify-between mb-6 md:mb-8"
          >
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-ink/40 mb-1">
                Hand-Picked
              </p>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Featured Products
              </h2>
            </div>
            <Link
              href="/products?featured=true"
              className="text-xs sm:text-sm font-semibold text-ink/70 hover:text-ink flex items-center gap-1 transition-colors link-amber"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2.5">
                  <div className="skeleton aspect-[4/5] rounded-sm" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {featuredProducts.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-ink/40">
              <p className="text-base font-medium">No featured products yet</p>
              <Link
                href="/products"
                className="text-xs font-semibold text-amber hover:underline mt-2 inline-block"
              >
                Browse all products →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 md:py-12 border-b border-ink/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Truck,
                title: "Free Delivery",
                desc: "On orders over ৳2,000",
              },
              {
                icon: Shield,
                title: "Secure Payment",
                desc: "Cash on delivery & bKash",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                desc: "7-day return policy",
              },
              {
                icon: Sparkles,
                title: "Premium Quality",
                desc: "100% authentic curated goods",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="flex flex-col items-center text-center gap-2.5"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber/10 border border-amber/20 rounded-sm flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-amber" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold">{item.title}</p>
                  <p className="text-[11px] text-ink/50 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-ink text-cream py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 stripe-bg" />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none">
          <div className="absolute right-12 top-6 w-36 h-36 rounded-full border-[24px] border-amber" />
          <div className="absolute right-4 bottom-6 w-20 h-20 rounded-full border-[14px] border-cream" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center"
        >
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber mb-2.5">
            Limited Time
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Join Next Shop
          </h2>
          <p className="text-cream/70 text-xs sm:text-sm mb-6 max-w-md mx-auto">
            Get early access to new product drops, festive collections, and exclusive member offers.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3 bg-amber text-ink text-xs sm:text-sm font-bold rounded-sm hover:bg-amber-light transition-all shadow-md"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
