import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { productsApi } from "@/lib/api";
import { Product } from "@/types";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import ProductCard from "@/components/product/ProductCard";
import { useToast, Toast } from "@/components/ui/Toast";

export default function WishlistScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { toast, hide, success, error: showError } = useToast();
  
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistProducts([]);
      setIsLoading(false);
      return;
    }
    loadWishlist();
  }, [isAuthenticated, user?.wishlist]);

  async function loadWishlist() {
    if (!user?.wishlist || user.wishlist.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Fetch products by IDs
      const productPromises = user.wishlist.map((id) =>
        productsApi.get(id).catch(() => null)
      );
      const results = await Promise.all(productPromises);
      const products = results
        .filter((res): res is NonNullable<typeof res> => res !== null)
        .map((res) => (res.data as { product?: Product })?.product || (res.data as Product))
        .filter((p): p is Product => p !== null && p !== undefined && Boolean((p as Product)._id));
      setWishlistProducts(products);
    } catch (err) {
      showError("Failed to load wishlist");
    } finally {
      setIsLoading(false);
    }
  }

  function goToProducts() {
    router.push("/products");
  }

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>Sign in to view your wishlist</Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.amber} />
            <Text style={styles.loadingText}>Loading wishlist...</Text>
          </View>
        ) : wishlistProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.iconBox}>
              <Ionicons name="heart-outline" size={48} color={Colors.amber} />
            </View>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>
              Browse our collection and add items you love to your wishlist
            </Text>
            <TouchableOpacity onPress={goToProducts} style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {wishlistProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 32,
    paddingBottom: 4,
    backgroundColor: Colors.cream,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.parchment,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Typography.display,
    color: Colors.ink,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Typography.body,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    marginTop: 60,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(201,168,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Typography.display,
    color: Colors.ink,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Typography.body,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  ctaBtn: {
    backgroundColor: Colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.sm,
    minWidth: 200,
    alignItems: "center",
  },
  ctaBtnText: {
    fontSize: 14,
    fontFamily: Typography.bodySemibold,
    color: Colors.cream,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
});
