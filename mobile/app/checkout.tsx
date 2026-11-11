import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart, fetchCart, isLoading } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { toast, hide, success, error: showError } = useToast();

  const [form, setForm] = useState<AddressForm>({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "BD",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash">("cod");
  const [bkashNumber, setBkashNumber] = useState("");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    if (!cart) {
      fetchCart().catch(() => {});
    }

    // Pre-populate with user's default address if available
    if (user?.addresses && user.addresses.length > 0) {
      const def = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
      setForm({
        fullName: def.fullName || user.name || "",
        phone: def.phone || user.phone || "",
        addressLine1: def.addressLine1 || "",
        city: def.city || "",
        state: def.state || "",
        postalCode: def.postalCode || "",
        country: def.country || "BD",
      });
    } else {
      setForm((prev) => ({
        ...prev,
        fullName: user?.name || "",
        phone: user?.phone || "",
      }));
    }
  }, [cart, fetchCart, user, isAuthenticated, router]);

  const items = cart?.items ?? [];
  const total = cart?.totalPrice ?? 0;
  const discount = paymentMethod === "bkash" ? Math.round(total * 0.30) : 0;
  const discountedTotal = Math.max(0, total - discount);
  const delivery = discountedTotal >= 2000 ? 0 : 80;
  const grandTotal = discountedTotal + delivery;
  const advanceAmount = paymentMethod === "bkash" ? Math.max(100, Math.min(grandTotal, 100)) : 0;
  const dueAmount = Math.max(0, grandTotal - advanceAmount);

  if (isLoading && !cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.amber} size="large" />
      </View>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="bag-handle-outline" size={56} color={Colors.borderMed} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add a few products before you continue to checkout.</Text>
        <TouchableOpacity onPress={() => router.replace("/products")} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handlePlaceOrder() {
    // Validate
    if (!form.fullName.trim()) return showError("Full Name is required");
    if (!form.phone.trim()) return showError("Phone number is required");
    if (!form.addressLine1.trim()) return showError("Delivery Address is required");
    if (!form.city.trim()) return showError("City / District is required");

    if (paymentMethod === "bkash") {
      if (!bkashNumber.trim() || bkashNumber.trim().length < 11) {
        return showError("Please enter a valid 11-digit bKash account number");
      }
      if (!bkashTrxId.trim() || bkashTrxId.trim().length < 4) {
        return showError("Please enter your bKash Transaction ID (TrxID)");
      }
    }

    setPlacing(true);
    try {
      await ordersApi.create({
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          city: form.city.trim(),
          state: form.state.trim() || form.city.trim(),
          postalCode: form.postalCode.trim() || "1000",
          country: "BD",
        },
        paymentMethod,
        bkashNumber: paymentMethod === "bkash" ? bkashNumber.trim() : undefined,
        bkashTrxId: paymentMethod === "bkash" ? bkashTrxId.trim().toUpperCase() : undefined,
        advanceAmount: paymentMethod === "bkash" ? advanceAmount : undefined,
      });
      await clearCart();
      success(paymentMethod === "bkash" ? "Order placed! 30% bKash discount applied." : "Order placed successfully!");
      // Navigate to orders tab list
      setTimeout(() => {
        router.replace("/orders");
      }, 1500);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to place order");
      setPlacing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Step Info */}
        <View style={styles.stepInfo}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Shipping & Payment</Text>
        </View>

        {/* Form fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeading}>Shipping Address</Text>

          {[
            { label: "FULL NAME", key: "fullName", placeholder: "e.g. Rahim Ahmed" },
            { label: "PHONE NUMBER", key: "phone", placeholder: "e.g. 017XXXXXXXX", keyboardType: "phone-pad" as const },
            { label: "DELIVERY ADDRESS", key: "addressLine1", placeholder: "House#, Road#, Area / Village" },
            { label: "DISTRICT / CITY", key: "city", placeholder: "e.g. Dhaka, Chittagong, Sylhet" },
            { label: "AREA / THANA / ZONE (OPTIONAL)", key: "state", placeholder: "e.g. Mirpur, Gulshan, Dhanmondi" },
          ].map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={form[field.key as keyof AddressForm]}
                onChangeText={(val) => setForm((f) => ({ ...f, [field.key]: val }))}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textLight}
                keyboardType={field.keyboardType || "default"}
              />
            </View>
          ))}
        </View>

        {/* Payment details */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionHeading}>Payment Method</Text>

          {/* COD Option */}
          <TouchableOpacity
            onPress={() => setPaymentMethod("cod")}
            style={[styles.codCard, paymentMethod === "cod" && styles.selectedPaymentCard]}
          >
            <View style={styles.codHeader}>
              <Ionicons
                name={paymentMethod === "cod" ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={paymentMethod === "cod" ? Colors.ink : Colors.textMuted}
              />
              <Text style={styles.codTitle}>Cash on Delivery (COD)</Text>
            </View>
            <Text style={styles.codDesc}>
              Pay with cash when rider delivers to your doorstep. Standard regular price.
            </Text>
          </TouchableOpacity>

          {/* bKash Option */}
          <TouchableOpacity
            onPress={() => setPaymentMethod("bkash")}
            style={[
              styles.codCard,
              { marginTop: 10 },
              paymentMethod === "bkash" && styles.selectedPaymentCard,
            ]}
          >
            <View style={styles.codHeader}>
              <Ionicons
                name={paymentMethod === "bkash" ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={paymentMethod === "bkash" ? Colors.amber : Colors.textMuted}
              />
              <Text style={styles.codTitle}>bKash (Pay Advance & Save 30%)</Text>
            </View>
            <Text style={styles.codDesc}>
              Pay minimum ৳100 advance deposit via bKash to unlock 30% instant discount!
            </Text>
          </TouchableOpacity>

          {/* bKash Input Fields */}
          {paymentMethod === "bkash" && (
            <View style={styles.bkashBox}>
              <Text style={styles.bkashNotice}>
                Send at least ৳{advanceAmount} to bKash Merchant: 01700-000000
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>YOUR BKASH PHONE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  value={bkashNumber}
                  onChangeText={setBkashNumber}
                  placeholder="01XXXXXXXXX"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BKASH TRANSACTION ID (TRXID)</Text>
                <TextInput
                  style={styles.input}
                  value={bkashTrxId}
                  onChangeText={(t) => setBkashTrxId(t.toUpperCase())}
                  placeholder="e.g. 8N7X2KL9PQ"
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          )}
        </View>

        {/* Summary Details */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionHeading}>Items Overview</Text>
          {items.map((item) => {
            const price = item.product?.discountPrice ?? item.product?.price ?? 0;
            return (
              <View key={item._id} style={styles.summaryItem}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product?.name} × {item.quantity}
                </Text>
                <Text style={styles.itemTotal}>৳{(price * item.quantity).toLocaleString()}</Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Items Subtotal</Text>
            <Text style={styles.costValue}>৳{total.toLocaleString()}</Text>
          </View>
          {paymentMethod === "bkash" && (
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: Colors.amber }]}>bKash 30% Advance Discount</Text>
              <Text style={[styles.costValue, { color: Colors.amber, fontFamily: Typography.bodyBold }]}>
                -৳{discount.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Delivery Fee</Text>
            <Text style={[styles.costValue, delivery === 0 && { color: Colors.success }]}>
              {delivery === 0 ? "Free" : `৳${delivery}`}
            </Text>
          </View>

          <View style={[styles.costRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total Order Value</Text>
            <Text style={styles.grandTotalValue}>৳{grandTotal.toLocaleString()}</Text>
          </View>
          {paymentMethod === "bkash" && (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border, gap: 4 }}>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: Colors.amber }]}>Advance to Pay via bKash:</Text>
                <Text style={[styles.costValue, { color: Colors.amber }]}>৳{advanceAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Due on Delivery (COD):</Text>
                <Text style={[styles.costValue, { fontFamily: Typography.bodyBold }]}>৳{dueAmount.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Footer sticky bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerAmount}>৳{grandTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placing}
          style={[styles.placeBtn, placing && { opacity: 0.7 }]}
        >
          {placing ? (
            <ActivityIndicator color={Colors.cream} size="small" />
          ) : (
            <>
              <Text style={styles.placeText}>Place Order</Text>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.cream} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.cream },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    backgroundColor: Colors.cream,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    fontSize: 22,
    fontFamily: Typography.display,
    color: Colors.ink,
  },
  emptySubtitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    fontFamily: Typography.body,
    textAlign: "center",
  },
  emptyBtn: {
    backgroundColor: Colors.ink,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
  },
  emptyBtnText: { color: Colors.cream, fontSize: 14, fontFamily: Typography.bodySemibold },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 54, paddingBottom: Spacing.sm, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cream, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  body: { flex: 1 },
  stepInfo: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.amber,
    alignItems: "center", justifyContent: "center",
  },
  stepNum: { fontSize: 12, fontFamily: Typography.bodyBold, color: Colors.ink },
  stepLabel: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  formSection: { padding: Spacing.lg, backgroundColor: Colors.cream },
  sectionHeading: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.ink, marginBottom: Spacing.md, textTransform: "uppercase", letterSpacing: 0.5 },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 9, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 4 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: 14, fontFamily: Typography.body, color: Colors.text,
  },
  paymentSection: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.cream },
  codCard: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md, gap: 6,
  },
  codHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  codTitle: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink },
  codDesc: { fontSize: 12, color: Colors.textMuted, fontFamily: Typography.body, lineHeight: 18 },
  summarySection: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.cream },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemName: { fontSize: 13, color: Colors.text, fontFamily: Typography.body, flex: 1, marginRight: Spacing.md },
  itemTotal: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  costRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  costLabel: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body },
  costValue: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink },
  grandTotalRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  grandTotalLabel: { fontSize: 15, fontFamily: Typography.bodySemibold, color: Colors.ink },
  grandTotalValue: { fontSize: 18, fontFamily: Typography.bodyBold, color: Colors.ink },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 8,
  },
  footerLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body },
  footerAmount: { fontSize: 20, fontFamily: Typography.bodyBold, color: Colors.ink, marginTop: 2 },
  placeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.ink, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: BorderRadius.sm,
  },
  placeText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.cream },
});
