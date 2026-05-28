import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/types";
import { Colors, Typography, BorderRadius, Spacing } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { usersApi } from "@/lib/api";
import { normalizeUser } from "@/lib/auth";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { user, isAuthenticated, updateWishlist } = useAuthStore();
  const isWishlisted = isAuthenticated && user?.wishlist?.includes(product._id);

  // Dynamic responsive columns logic
  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };
  const cols = getColumns();
  const cardWidth = (width - Spacing.lg * 2 - Spacing.sm * (cols - 1)) / cols;

  const price = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const imageUrl = product.images?.[0]?.url;
  const rating = product.ratings?.average ?? product.rating ?? 0;
  const reviewCount = product.ratings?.count ?? product.numReviews ?? 0;

  async function toggleWishlist() {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    try {
      const { data } = await usersApi.toggleWishlist(product._id);
      if (Array.isArray(data?.wishlist)) {
        updateWishlist(data.wishlist);
        return;
      }

      if (data?.user) {
        updateWishlist(normalizeUser(data.user).wishlist);
        return;
      }

      if (Array.isArray(data?.data?.wishlist)) {
        updateWishlist(data.data.wishlist);
      }
    } catch {}
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/products/${product._id}`)}
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.92}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={28} color={Colors.textLight} />
          </View>
        )}

        {product.featured && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Featured</Text>
          </View>
        )}
        {hasDiscount && (
          <View style={[styles.badge, styles.discountBadge]}>
            <Text style={styles.badgeText}>
              -{Math.round(((product.price - price) / product.price) * 100)}%
            </Text>
          </View>
        )}

        {/* Wishlist */}
        <TouchableOpacity onPress={toggleWishlist} style={styles.wishlistBtn}>
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={18}
            color={isWishlisted ? Colors.error : Colors.ink}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.metaTopRow}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {typeof product.category === "object" ? product.category?.name : "Curated Collection"}
          </Text>
          {product.stock > 0 ? (
            <View style={styles.stockPill}>
              <Text style={styles.stockPillText}>{product.stock < 10 ? `${product.stock} left` : "In stock"}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

        <View style={styles.ratingRow}>
          {rating > 0 ? (
            <>
              <Ionicons name="star" size={10} color={Colors.amber} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              {reviewCount > 0 && (
                <Text style={styles.reviewCount}>({reviewCount})</Text>
              )}
            </>
          ) : (
            <Text style={[styles.ratingText, { opacity: 0 }]}>Placeholder</Text>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>৳{price.toLocaleString()}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>৳{product.price.toLocaleString()}</Text>
          )}
        </View>

        {product.stock === 0 && (
          <Text style={styles.outOfStock}>Out of Stock</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    aspectRatio: 4 / 5,
    backgroundColor: Colors.parchment,
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.parchment,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  discountBadge: { top: 30, backgroundColor: Colors.amber },
  badgeText: {
    color: Colors.cream,
    fontSize: 9,
    fontFamily: Typography.bodySemibold,
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(250,247,242,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  info: { padding: Spacing.sm },
  metaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: 6,
  },
  categoryText: {
    flex: 1,
    fontSize: 10,
    color: Colors.amberDark,
    fontFamily: Typography.bodySemibold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  stockPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.parchment,
  },
  stockPillText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: Typography.bodyMedium,
  },
  name: {
    fontSize: 13,
    fontFamily: Typography.bodyMedium,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: Typography.bodyMedium,
  },
  reviewCount: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Typography.body,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  price: {
    fontSize: 14,
    fontFamily: Typography.bodySemibold,
    color: Colors.text,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Typography.body,
    textDecorationLine: "line-through",
  },
  outOfStock: {
    fontSize: 10,
    color: Colors.error,
    fontFamily: Typography.body,
    marginTop: 2,
  },
});
