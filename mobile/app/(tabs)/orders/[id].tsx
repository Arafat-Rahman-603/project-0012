import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types";
import {
  normalizeOrder, formatBdt, getOrderStatus,
  getOrderItemImage, getOrderItemName,
} from "@/lib/orderUtils";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.info,
  processing: Colors.info,
  shipped: Colors.amber,
  delivered: Colors.success,
  cancelled: Colors.error,
  refunded: Colors.textMuted,
};

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast, hide, success, error: showError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    ordersApi.get(id)
      .then(({ data }) => setOrder(normalizeOrder(data.order || data.data || data)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleCancel() {
    if (!order) return;
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Cancel Order", style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            const { data } = await ordersApi.cancel(order._id);
            setOrder(normalizeOrder(data.order || data.data || data));
            success("Order cancelled");
          } catch {
            showError("Failed to cancel order");
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={Colors.amber} size="large" /></View>;
  if (!order) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Order not found</Text>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Go Back</Text></TouchableOpacity>
    </View>
  );

  const status = getOrderStatus(order);
  const statusColor = STATUS_COLOR[status] || Colors.textMuted;
  const statusIdx = STATUS_STEPS.indexOf(status);
  const canCancel = ["pending", "confirmed"].includes(status);

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order ID & Status */}
        <View style={styles.section}>
          <View style={styles.orderTopRow}>
            <View>
              <Text style={styles.orderIdLabel}>ORDER ID</Text>
              <Text style={styles.orderId}>#{order._id.slice(-12).toUpperCase()}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor + "40" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Progress bar (only for non-cancelled) */}
          {!["cancelled", "refunded"].includes(status) && (
            <View style={styles.progressBar}>
              {STATUS_STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <View style={[styles.progressStep, i <= statusIdx && { backgroundColor: Colors.amber }]}>
                    {i <= statusIdx
                      ? <Ionicons name="checkmark" size={10} color={Colors.ink} />
                      : <Text style={styles.progressStepNum}>{i + 1}</Text>
                    }
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.progressLine, i < statusIdx && { backgroundColor: Colors.amber }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items.map((item, i) => {
            const imgUrl = getOrderItemImage(item);
            const name = getOrderItemName(item);
            return (
              <View key={i} style={styles.orderItem}>
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.itemImage} contentFit="cover" />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="image-outline" size={24} color={Colors.border} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{name}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>৳{(item.price * item.quantity).toLocaleString()}</Text>
              </View>
            );
          })}
        </View>

        {/* Shipping */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{order.shippingAddress?.fullName}</Text>
            <Text style={styles.addressLine}>{order.shippingAddress?.phone}</Text>
            <Text style={styles.addressLine}>{order.shippingAddress?.addressLine1}</Text>
            {order.shippingAddress?.addressLine2 && (
              <Text style={styles.addressLine}>{order.shippingAddress.addressLine2}</Text>
            )}
            <Text style={styles.addressLine}>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
            </Text>
            <Text style={styles.addressLine}>{order.shippingAddress?.country}</Text>
          </View>
        </View>

        {/* Payment & Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Payment Method" value={order.paymentMethod} />
            <SummaryRow label="Subtotal" value={`৳${order.totalPrice.toLocaleString()}`} />
            <SummaryRow label="Shipping" value={order.totalPrice >= 2000 ? "Free" : "৳60"} />
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatBdt(order.totalPrice + (order.totalPrice >= 2000 ? 0 : 60))}</Text>
            </View>
          </View>
        </View>

        {/* Cancel button */}
        {canCancel && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelling}
              style={styles.cancelBtn}
            >
              {cancelling ? (
                <ActivityIndicator color={Colors.error} size="small" />
              ) : (
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream },
  errorText: { fontSize: 16, color: Colors.textMuted, fontFamily: Typography.body },
  link: { color: Colors.amber, fontFamily: Typography.bodyMedium, marginTop: 8 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 32, paddingBottom: 4, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  section: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTitle: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink, marginBottom: Spacing.sm },
  orderTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: Spacing.md },
  orderIdLabel: { fontSize: 9, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 2 },
  orderId: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  orderDate: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: Typography.bodyMedium },
  progressBar: { flexDirection: "row", alignItems: "center", marginTop: Spacing.sm },
  progressStep: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.border, alignItems: "center", justifyContent: "center",
  },
  progressStepNum: { fontSize: 10, color: Colors.textMuted, fontFamily: Typography.bodySemibold },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.border },
  orderItem: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, marginBottom: Spacing.sm },
  itemImage: { width: 60, height: 72, borderRadius: BorderRadius.sm, backgroundColor: Colors.parchment },
  itemImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink, lineHeight: 18 },
  itemQty: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 2 },
  itemPrice: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.ink },
  addressCard: { backgroundColor: Colors.parchment, borderRadius: BorderRadius.md, padding: Spacing.md, gap: 3 },
  addressName: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  addressLine: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body },
  summaryCard: { backgroundColor: Colors.parchment, borderRadius: BorderRadius.md, padding: Spacing.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body },
  summaryValue: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 8 },
  totalLabel: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.ink },
  totalValue: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  cancelBtn: {
    borderWidth: 1.5, borderColor: Colors.error, paddingVertical: 14,
    borderRadius: BorderRadius.sm, alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.error },
});
