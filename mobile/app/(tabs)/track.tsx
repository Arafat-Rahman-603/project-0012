import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ordersApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

export default function TrackOrderScreen() {
  const router = useRouter();
  const { toast, hide, error: showError } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async () => {
    if (!orderNumber.trim()) {
      return showError("Please enter your Order Number (e.g. ORD-123456)");
    }
    if (!phone.trim()) {
      return showError("Please enter the contact phone number used for the order");
    }

    setLoading(true);
    setOrder(null);
    try {
      const { data } = await ordersApi.trackPublic(orderNumber.trim(), phone.trim());
      const resData = data?.order || data?.data || data;
      if (!resData) {
        showError("No order found with the provided details.");
      } else {
        setOrder(resData);
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || "Order not found. Please verify details.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "#059669";
      case "shipped": return "#2563EB";
      case "processing": return "#D97706";
      case "cancelled": return "#DC2626";
      default: return "#4B5563";
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Toast {...toast} onHide={hide} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Lookup Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Parcel Tracker</Text>
          <Text style={styles.cardSub}>
            Enter your Order Number and Phone number to view live courier and fulfillment status.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ORDER NUMBER</Text>
            <TextInput
              value={orderNumber}
              onChangeText={setOrderNumber}
              placeholder="e.g. ORD-171800-4821"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>RECIPIENT PHONE NUMBER</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 017XXXXXXXX"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            onPress={handleTrack}
            disabled={loading}
            style={[styles.trackBtn, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.cream} size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="search" size={16} color={Colors.cream} />
                <Text style={styles.trackBtnText}>Track My Order</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Order Details Preview */}
        {order && (
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.orderNum}>Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>
                  Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent"}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "15" }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Courier Info */}
            {order.courier?.provider && (
              <View style={styles.courierCard}>
                <View style={styles.courierHeader}>
                  <Ionicons name="cube-outline" size={18} color={Colors.amber} />
                  <Text style={styles.courierName}>
                    {order.courier.provider === "steadfast" ? "Steadfast Courier" : "Pathao Logistics"}
                  </Text>
                </View>
                <Text style={styles.courierTracking}>
                  Tracking / Consignment ID:{" "}
                  <Text style={{ fontFamily: Typography.bodyBold, color: Colors.ink }}>
                    {order.courier.trackingCode || order.courier.consignmentId || "Assigned"}
                  </Text>
                </Text>
                {order.courier.status && (
                  <Text style={styles.courierStatus}>Status: {order.courier.status}</Text>
                )}
              </View>
            )}

            {/* Delivery Destination */}
            <View style={styles.addressBox}>
              <Text style={styles.addressTitle}>Delivery To</Text>
              <Text style={styles.addressText}>{order.shippingAddress?.fullName}</Text>
              <Text style={styles.addressSub}>
                {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city}
              </Text>
              <Text style={styles.addressSub}>{order.shippingAddress?.phone}</Text>
            </View>

            {/* Items summary */}
            <View style={styles.itemsBox}>
              <Text style={styles.addressTitle}>Ordered Items</Text>
              {order.items?.map((item: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemQty}>× {item.quantity}</Text>
                  <Text style={styles.itemPrice}>৳{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>৳{Number(order.totalPrice || 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
  },
  cardTitle: { fontSize: 16, fontFamily: Typography.display, color: Colors.ink, marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: Typography.body, color: Colors.textMuted, marginBottom: Spacing.md },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 10, fontFamily: Typography.bodySemibold, color: Colors.textLight, letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Typography.body,
    color: Colors.ink,
  },
  trackBtn: {
    backgroundColor: Colors.ink,
    borderRadius: BorderRadius.sm,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  trackBtnText: { color: Colors.cream, fontSize: 13, fontFamily: Typography.bodySemibold },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  orderNum: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.ink },
  orderDate: { fontSize: 11, fontFamily: Typography.body, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontFamily: Typography.bodyBold, letterSpacing: 1 },
  courierCard: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginBottom: Spacing.md,
  },
  courierHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  courierName: { fontSize: 12, fontFamily: Typography.bodyBold, color: Colors.ink },
  courierTracking: { fontSize: 11, fontFamily: Typography.body, color: Colors.textMuted },
  courierStatus: { fontSize: 11, fontFamily: Typography.bodyMedium, color: Colors.amber, marginTop: 2 },
  addressBox: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  addressTitle: { fontSize: 10, fontFamily: Typography.bodySemibold, color: Colors.textLight, letterSpacing: 1, marginBottom: 4 },
  addressText: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.ink },
  addressSub: { fontSize: 11, fontFamily: Typography.body, color: Colors.textMuted, marginTop: 1 },
  itemsBox: {},
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 12, fontFamily: Typography.body, color: Colors.ink },
  itemQty: { width: 36, textAlign: "center", fontSize: 11, fontFamily: Typography.body, color: Colors.textMuted },
  itemPrice: { width: 70, textAlign: "right", fontSize: 12, fontFamily: Typography.bodySemibold, color: Colors.ink },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: { fontSize: 12, fontFamily: Typography.bodyBold, color: Colors.ink },
  totalValue: { fontSize: 14, fontFamily: Typography.bodyBold, color: Colors.amber },
});

