import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, ActivityIndicator, useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { productsApi, categoriesApi } from "@/lib/api";
import { Product, Category, ProductFilters } from "@/types";
import { extractList, extractTotal } from "@/lib/listResponse";
import ProductCard from "@/components/product/ProductCard";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Colors";

const SORT_OPTIONS = [
  { label: "Newest", value: "-createdAt" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Most Popular", value: "-ratings.count" },
  { label: "Top Rated", value: "-ratings.average" },
];

const DEFAULT_FILTERS: ProductFilters = {
  page: 1, limit: 12, search: "", category: "", sort: "-createdAt",
  inStock: false, featured: false,
};

export default function ProductsScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; featured?: string; search?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(params.search || "");

  const [filters, setFilters] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    category: params.category || "",
    featured: params.featured === "true",
    search: params.search || "",
  });
  const [draft, setDraft] = useState<ProductFilters>(filters);

  // Dynamic responsive columns logic
  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };
  const cols = getColumns();
  const cardWidth = (width - Spacing.lg * 2 - Spacing.sm * (cols - 1)) / cols;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { ...filters };
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === false || params[k] === undefined) delete params[k];
      });
      const { data } = await productsApi.list(params);
      setProducts(extractList<Product>(data, "products"));
      setTotal(extractTotal(data));
    } catch { setProducts([]); }
    finally { setIsLoading(false); }
  }, [filters]);

  useEffect(() => {
    categoriesApi.list()
      .then(({ data }) => setCategories(extractList<Category>(data, "categories")))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function applyFilters() {
    setFilters({ ...draft, search: searchText, page: 1 });
    setShowFilters(false);
  }

  function clearFilters() {
    const cleared = { ...DEFAULT_FILTERS, search: searchText };
    setDraft(cleared);
    setFilters(cleared);
    setShowFilters(false);
  }

  const activeCount = [
    filters.category, filters.featured, filters.inStock,
    filters.minPrice !== undefined, filters.maxPrice !== undefined,
  ].filter(Boolean).length;

  const totalPages = Math.ceil(total / (filters.limit || 12));

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>
          {filters.search ? `"${filters.search}"` : filters.featured ? "Featured Sarees" : "All Sarees"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Fixed Search and Controls Container to prevent keyboard focus loss */}
      <View style={{ paddingHorizontal: Spacing.lg }}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sarees..."
            placeholderTextColor={Colors.textLight}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => setFilters((f) => ({ ...f, search: searchText, page: 1 }))}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(""); setFilters((f) => ({ ...f, search: "", page: 1 })); }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Controls row */}
        <View style={styles.controls}>
          <Text style={styles.totalText}>{total} items</Text>
          <View style={styles.controlsRight}>
            {/* Filter button */}
            <TouchableOpacity
              onPress={() => { setDraft(filters); setShowFilters(true); }}
              style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
            >
              <Ionicons name="options-outline" size={14} color={activeCount > 0 ? Colors.cream : Colors.ink} />
              <Text style={{ fontSize: 11, fontFamily: Typography.bodyMedium, color: activeCount > 0 ? Colors.cream : Colors.ink, marginLeft: 2 }}>Filter</Text>
              {activeCount > 0 && <Text style={styles.filterCount}>{activeCount}</Text>}
            </TouchableOpacity>

            {/* Sort picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {SORT_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => setFilters((f) => ({ ...f, sort: o.value, page: 1 }))}
                  style={[styles.sortChip, filters.sort === o.value && styles.sortChipActive]}
                >
                  <Text style={[styles.sortChipText, filters.sort === o.value && styles.sortChipTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {filters.category && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {categories.find((c) => c._id === filters.category)?.name || "Category"}
                </Text>
                <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, category: "", page: 1 }))}>
                  <Ionicons name="close" size={12} color={Colors.cream} />
                </TouchableOpacity>
              </View>
            )}
            {filters.featured && (
              <View style={[styles.chip, { backgroundColor: Colors.amber }]}>
                <Text style={[styles.chipText, { color: Colors.ink }]}>Featured</Text>
                <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, featured: false, page: 1 }))}>
                  <Ionicons name="close" size={12} color={Colors.ink} />
                </TouchableOpacity>
              </View>
            )}
            {filters.inStock && (
              <View style={[styles.chip, { backgroundColor: Colors.success }]}>
                <Text style={styles.chipText}>In Stock</Text>
                <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, inStock: false, page: 1 }))}>
                  <Ionicons name="close" size={12} color={Colors.cream} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={clearFilters} style={styles.clearChip}>
              <Text style={styles.clearChipText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <FlatList<Product>
        key={cols}
        data={isLoading ? [] : products}
        keyExtractor={(item: Product) => item._id}
        numColumns={cols}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={[styles.skeletonCard, { width: cardWidth }]} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
              <TouchableOpacity onPress={clearFilters} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                disabled={(filters.page || 1) <= 1}
                style={[styles.pageBtn, (filters.page || 1) <= 1 && styles.pageBtnDisabled]}
              >
                <Ionicons name="chevron-back" size={16} color={Colors.ink} />
              </TouchableOpacity>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const page = i + 1;
                return (
                  <TouchableOpacity
                    key={page}
                    onPress={() => setFilters((f) => ({ ...f, page }))}
                    style={[styles.pageNumBtn, filters.page === page && styles.pageNumActive]}
                  >
                    <Text style={[styles.pageNumText, filters.page === page && styles.pageNumTextActive]}>
                      {page}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                disabled={(filters.page || 1) >= totalPages}
                style={[styles.pageBtn, (filters.page || 1) >= totalPages && styles.pageBtnDisabled]}
              >
                <Ionicons name="chevron-forward" size={16} color={Colors.ink} />
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }: { item: Product }) => <ProductCard product={item} />}
      />

      {/* Filter bottom sheet */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={22} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Category */}
            <Text style={styles.filterLabel}>CATEGORY</Text>
            <TouchableOpacity
              onPress={() => setDraft((d) => ({ ...d, category: "" }))}
              style={[styles.filterOption, !draft.category && styles.filterOptionActive]}
            >
              <Text style={[styles.filterOptionText, !draft.category && styles.filterOptionTextActive]}>
                All Categories
              </Text>
              {!draft.category && <Ionicons name="checkmark" size={16} color={Colors.cream} />}
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                onPress={() => setDraft((d) => ({ ...d, category: cat._id }))}
                style={[styles.filterOption, draft.category === cat._id && styles.filterOptionActive]}
              >
                <Text style={[styles.filterOptionText, draft.category === cat._id && styles.filterOptionTextActive]}>
                  {cat.name}
                </Text>
                {draft.category === cat._id && <Ionicons name="checkmark" size={16} color={Colors.cream} />}
              </TouchableOpacity>
            ))}

            {/* Price */}
            <Text style={[styles.filterLabel, { marginTop: 20 }]}>PRICE RANGE (৳)</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInput}>
                <Text style={styles.priceLabel}>Min</Text>
                <TextInput
                  style={styles.priceField}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                  value={draft.minPrice?.toString() || ""}
                  onChangeText={(v: string) => setDraft((d) => ({ ...d, minPrice: v ? Number(v) : undefined }))}
                />
              </View>
              <Text style={styles.priceDash}>—</Text>
              <View style={styles.priceInput}>
                <Text style={styles.priceLabel}>Max</Text>
                <TextInput
                  style={styles.priceField}
                  keyboardType="numeric"
                  placeholder="∞"
                  placeholderTextColor={Colors.textLight}
                  value={draft.maxPrice?.toString() || ""}
                  onChangeText={(v: string) => setDraft((d) => ({ ...d, maxPrice: v ? Number(v) : undefined }))}
                />
              </View>
            </View>

            {/* Toggles */}
            <Text style={[styles.filterLabel, { marginTop: 20 }]}>AVAILABILITY</Text>
            {[
              { key: "inStock" as const, label: "In Stock Only" },
              { key: "featured" as const, label: "Featured Only" },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setDraft((d) => ({ ...d, [key]: !d[key] }))}
                style={styles.toggle}
              >
                <Text style={styles.toggleLabel}>{label}</Text>
                <View style={[styles.toggleBox, draft[key] ? styles.toggleBoxActive : null]}>
                  {draft[key] ? <Ionicons name="checkmark" size={12} color={Colors.cream} /> : null}
                </View>
              </TouchableOpacity>
            ))}

            {/* Sort */}
            <Text style={[styles.filterLabel, { marginTop: 20 }]}>SORT BY</Text>
            <View style={styles.sortGrid}>
              {SORT_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => setDraft((d) => ({ ...d, sort: o.value }))}
                  style={[styles.sortOption, draft.sort === o.value && styles.sortOptionActive]}
                >
                  <Text style={[styles.sortOptionText, draft.sort === o.value && styles.sortOptionTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyFilters} style={styles.applyBtn}>
              <Ionicons name="checkmark" size={16} color={Colors.ink} />
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 32, paddingBottom: 4,
    paddingHorizontal: Spacing.lg, backgroundColor: Colors.cream,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  screenTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.ink },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  row: { gap: Spacing.sm, marginBottom: 0 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.parchment,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    marginVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: Typography.body, color: Colors.text },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  totalText: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.body, marginRight: 2 },
  controlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  sortChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    marginRight: 6, backgroundColor: Colors.cream,
  },
  sortChipActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  sortChipText: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.bodyMedium },
  sortChipTextActive: { color: Colors.cream },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 4,
  },
  filterBtnActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  filterCount: { fontSize: 10, color: Colors.cream, fontFamily: Typography.bodyBold, marginLeft: 2 },
  chipScroll: { marginBottom: Spacing.sm },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.ink, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4, marginRight: 6,
  },
  chipText: { fontSize: 11, color: Colors.cream, fontFamily: Typography.bodyMedium },
  clearChip: { paddingHorizontal: 10, paddingVertical: 4 },
  clearChipText: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.bodyMedium },
  loadingGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.sm },
  skeletonCard: {
    aspectRatio: 4 / 5, backgroundColor: Colors.border, borderRadius: BorderRadius.md,
  },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: Typography.bodySemibold, color: Colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, fontFamily: Typography.body, marginTop: 4 },
  emptyBtn: {
    marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: 10,
    backgroundColor: Colors.amber, borderRadius: BorderRadius.sm,
  },
  emptyBtnText: { fontSize: 13, fontFamily: Typography.bodySemibold, color: Colors.ink },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: Spacing.xl },
  pageBtn: { padding: 8, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  pageBtnDisabled: { opacity: 0.4 },
  pageNumBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: "center",
    justifyContent: "center", borderWidth: 1, borderColor: Colors.border,
  },
  pageNumActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  pageNumText: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.text },
  pageNumTextActive: { color: Colors.cream },

  // Sheet
  sheet: { flex: 1, backgroundColor: Colors.cream },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 16, fontFamily: Typography.bodySemibold, color: Colors.ink },
  sheetBody: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  filterLabel: { fontSize: 10, fontFamily: Typography.bodySemibold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  filterOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.md,
    marginBottom: 4, backgroundColor: Colors.parchment,
  },
  filterOptionActive: { backgroundColor: Colors.ink },
  filterOptionText: { fontSize: 13, fontFamily: Typography.bodyMedium, color: Colors.text },
  filterOptionTextActive: { color: Colors.cream },
  priceRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  priceInput: { flex: 1 },
  priceLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: Typography.body, marginBottom: 4 },
  priceField: {
    backgroundColor: Colors.parchment, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, fontFamily: Typography.body, color: Colors.text,
  },
  priceDash: { fontSize: 18, color: Colors.textMuted, marginTop: 16 },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  toggleLabel: { fontSize: 14, fontFamily: Typography.bodyMedium, color: Colors.text },
  toggleBox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 1.5,
    borderColor: Colors.borderMed, alignItems: "center", justifyContent: "center",
  },
  toggleBoxActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  sortGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.xxl },
  sortOption: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
  },
  sortOptionActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  sortOptionText: { fontSize: 12, fontFamily: Typography.bodyMedium, color: Colors.text },
  sortOptionTextActive: { color: Colors.cream },
  sheetFooter: {
    flexDirection: "row", gap: Spacing.sm, padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  clearBtn: {
    flex: 1, paddingVertical: 14, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  clearBtnText: { fontSize: 14, fontFamily: Typography.bodyMedium, color: Colors.text },
  applyBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: Colors.ink, paddingVertical: 14, borderRadius: BorderRadius.lg,
  },
  applyBtnText: { fontSize: 14, fontFamily: Typography.bodySemibold, color: Colors.cream },
});
