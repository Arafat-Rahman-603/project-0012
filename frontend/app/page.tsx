"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Truck, RotateCcw } from "lucide-react";
import { productsApi, categoriesApi } from "@/lib/api";
import { Product, Category } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { extractList } from "@/lib/listResponse";
import { defaultSiteSettings, useSiteSettings } from "@/hooks/useSiteSettings";

const fallbackBannerImages = [
  "https://static.vecteezy.com/system/resources/thumbnails/004/299/835/small/online-shopping-on-phone-buy-sell-business-digital-web-banner-application-money-advertising-payment-ecommerce-illustration-search-free-vector.jpg",
  "https://cdn.vectorstock.com/i/500p/09/80/online-shopping-laptop-banner-vector-17230980.jpg"
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const { settings } = useSiteSettings();
  const bannerImages =
    settings.banners.length > 0
      ? settings.banners.map((banner) => banner.url)
      : fallbackBannerImages;

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
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden stripe-bg">
        {bannerImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === activeBanner ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/45 to-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-ink/70" />

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-15">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border-[40px] border-cream/25" />
          <div className="absolute bottom-20 right-40 w-40 h-40 rounded-full border-[24px] border-amber/40" />
          <div className="absolute top-1/2 right-10 w-20 h-80 bg-cream/10 transform rotate-12 -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-200 mb-6 px-3 py-1.5 bg-amber/10 rounded-sm border border-amber/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {settings.siteName || defaultSiteSettings.siteName}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight text-cream"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {settings.heroTitle || defaultSiteSettings.heroTitle}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-6 text-lg md:text-xl text-cream/80 max-w-xl leading-relaxed"
            >
              {settings.heroSubtitle || defaultSiteSettings.heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                href={settings.heroCtaHref || defaultSiteSettings.heroCtaHref}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber text-ink text-sm font-semibold rounded-sm hover:bg-amber-light transition-all hover:gap-3"
              >
                {settings.heroCtaText || defaultSiteSettings.heroCtaText}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?featured=true"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-cream/80 text-cream text-sm font-semibold rounded-sm hover:bg-cream hover:text-ink transition-all"
              >
                Explore Featured Sarees
              </Link>
            </motion.div>

            {bannerImages.length > 1 && (
              <div className="mt-8 flex items-center gap-2">
                {bannerImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveBanner(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeBanner ? "w-10 bg-amber" : "w-4 bg-cream/40"
                    }`}
                    aria-label={`Banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="absolute bottom-8 left-4 right-4 max-w-7xl mx-auto"
        >
          <div className="flex gap-8 md:gap-16">
            {[
              { value: "500+", label: "Sarees" },
              { value: "98%", label: "Happy Clients" },
              { value: "25+", label: "Collections" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  className="text-2xl md:text-3xl font-bold text-cream"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-cream/70 tracking-wider uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-ink/40 mb-2">
                Shop By
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Saree Categories
              </h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-ink/60 hover:text-ink flex items-center gap-1 transition-colors link-amber"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link
                  href={`/products?category=${cat._id}`}
                  className="group flex items-center gap-3 p-4 bg-parchment hover:bg-ink hover:text-cream rounded-sm transition-all duration-200"
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-10 h-10 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-sm bg-ink/10 group-hover:bg-cream/10 flex items-center justify-center text-lg">
                      🛍
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-ink/50 group-hover:text-cream/60 line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20 bg-parchment/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-ink/40 mb-2">
                Hand-Picked
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Featured Sarees
              </h2>
            </div>
            <Link
              href="/products?featured=true"
              className="text-sm font-medium text-ink/60 hover:text-ink flex items-center gap-1 transition-colors link-amber"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="skeleton aspect-[4/5] rounded-sm" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featuredProducts.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-ink/40">
              <p className="text-lg">No featured sarees yet</p>
              <Link
                href="/products"
                className="text-sm text-amber-500 hover:text-amber-600 mt-2 inline-block"
              >
                Browse all products →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 border-t border-ink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: Truck,
                title: "Free Delivery",
                desc: "On orders over ৳2,000",
              },
              {
                icon: Shield,
                title: "Secure Payment",
                desc: "256-bit SSL encryption",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                desc: "30-day return policy",
              },
              {
                icon: Sparkles,
                title: "Premium Quality",
                desc: "Curated and quality checked sarees",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 bg-amber/10 border border-amber/20 rounded-sm flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-ink/50 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-ink text-cream py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 stripe-bg" />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
          <div className="absolute right-16 top-8 w-40 h-40 rounded-full border-[30px] border-amber" />
          <div className="absolute right-4 bottom-8 w-24 h-24 rounded-full border-[16px] border-cream" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center"
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-amber mb-4">
            Limited Time
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Join Fancy Planet
          </h2>
          <p className="text-cream/60 mb-8 max-w-md mx-auto">
            Get early access to new saree drops, festive collections, and exclusive offers.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber text-ink text-sm font-semibold rounded-sm hover:bg-amber-light transition-all"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
