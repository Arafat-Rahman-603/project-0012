import React, { useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

export default function CartScreen() {
  const router = useRouter();
  const { cart, isLoading, fetchCart, updateItem, removeItem, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toast, hide, success, error } = useToast();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bag-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>Sign in to see your cart</Text>
        <Text style={styles.emptySubtitle}>Your cart items will appear here</Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = cart?.items ?? [];
  const total = cart?.totalPrice ?? 0;

  if (isLoading && !cart) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator color={Colors.amber} size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Toast {...toast} onHide={hide} />
        <Ionicons name="bag-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Explore our collection of sarees</Text>
        <TouchableOpacity onPress={() => router.push("/products")} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleClear() {
    Alert.alert("Clear Cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive",
        onPress: async () => {
          await clearCart();
          success("Cart cleared");
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const imgUrl = item.product?.images?.[0]?.url;
          const price = item.product?.discountPrice ?? item.product?.price ?? 0;
          return (
            <View key={item._id} style={styles.item}>
              <TouchableOpacity onPress={() => router.push(`/products/${item.product._id}`)}>
                <Image source={{ uri: imgUrl }} style={styles.itemImage} resizeMode="cover" />
              </TouchableOpacity>
              <View style={styles.itemInfo}>
                <TouchableOpacity onPress={() => router.push(`/products/${item.product._id}`)}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product?.name}</Text>
                </TouchableOpacity>
                <Text style={styles.itemPrice}>৳{(price * item.quantity).toLocaleString()}</Text>
                <Text style={styles.itemUnit}>৳{price.toLocaleString()} each</Text>

                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    onPress={async () => {
                      if (item.quantity <= 1) {
                        await removeItem(item._id);
                      } else {
                        await updateItem(item._id, item.quantity - 1);
                      }
                    }}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name={item.quantity <= 1 ? "trash-outline" : "remove"} size={16} color={Colors.ink} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateItem(item._id, item.quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="add" size={16} color={Colors.ink} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={() => removeItem(item._id)} style={styles.removeBtn}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Order summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
          <Text style={styles.summaryValue}>৳{total.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {total >= 2000 ? "Free" : "৳60"}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>৳{(total + (total >= 2000 ? 0 : 60)).toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/checkout" as any)}
          style={styles.checkoutBtn}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.ink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream, padding: Spacing.xxl },
  emptyTitle: { fontSize: 20, fontFamily: Typography.bodySemibold, color: Colors.ink, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 6, marginBottom: Spacing.xl },
  ctaBtn: { backgroundColor: Colors.ink, paddingHorizontal: Spacing.xxl, paddingVertical: 14, borderRadius: BorderRadius.sm },
  ctaBtnText: { color: Colors.cream, fontSize: 14, fontFamily: Typography.bodySemibold },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 32, paddingBottom: 4, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cream, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  clearText: { fontSize: 13, color: Colors.error, fontFamily: Typography.bodyMedium },
  list: { flex: 1 },
  item: {
    flexDirection: "row", gap: Spacing.sm,
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  itemImage: { width: 80, height: 96, borderRadius: BorderRadius.sm, backgroundColor: Colors.parchment },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink, lineHeight: 18, marginBottom: 4 },
  itemPrice: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  itemUnit: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, alignSelf: "flex-start" },
  qtyBtn: { padding: 8 },
  qtyValue: { paddingHorizontal: 12, fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  removeBtn: { padding: 4 },
  summary: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.cream,
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.lg,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body },
  summaryValue: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  totalValue: { fontSize: 18, fontFamily: Typography.bodySemibold, color: Colors.ink },
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.amber, paddingVertical: 15, borderRadius: BorderRadius.sm, marginTop: 12,
  },
  checkoutText: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.ink },
});
