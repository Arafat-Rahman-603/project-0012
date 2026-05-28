import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types";
import { extractList } from "@/lib/listResponse";
import { normalizeOrder, formatBdt, getOrderStatus } from "@/lib/orderUtils";
import { useAuthStore } from "@/store/authStore";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.info,
  processing: Colors.info,
  shipped: Colors.amber,
  delivered: Colors.success,
  cancelled: Colors.error,
  refunded: Colors.textMuted,
};

export default function OrdersScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    ordersApi.myOrders()
      .then(({ data }) => setOrders(extractList<Order>(data, "orders").map(normalizeOrder)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={64} color={Colors.border} />
        <Text style={styles.emptyTitle}>Sign in to view orders</Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.amber} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Your order history will appear here</Text>
          <TouchableOpacity onPress={() => router.push("/products")} style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList<Order>
          data={orders}
          keyExtractor={(o: Order) => o._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Order }) => {
            const status = getOrderStatus(item);
            const statusColor = STATUS_COLOR[status] || Colors.textMuted;
            return (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/orders/[id]" as any, params: { id: item._id } })}
                style={styles.orderCard}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor + "40" }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.itemsLabel}>{item.items.length} item{item.items.length !== 1 ? "s" : ""}</Text>
                    <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalAmount}>{formatBdt(item.totalPrice)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream, padding: Spacing.xxl },
  header: {
    paddingTop: 32, paddingBottom: 4, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontFamily: Typography.display, color: Colors.ink },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  orderId: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  orderDate: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: Typography.bodyMedium },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemsLabel: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.text },
  paymentMethod: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2, textTransform: "capitalize" },
  totalRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  totalAmount: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  emptyTitle: { fontSize: 18, fontFamily: Typography.bodySemibold, color: Colors.ink, marginTop: Spacing.lg },
  emptySub: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 4, marginBottom: Spacing.xl },
  ctaBtn: { backgroundColor: Colors.ink, paddingHorizontal: Spacing.xxl, paddingVertical: 14, borderRadius: BorderRadius.sm },
  ctaBtnText: { color: Colors.cream, fontSize: 14, fontFamily: Typography.bodySemibold },
});
