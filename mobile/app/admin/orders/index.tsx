import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types";
import { extractList } from "@/lib/listResponse";
import { normalizeOrder, formatBdt, getOrderStatus } from "@/lib/orderUtils";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.info,
  processing: Colors.info,
  shipped: Colors.amber,
  delivered: Colors.success,
  cancelled: Colors.error,
};

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { toast, hide, success, error: showError } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  function fetchOrders() {
    setIsLoading(true);
    ordersApi.all()
      .then(({ data }) => {
        setOrders(extractList<Order>(data, "orders").map(normalizeOrder));
      })
      .catch(() => showError("Failed to load orders"))
      .finally(() => setIsLoading(false));
  }

  async function handleUpdateStatus(id: string, currentStatus: string) {
    Alert.alert(
      "Update Status",
      `Choose new status for this order:`,
      STATUS_OPTIONS.map((opt) => ({
        text: opt.charAt(0).toUpperCase() + opt.slice(1),
        style: opt === "cancelled" ? "destructive" : "default",
        onPress: async () => {
          if (opt === currentStatus) return;
          setUpdatingId(id);
          try {
            await ordersApi.updateStatus(id, opt);
            setOrders((prev) =>
              prev.map((o) =>
                o._id === id
                  ? { ...o, status: opt as Order["status"], orderStatus: opt }
                  : o
              )
            );
            success(`Status updated to ${opt}`);
          } catch {
            showError("Failed to update status");
          } finally {
            setUpdatingId(null);
          }
        },
      }))
    );
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Orders</Text>
        <TouchableOpacity onPress={fetchOrders} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      {isLoading && orders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.amber} size="large" />
        </View>
      ) : (
        <FlatList<Order>
          data={orders}
          keyExtractor={(o: Order) => o._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Order }) => {
            const status = getOrderStatus(item);
            const statusColor = STATUS_COLOR[status] || Colors.textMuted;
            const isUpdating = updatingId === item._id;

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/orders/[id]" as any, params: { id: item._id } })}
                  style={styles.cardContent}
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
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + "15", borderColor: statusColor + "30" }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.customerName}>{item.shippingAddress?.fullName || "Guest Customer"}</Text>
                      <Text style={styles.customerPhone}>{item.shippingAddress?.phone || "No phone"}</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.totalLabel}>{item.items.length} item{item.items.length !== 1 ? "s" : ""}</Text>
                      <Text style={styles.totalAmount}>{formatBdt(item.totalPrice)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(item._id, status)}
                    disabled={isUpdating}
                    style={styles.statusActionBtn}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color={Colors.amber} size="small" />
                    ) : (
                      <>
                        <Ionicons name="create-outline" size={16} color={Colors.amberDark} />
                        <Text style={styles.statusActionText}>Change Status</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/orders/[id]" as any, params: { id: item._id } })}
                    style={styles.viewDetailsBtn}
                  >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 54, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.cream,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  refreshBtn: { padding: 4 },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: "hidden",
  },
  cardContent: { padding: Spacing.lg },
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
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customerName: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  customerPhone: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  priceCol: { alignItems: "flex-end" },
  totalLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body },
  totalAmount: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink, marginTop: 2 },
  actionRow: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.parchment + "30",
  },
  statusActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRightWidth: 1, borderRightColor: Colors.border,
  },
  statusActionText: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.amberDark },
  viewDetailsBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12,
  },
  viewDetailsText: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.text },
});
