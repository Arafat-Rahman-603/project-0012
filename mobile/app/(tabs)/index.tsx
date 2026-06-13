import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsApi, categoriesApi, settingsApi } from "@/lib/api";
import { Product, Category } from "@/types";
import { extractList } from "@/lib/listResponse";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import ProductCard from "@/components/product/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useToast, Toast } from "@/components/ui/Toast";

const DEFAULT_BANNERS = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80",
];

const STATS = [
  { value: "500+", label: "Sarees" },
  { value: "98%", label: "Happy Clients" },
  { value: "25+", label: "Collections" },
];

const TRUST = [
  { icon: "car-outline", title: "Free Delivery", desc: "On orders over ৳2,000" },
  { icon: "shield-checkmark-outline", title: "Secure Payment", desc: "256-bit SSL encryption" },
  { icon: "refresh-outline", title: "Easy Returns", desc: "30-day return policy" },
  { icon: "sparkles-outline", title: "Premium Quality", desc: "Curated sarees" },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { itemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toast, hide, error: showError } = useToast();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef<FlatList>(null);

  // Dynamic responsive columns logic
  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };
  const cols = getColumns();
  const cardWidth = (width - Spacing.lg * 2 - Spacing.sm * (cols - 1)) / cols;
  const trustWidth = (width - Spacing.lg * 2 - Spacing.lg * (cols - 1)) / cols;

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes, settingsRes] = await Promise.all([
          productsApi.list({ featured: true, limit: 8 }),
          categoriesApi.list(),
          settingsApi.get().catch(() => ({ data: null })), // Soft catch so home works even if settings fail
        ]);
        setFeaturedProducts(extractList<Product>(prodRes.data, "products"));
        setCategories(extractList<Category>(catRes.data, "categories"));
        if (settingsRes && settingsRes.data) {
          setSettings(settingsRes.data.settings || settingsRes.data);
        }
      } catch (err: any) {
        console.error("[Home Load Error]", err.message || err);
      }
      finally { setIsLoading(false); }
    }
    load();
  }, []);

  const siteName = settings?.siteName || "FANCY PLANET";
  const heroTitle = settings?.heroTitle || "Elegant\nSarees for\nEvery Occasion";
  const heroSubtitle = settings?.heroSubtitle || "Discover hand-picked sarees from across India";
  const heroCtaText = settings?.heroCtaText || "Shop Now";

  const bannerImages = settings?.banners && settings.banners.length > 0
    ? settings.banners.map((b: any) => b.url)
    : DEFAULT_BANNERS;

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % bannerImages.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const handleCtaPress = () => {
    const href = settings?.heroCtaHref || "/products";
    if (href.startsWith("/")) {
      router.push(href as any);
    } else {
      router.push("/products");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Toast {...toast} onHide={hide} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandLabel}>{siteName.toUpperCase()}</Text>
          <Text style={styles.headerTitle}>Discover Sarees</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push("/products")} style={styles.iconBtn}>
            <Ionicons name="search-outline" size={22} color={Colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/cart")} style={styles.iconBtn}>
            <Ionicons name="bag-outline" size={22} color={Colors.ink} />
            {itemCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Banner */}
      <View style={styles.bannerContainer}>
        <FlatList<string>
          ref={bannerRef}
          data={bannerImages}
          keyExtractor={(_: string, i: number) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          renderItem={({ item }: { item: string }) => (
            <View style={[styles.bannerSlide, { width }]}>
              <Image source={{ uri: item }} style={styles.bannerImage} contentFit="cover" />
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerContent}>
                <View style={styles.bannerTag}>
                  <Ionicons name="sparkles" size={10} color={Colors.amberLight} />
                  <Text style={styles.bannerTagText}>PREMIUM COLLECTION</Text>
                </View>
                <Text style={styles.bannerTitle}>{heroTitle}</Text>
                <Text style={styles.bannerSubtitle}>{heroSubtitle}</Text>

                {/* Stats */}
                <View style={styles.statsRow}>
                  {STATS.map((s) => (
                    <View key={s.label}>
                      <Text style={styles.statValue}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                <View style={styles.ctaRow}>
                  <TouchableOpacity
                    onPress={handleCtaPress}
                    style={styles.ctaPrimary}
                  >
                    <Text style={styles.ctaPrimaryText}>{heroCtaText}</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.ink} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push("/products?featured=true")}
                    style={styles.ctaOutline}
                  >
                    <Text style={styles.ctaOutlineText}>Featured</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
        {/* Dots */}
        <View style={styles.dots}>
          {bannerImages.map((_: string, i: number) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setActiveBanner(i);
                bannerRef.current?.scrollToIndex({ index: i, animated: true });
              }}
              style={[styles.dot, i === activeBanner && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>SHOP BY</Text>
              <Text style={styles.sectionTitle}>Saree Categories</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/products")} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.amber} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.slice(0, 8).map((cat) => (
              <TouchableOpacity
                key={cat._id}
                onPress={() => router.push(`/products?category=${cat._id}`)}
                style={styles.catCard}
              >
                {cat.image ? (
                  <Image source={{ uri: cat.image }} style={styles.catImage} contentFit="cover" />
                ) : (
                  <View style={styles.catImagePlaceholder}>
                    <Text style={{ fontSize: 20 }}>🛍</Text>
                  </View>
                )}
                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured Products */}
      <View style={[styles.section, { backgroundColor: Colors.parchment, paddingVertical: Spacing.xxl }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>HAND-PICKED</Text>
            <Text style={styles.sectionTitle}>Featured Sarees</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/products?featured=true")}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.amber} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.productGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={[styles.skeletonCard, { width: cardWidth }]} />
            ))}
          </View>
        ) : featuredProducts.length > 0 ? (
          <View style={styles.productGrid}>
            {featuredProducts.slice(0, 6).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No featured sarees yet</Text>
          </View>
        )}
      </View>

      {/* Trust Badges */}
      <View style={styles.section}>
        <View style={styles.trustGrid}>
          {TRUST.map((t) => (
            <View key={t.title} style={[styles.trustItem, { width: trustWidth }]}>
              <View style={styles.trustIcon}>
                <Ionicons name={t.icon as any} size={20} color={Colors.amber} />
              </View>
              <Text style={styles.trustTitle}>{t.title}</Text>
              <Text style={styles.trustDesc}>{t.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Banner */}
      <View style={styles.ctaBanner}>
        <Text style={styles.ctaBannerEyebrow}>LIMITED TIME</Text>
        <Text style={styles.ctaBannerTitle}>JoinNext Shop</Text>
        <Text style={styles.ctaBannerSub}>
          Get early access to new saree drops, festive collections, and exclusive offers.
        </Text>
        <TouchableOpacity
          onPress={() => router.push(isAuthenticated ? "/products" : "/(auth)/register")}
          style={styles.ctaBannerBtn}
        >
          <Text style={styles.ctaBannerBtnText}>
            {isAuthenticated ? "Shop Now" : "Create Free Account"}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 32,
    paddingBottom: 4,
    backgroundColor: Colors.cream,
  },
  brandLabel: { fontSize: 9, fontFamily: Typography.bodySemibold, color: Colors.amber, letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontFamily: Typography.display, color: Colors.ink },
  headerActions: { flexDirection: "row", gap: Spacing.sm },
  iconBtn: { position: "relative", padding: 6 },
  badge: {
    position: "absolute",
    top: 0, right: 0,
    width: 16, height: 16,
    borderRadius: 8,
    backgroundColor: Colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 9, fontFamily: Typography.bodyBold, color: Colors.ink },

  // Banner
  bannerContainer: { position: "relative" },
  bannerSlide: { height: 520, position: "relative" },
  bannerImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26,26,26,0.55)",
  },
  bannerContent: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  bannerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  bannerTagText: { fontSize: 9, fontFamily: Typography.bodySemibold, color: Colors.amberLight, letterSpacing: 1.5 },
  bannerTitle: { fontSize: 38, fontFamily: Typography.display, color: Colors.cream, lineHeight: 44, marginBottom: 8 },
  bannerSubtitle: { fontSize: 14, color: "rgba(250,247,242,0.75)", fontFamily: Typography.body, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: Spacing.xl, marginBottom: Spacing.xl },
  statValue: { fontSize: 22, fontFamily: Typography.display, color: Colors.cream },
  statLabel: { fontSize: 10, color: "rgba(250,247,242,0.65)", letterSpacing: 1, textTransform: "uppercase" },
  ctaRow: { flexDirection: "row", gap: Spacing.sm },
  ctaPrimary: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.amber,
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: BorderRadius.sm,
  },
  ctaPrimaryText: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.ink },
  ctaOutline: {
    borderWidth: 1.5, borderColor: "rgba(250,247,242,0.7)",
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
  },
  ctaOutlineText: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.cream },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 10, backgroundColor: Colors.ink },
  dot: { width: 16, height: 4, borderRadius: 2, backgroundColor: "rgba(250,247,242,0.3)" },
  dotActive: { width: 32, backgroundColor: Colors.amber },

  // Section
  section: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: Spacing.lg },
  sectionEyebrow: { fontSize: 9, fontFamily: Typography.bodySemibold, color: Colors.textLight, letterSpacing: 2, marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontFamily: Typography.display, color: Colors.ink },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAllText: { fontSize: 13, color: Colors.amber, fontFamily: Typography.bodyMedium },

  // Categories
  catScroll: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  catCard: { marginRight: Spacing.sm, alignItems: "center", width: 80 },
  catImage: { width: 70, height: 70, borderRadius: BorderRadius.md, marginBottom: 6 },
  catImagePlaceholder: {
    width: 70, height: 70,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.parchment,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  catName: { fontSize: 11, fontFamily: Typography.bodyMedium, color: Colors.ink, textAlign: "center" },

  // Products grid
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skeletonCard: {
    aspectRatio: 4 / 5,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  emptyState: { alignItems: "center", paddingVertical: Spacing.xxxl },
  emptyText: { color: Colors.textMuted, fontFamily: Typography.body },

  // Trust
  trustGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.lg },
  trustItem: { alignItems: "center" },
  trustIcon: {
    width: 44, height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(201,168,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  trustTitle: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.ink, textAlign: "center", marginBottom: 2 },
  trustDesc: { fontSize: 11, color: Colors.textMuted, textAlign: "center", fontFamily: Typography.body },

  // CTA Banner
  ctaBanner: {
    backgroundColor: Colors.ink,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
  },
  ctaBannerEyebrow: { fontSize: 9, fontFamily: Typography.bodySemibold, color: Colors.amber, letterSpacing: 2, marginBottom: 8 },
  ctaBannerTitle: { fontSize: 28, fontFamily: Typography.display, color: Colors.cream, marginBottom: 10, textAlign: "center" },
  ctaBannerSub: { fontSize: 13, color: "rgba(250,247,242,0.6)", textAlign: "center", maxWidth: 260, marginBottom: Spacing.xl, fontFamily: Typography.body },
  ctaBannerBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.amber,
    paddingHorizontal: Spacing.xxl, paddingVertical: 14,
    borderRadius: BorderRadius.sm,
  },
  ctaBannerBtnText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
});
