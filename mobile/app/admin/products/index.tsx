import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsApi } from "@/lib/api";
import { Product } from "@/types";
import { extractList } from "@/lib/listResponse";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";
import { useToast, Toast } from "@/components/ui/Toast";

export default function AdminProductsScreen() {
  const router = useRouter();
  const { toast, hide, success, error: showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await productsApi.list({ page, limit: 20 });
      setProducts(extractList<Product>(data, "products"));
      const pag = (data as any).pagination;
      setTotal(pag?.total ?? 0);
    } catch {} finally { setIsLoading(false); }
  }, [page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleDelete(id: string, name: string) {
    Alert.alert("Delete Product", `Delete "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await productsApi.delete(id);
            setProducts((prev) => prev.filter((p) => p._id !== id));
            success("Product deleted");
          } catch { showError("Failed to delete product"); }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hide} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products ({total})</Text>
        <TouchableOpacity
          onPress={() => router.push("/admin/products/new" as any)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={22} color={Colors.cream} />
        </TouchableOpacity>
      </View>

      {isLoading && products.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={Colors.amber} size="large" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.productRow}>
              <Image
                source={{ uri: item.images?.[0]?.url }}
                style={styles.thumb}
                contentFit="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>৳{(item.discountPrice ?? item.price).toLocaleString()}</Text>
                <View style={styles.productMeta}>
                  <View style={[styles.stockBadge, item.stock === 0 && styles.outOfStock]}>
                    <Text style={[styles.stockText, item.stock === 0 && styles.outOfStockText]}>
                      {item.stock === 0 ? "Out of Stock" : `${item.stock} in stock`}
                    </Text>
                  </View>
                  {item.featured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>Featured</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => router.push(`/admin/products/${item._id}` as any)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="pencil-outline" size={16} color={Colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item._id, item.name)}
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  addBtn: { backgroundColor: Colors.ink, width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.sm },
  productRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    padding: Spacing.sm, marginBottom: 4, backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
  },
  thumb: { width: 56, height: 68, borderRadius: BorderRadius.sm, backgroundColor: Colors.parchment },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.ink },
  productPrice: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.ink, marginTop: 2 },
  productMeta: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
  stockBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.success + "20" },
  outOfStock: { backgroundColor: Colors.error + "15" },
  stockText: { fontSize: 10, color: Colors.success, fontFamily: Typography.bodyMedium },
  outOfStockText: { color: Colors.error },
  featuredBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.amber + "20" },
  featuredText: { fontSize: 10, color: Colors.amberDark, fontFamily: Typography.bodyMedium },
  actions: { gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  deleteBtn: { borderColor: Colors.error + "40" },
});
