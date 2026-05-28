import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator, Alert, useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsApi } from "@/lib/api";
import { Product, Review } from "@/types";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useToast, Toast } from "@/components/ui/Toast";
import { extractList } from "@/lib/listResponse";

export default function ProductDetailScreen() {
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, isLoading: cartLoading } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { toast, hide, success, error: showError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    productsApi.get(id)
      .then(({ data }) => {
        const p = data.product || data.data || data;
        setProduct(p);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleAddToCart() {
    if (!isAuthenticated) { router.push("/(auth)/login"); return; }
    if (!product) return;
    try {
      await addItem(product._id, quantity);
      success("Added to cart!");
    } catch (e: any) {
      showError(e.message || "Failed to add to cart");
    }
  }

  async function handleSubmitReview() {
    if (!isAuthenticated) { router.push("/(auth)/login"); return; }
    if (!user?.isEmailVerified) {
      showError("Please verify your email before submitting a review.");
      return;
    }
    if (!reviewText.trim() || !product) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("rating", String(reviewRating));
      fd.append("comment", reviewText.trim());
      await productsApi.addReview(product._id, fd);
      success("Review submitted!");
      setReviewText("");
      setReviewRating(5);
      // Refresh
      const { data } = await productsApi.get(product._id);
      setProduct(data.product || data.data || data);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const price = product?.discountPrice ?? product?.price ?? 0;
  const hasDiscount = product?.discountPrice && product.discountPrice < product.price;
  const rating = product?.ratings?.average ?? product?.rating ?? 0;
  const reviewCount = product?.ratings?.count ?? product?.numReviews ?? 0;
  const reviews = product?.reviews ?? [];
  const canReview = Boolean(isAuthenticated && user?.isEmailVerified);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.amber} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      {/* Back button overlay */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color={Colors.ink} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatRef}
            data={product.images}
            keyExtractor={(_: any, i: number) => String(i)}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e: any) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(idx);
            }}
            renderItem={({ item }: { item: { url: string } }) => (
              <Image source={{ uri: item.url }} style={{ width, height: width * 1.1 }} contentFit="cover" />
            )}
          />
          {/* Dots */}
          {product.images.length > 1 && (
            <View style={styles.imageDots}>
              {product.images.map((_, i) => (
                <View key={i} style={[styles.imageDot, i === activeImage && styles.imageDotActive]} />
              ))}
            </View>
          )}
          {/* Badges */}
          {product.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="sparkles" size={10} color={Colors.amberLight} />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          {product.stock === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Product info */}
        <View style={styles.info}>
          {/* Name & rating */}
          <Text style={styles.productName}>{product.name}</Text>
          {rating > 0 && (
            <View style={styles.ratingRow}>
              {[1,2,3,4,5].map((s) => (
                <Ionicons key={s} name={s <= Math.round(rating) ? "star" : "star-outline"} size={14} color={Colors.amber} />
              ))}
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>৳{price.toLocaleString()}</Text>
            {hasDiscount && <Text style={styles.originalPrice}>৳{product.price.toLocaleString()}</Text>}
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  -{Math.round(((product.price - price) / product.price) * 100)}% OFF
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Quantity */}
          <View style={styles.quantityRow}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
              >
                <Ionicons name="remove" size={18} color={Colors.ink} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={18} color={Colors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stock indicator */}
          <Text style={[styles.stockText, product.stock === 0 && { color: Colors.error }]}>
            {product.stock === 0 ? "Out of Stock" : product.stock < 10 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
          </Text>

          {/* Add to cart */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={cartLoading || product.stock === 0}
            style={[styles.addToCartBtn, (cartLoading || product.stock === 0) && { opacity: 0.6 }]}
          >
            {cartLoading ? (
              <ActivityIndicator color={Colors.cream} size="small" />
            ) : (
              <>
                <Ionicons name="bag-add-outline" size={18} color={Colors.cream} />
                <Text style={styles.addToCartText}>
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Meta */}
          {(product.brand || product.sku || product.tags?.length) ? (
            <>
              <View style={styles.divider} />
              <View style={styles.metaGrid}>
                {product.brand && <MetaRow label="Brand" value={product.brand} />}
                {product.sku && <MetaRow label="SKU" value={product.sku} />}
                {product.tags?.length ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Tags</Text>
                    <View style={styles.tagRow}>
                      {product.tags.map((t) => (
                        <View key={t} style={styles.tag}>
                          <Text style={styles.tagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(["description", "reviews"] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "reviews" ? ` (${reviewCount})` : ""}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === "description" ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : (
            <View>
              {/* Write review */}
              {isAuthenticated && !user?.isEmailVerified && (
                <View style={styles.reviewNotice}>
                  <Ionicons name="mail-unread-outline" size={18} color={Colors.warning} />
                  <View style={styles.reviewNoticeBody}>
                    <Text style={styles.reviewNoticeTitle}>Verify your email to review</Text>
                    <Text style={styles.reviewNoticeText}>
                      Reviews are only available after email verification.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(auth)/verify-email",
                        params: user?.email ? { email: user.email } : {},
                      })
                    }
                    style={styles.reviewNoticeBtn}
                  >
                    <Text style={styles.reviewNoticeBtnText}>Verify</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isAuthenticated && (
                <View style={styles.reviewForm}>
                  <Text style={styles.reviewFormTitle}>Write a Review</Text>
                  {/* Stars */}
                  <View style={styles.starRow}>
                    {[1,2,3,4,5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                        <Ionicons
                          name={s <= reviewRating ? "star" : "star-outline"}
                          size={26} color={Colors.amber}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Share your thoughts..."
                    placeholderTextColor={Colors.textLight}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    onPress={handleSubmitReview}
                    disabled={!canReview || submitting || !reviewText.trim()}
                    style={[styles.submitReviewBtn, (!canReview || !reviewText.trim() || submitting) && { opacity: 0.5 }]}
                  >
                    {submitting ? (
                      <ActivityIndicator color={Colors.cream} size="small" />
                    ) : (
                      <Text style={styles.submitReviewText}>Submit Review</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
              ) : (
                reviews.map((r) => <ReviewItem key={r._id} review={r} />)
              )}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const reviewerName =
    typeof (review as any)?.user === "object" && (review as any)?.user?.name
      ? String((review as any).user.name)
      : "Anonymous";
  const reviewerInitial = reviewerName.trim().charAt(0).toUpperCase() || "A";
  const createdAtLabel = (() => {
    const raw = (review as any)?.createdAt;
    const d = raw ? new Date(raw) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : "";
  })();

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{reviewerInitial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewerName}>{reviewerName}</Text>
          <View style={styles.reviewStars}>
            {[1,2,3,4,5].map((s) => (
              <Ionicons key={s} name={s <= review.rating ? "star" : "star-outline"} size={11} color={Colors.amber} />
            ))}
          </View>
        </View>
        {createdAtLabel ? <Text style={styles.reviewDate}>{createdAtLabel}</Text> : null}
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      {review.image && (
        <Image source={{ uri: review.image.url }} style={styles.reviewImage} contentFit="cover" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream },
  errorText: { fontSize: 16, fontFamily: Typography.body, color: Colors.textMuted },
  backLink: { marginTop: Spacing.lg },
  backLinkText: { color: Colors.amber, fontFamily: Typography.bodyMedium },
  backBtn: {
    position: "absolute", top: 52, left: Spacing.lg, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(250,247,242,0.92)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
  imageContainer: { position: "relative" },
  imageDots: { position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  imageDotActive: { width: 18, backgroundColor: Colors.amber },
  featuredBadge: {
    position: "absolute", top: 54, right: Spacing.lg,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  featuredBadgeText: { fontSize: 10, color: Colors.amberLight, fontFamily: Typography.bodySemibold },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26,26,26,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  outOfStockText: { color: Colors.cream, fontSize: 18, fontFamily: Typography.bodySemibold },
  info: { padding: Spacing.lg },
  productName: { fontSize: 22, fontFamily: Typography.display, color: Colors.ink, marginBottom: 8, lineHeight: 28 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: Spacing.sm },
  ratingText: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.text },
  reviewCount: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body },
  priceRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  price: { fontSize: 24, fontFamily: Typography.bodySemibold, color: Colors.ink },
  originalPrice: { fontSize: 16, color: Colors.textMuted, textDecorationLine: "line-through", fontFamily: Typography.body },
  discountBadge: { backgroundColor: Colors.amber, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 11, fontFamily: Typography.bodySemibold, color: Colors.ink },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  label: { fontSize: 12, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 0.5 },
  quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm },
  qtyBtn: { padding: 10 },
  qtyValue: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink, paddingHorizontal: 16 },
  stockText: { fontSize: 12, color: Colors.success, fontFamily: Typography.bodyMedium, marginBottom: Spacing.lg },
  addToCartBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: Colors.ink, paddingVertical: 16,
    borderRadius: BorderRadius.sm, marginBottom: Spacing.md,
  },
  addToCartText: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.cream },
  metaGrid: { gap: Spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  metaLabel: { width: 60, fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body },
  metaValue: { flex: 1, fontSize: 13, color: Colors.text, fontFamily: Typography.bodyMedium },
  tagRow: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: Colors.parchment, borderRadius: 4, borderWidth: 1, borderColor: Colors.border },
  tagText: { fontSize: 11, color: Colors.text, fontFamily: Typography.body },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
  tabText: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.textMuted },
  tabTextActive: { color: Colors.ink, fontFamily: Typography.bodySemibold },
  tabIndicator: { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2, backgroundColor: Colors.ink, borderRadius: 1 },
  tabContent: { padding: Spacing.lg },
  description: { fontSize: 14, lineHeight: 22, color: Colors.text, fontFamily: Typography.body },
  reviewForm: {
    backgroundColor: Colors.parchment, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  reviewNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewNoticeBody: { flex: 1 },
  reviewNoticeTitle: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.ink, marginBottom: 2 },
  reviewNoticeText: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body, lineHeight: 18 },
  reviewNoticeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.ink,
    borderRadius: BorderRadius.sm,
  },
  reviewNoticeBtnText: { fontSize: 12, fontFamily: Typography.bodySemibold, color: Colors.cream },
  reviewFormTitle: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.ink, marginBottom: 10 },
  starRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.sm },
  reviewInput: {
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, padding: Spacing.sm,
    fontSize: 14, fontFamily: Typography.body, color: Colors.text,
    minHeight: 70, textAlignVertical: "top", marginBottom: Spacing.sm,
  },
  submitReviewBtn: {
    backgroundColor: Colors.ink, paddingVertical: 12,
    borderRadius: BorderRadius.sm, alignItems: "center",
  },
  submitReviewText: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.cream },
  noReviews: { textAlign: "center", color: Colors.textMuted, fontFamily: Typography.body, paddingVertical: Spacing.xxl },
  reviewItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: 8 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.ink,
    alignItems: "center", justifyContent: "center",
  },
  reviewAvatarText: { color: Colors.cream, fontSize: 14, fontFamily: Typography.bodySemibold },
  reviewerName: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.text },
  reviewStars: { flexDirection: "row", gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body },
  reviewComment: { fontSize: 13, lineHeight: 20, color: Colors.text, fontFamily: Typography.body },
  reviewImage: { width: "100%", height: 160, borderRadius: BorderRadius.sm, marginTop: 8 },
});
