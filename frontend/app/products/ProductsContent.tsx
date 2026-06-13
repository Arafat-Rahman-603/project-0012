"use client";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, ChevronDown, Grid2X2, LayoutList, Check } from "lucide-react";
import { productsApi, categoriesApi } from "@/lib/api";
import { Product, Category, ProductFilters } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { extractList, extractTotal } from "@/lib/listResponse";

const SORT_OPTIONS = [
  { label: "Newest", value: "-createdAt" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Most Popular", value: "-ratings.count" },
  { label: "Top Rated", value: "-ratings.average" },
];

const DEFAULT_FILTERS: ProductFilters = {
  page: 1,
  limit: 12,
  search: "",
  category: "",
  sort: "-createdAt",
  inStock: false,
  featured: false,
};

// Count how many non-default filters are active
function countActiveFilters(filters: ProductFilters): number {
  let count = 0;
  if (filters.category) count++;
  if (filters.featured) count++;
  if (filters.inStock) count++;
  if (typeof filters.minPrice === "number") count++;
  if (typeof filters.maxPrice === "number") count++;
  return count;
}

export default function ProductsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Committed (applied) filters — these drive the API call
  const [filters, setFilters] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: "-createdAt",
    featured: searchParams.get("featured") === "true",
  });

  // Draft filters — local state inside the panel, only committed on "Apply"
  const [draft, setDraft] = useState<ProductFilters>(filters);

  // Sync draft when panel opens so it reflects current applied filters
  const handleOpenFilters = () => {
    setDraft(filters);
    setShowFilters(true);
  };

  const handleApplyFilters = () => {
    setFilters({ ...draft, page: 1 });
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const cleared: ProductFilters = {
      ...DEFAULT_FILTERS,
      search: filters.search, // preserve search
      sort: filters.sort,     // preserve sort
    };
    setDraft(cleared);
    setFilters(cleared);
    setShowFilters(false);
  };

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
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    categoriesApi
      .list()
      .then(({ data }) => setCategories(extractList<Category>(data, "categories")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync URL → filters
  useEffect(() => {
    setFilters((prev) => {
      const nextFilters: ProductFilters = {
        ...prev,
        page: Number(searchParams.get("page") || 1),
        search: searchParams.get("search") || "",
        category: searchParams.get("category") || "",
        sort: searchParams.get("sort") || "-createdAt",
        featured: searchParams.get("featured") === "true",
        inStock: searchParams.get("inStock") === "true",
        minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
        maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      };
      const unchanged =
        prev.page === nextFilters.page &&
        prev.search === nextFilters.search &&
        prev.category === nextFilters.category &&
        prev.sort === nextFilters.sort &&
        prev.featured === nextFilters.featured &&
        prev.inStock === nextFilters.inStock &&
        prev.minPrice === nextFilters.minPrice &&
        prev.maxPrice === nextFilters.maxPrice;
      return unchanged ? prev : nextFilters;
    });
  }, [searchParams]);

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.sort && filters.sort !== "-createdAt") params.set("sort", filters.sort);
    if (filters.featured) params.set("featured", "true");
    if (filters.inStock) params.set("inStock", "true");
    if (typeof filters.minPrice === "number") params.set("minPrice", String(filters.minPrice));
    if (typeof filters.maxPrice === "number") params.set("maxPrice", String(filters.maxPrice));
    if ((filters.page || 1) > 1) params.set("page", String(filters.page));

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [filters, pathname, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / (filters.limit || 12));
  const activeFilterCount = countActiveFilters(filters);
  const draftFilterCount = countActiveFilters(draft);

  // ─── Filter Panel Content (shared between mobile sheet & desktop sidebar) ───
  const FilterPanelContent = (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink/40">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() => setDraft((d) => ({ ...d, category: "" }))}
            className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
              !draft.category ? "bg-ink text-cream" : "hover:bg-parchment"
            }`}
          >
            All Categories
            {!draft.category && <Check className="w-3.5 h-3.5" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setDraft((d) => ({ ...d, category: cat._id }))}
              className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                draft.category === cat._id ? "bg-ink text-cream" : "hover:bg-parchment"
              }`}
            >
              {cat.name}
              {draft.category === cat._id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink/40">Price Range (৳)</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-ink/40 uppercase tracking-wider mb-1 block">Min</label>
            <input
              type="number"
              placeholder="0"
              value={draft.minPrice || ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full text-sm bg-parchment border border-ink/10 rounded-md px-3 py-2 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/20 transition"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-ink/40 uppercase tracking-wider mb-1 block">Max</label>
            <input
              type="number"
              placeholder="∞"
              value={draft.maxPrice || ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full text-sm bg-parchment border border-ink/10 rounded-md px-3 py-2 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/20 transition"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink/40">Availability</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setDraft((d) => ({ ...d, inStock: !d.inStock }))}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                draft.inStock ? "bg-ink border-ink" : "border-ink/20 group-hover:border-ink/40"
              }`}
            >
              {draft.inStock && <Check className="w-3 h-3 text-cream" />}
            </div>
            <span className="text-sm select-none" onClick={() => setDraft((d) => ({ ...d, inStock: !d.inStock }))}>
              In Stock Only
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setDraft((d) => ({ ...d, featured: !d.featured }))}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                draft.featured ? "bg-amber border-amber" : "border-ink/20 group-hover:border-ink/40"
              }`}
            >
              {draft.featured && <Check className="w-3 h-3 text-ink" />}
            </div>
            <span className="text-sm select-none" onClick={() => setDraft((d) => ({ ...d, featured: !d.featured }))}>
              Featured Only
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      {/* Header bar */}
      <div className="border-b border-ink/10 bg-cream sticky top-16 md:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {filters.search
                  ? `"${filters.search}"`
                  : filters.featured
                  ? "Featured Sarees"
                  : "All Sarees"}
              </h1>
              {!isLoading && (
                <p className="text-xs text-ink/40 mt-0.5">{total} items found</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort — desktop only */}
              <div className="relative hidden sm:block">
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
                  className="appearance-none text-sm bg-parchment border border-ink/10 rounded-sm px-3 py-2 pr-8 cursor-pointer focus:outline-none focus:border-amber"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-ink/50" />
              </div>

              {/* View toggle — desktop only */}
              <div className="hidden sm:flex border border-ink/10 rounded-sm overflow-hidden">
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 transition-colors ${view === "grid" ? "bg-ink text-cream" : "hover:bg-parchment"}`}
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2 transition-colors ${view === "list" ? "bg-ink text-cream" : "hover:bg-parchment"}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              {/* Filter button — always visible */}
              <button
                onClick={handleOpenFilters}
                className="relative flex items-center gap-2 text-sm font-medium px-3 py-2 border border-ink/10 rounded-sm hover:bg-parchment transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber text-ink text-[10px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          <div className="flex flex-wrap gap-2 mt-3 empty:hidden">
            {filters.search && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ink text-cream px-2.5 py-1 rounded-full">
                Search: {filters.search}
                <button onClick={() => setFilters((f) => ({ ...f, search: "", page: 1 }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ink text-cream px-2.5 py-1 rounded-full">
                {categories.find((c) => c._id === filters.category)?.name || "Category"}
                <button onClick={() => setFilters((f) => ({ ...f, category: "", page: 1 }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.featured && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-amber text-ink px-2.5 py-1 rounded-full">
                Featured
                <button onClick={() => setFilters((f) => ({ ...f, featured: false, page: 1 }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.inStock && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                In Stock
                <button onClick={() => setFilters((f) => ({ ...f, inStock: false, page: 1 }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {typeof filters.minPrice === "number" && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-parchment border border-ink/10 text-ink px-2.5 py-1 rounded-full">
                Min ৳{filters.minPrice}
                <button
                  onClick={() => setFilters((f) => ({ ...f, minPrice: undefined, page: 1 }))}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {typeof filters.maxPrice === "number" && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-parchment border border-ink/10 text-ink px-2.5 py-1 rounded-full">
                Max ৳{filters.maxPrice}
                <button
                  onClick={() => setFilters((f) => ({ ...f, maxPrice: undefined, page: 1 }))}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeFilterCount > 1 && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs text-ink/40 hover:text-ink px-2 py-1 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE FILTER BOTTOM SHEET ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-cream rounded-t-2xl shadow-2xl md:hidden flex flex-col max-h-[85dvh]"
            >
              {/* Sheet handle */}
              <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
                <div className="w-10 h-1 rounded-full bg-ink/15" />
              </div>

              {/* Sheet header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-ink/10">
                <div>
                  <h2 className="text-base font-semibold">Filters</h2>
                  {draftFilterCount > 0 && (
                    <p className="text-xs text-ink/40 mt-0.5">{draftFilterCount} active</p>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 rounded-full hover:bg-parchment transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile sort (only in sheet) */}
              <div className="flex-shrink-0 px-5 py-3 border-b border-ink/10">
                <h3 className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink/40">Sort By</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setDraft((d) => ({ ...d, sort: o.value }))}
                      className={`text-sm px-3 py-2 rounded-md border transition-colors text-left ${
                        (draft.sort ?? "-createdAt") === o.value
                          ? "bg-ink text-cream border-ink"
                          : "border-ink/10 hover:bg-parchment"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable filter body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">{FilterPanelContent}</div>

              {/* Sheet footer — action buttons */}
              <div className="flex-shrink-0 px-5 py-4 border-t border-ink/10 flex gap-3 bg-cream">
                <button
                  onClick={handleClearFilters}
                  className="flex-1 py-3 text-sm font-medium border border-ink/20 rounded-xl hover:bg-parchment transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-[2] py-3 text-sm font-semibold bg-ink text-cream rounded-xl hover:bg-ink/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Filters
                  {draftFilterCount > 0 && (
                    <span className="bg-amber text-ink text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {draftFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DESKTOP FILTER SIDEBAR + GRID ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6 items-start">
          {/* Desktop sidebar */}
          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.aside
                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="shrink-0 overflow-hidden hidden md:block self-start"
                style={{ position: "relative" }}
              >
                {/* Inner wrapper fixed width so content doesn't squish during animation */}
                <div className="w-64">
                  <div className="bg-parchment rounded-xl p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-sm font-semibold">Filters</h2>
                      {draftFilterCount > 0 && (
                        <span className="text-[11px] bg-amber/20 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {draftFilterCount} active
                        </span>
                      )}
                    </div>

                    {FilterPanelContent}

                    {/* Desktop Apply + Clear */}
                    <div className="pt-5 space-y-2">
                      <button
                        onClick={handleApplyFilters}
                        className="w-full py-2.5 text-sm font-semibold bg-ink text-cream rounded-lg hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Apply Filters
                        {draftFilterCount > 0 && (
                          <span className="bg-amber text-ink text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            {draftFilterCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={handleClearFilters}
                        className="w-full py-2 text-sm text-ink/40 hover:text-ink transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile sort + view controls (below header, above grid) */}
            <div className="flex items-center justify-between mb-5 sm:hidden">
              <div className="relative flex-1 max-w-[180px]">
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
                  className="appearance-none w-full text-sm bg-parchment border border-ink/10 rounded-md px-3 py-2 pr-7 cursor-pointer focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-ink/50" />
              </div>
              <div className="flex border border-ink/10 rounded-md overflow-hidden">
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 transition-colors ${view === "grid" ? "bg-ink text-cream" : "hover:bg-parchment"}`}
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2 transition-colors ${view === "list" ? "bg-ink text-cream" : "hover:bg-parchment"}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div
                className={`grid gap-5 ${
                  view === "grid"
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="skeleton aspect-[4/5] rounded-sm" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 text-ink/40">
                <p className="text-xl font-medium">No products found</p>
                <p className="text-sm mt-2">Try adjusting your filters or search query</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-sm text-amber-500 hover:text-amber-600"
                >
                  Clear filters →
                </button>
              </div>
            ) : (
              <>
                <motion.div
                  layout
                  className={`grid gap-5 ${
                    view === "grid"
                      ? showFilters
                        ? "grid-cols-2 md:grid-cols-3"
                        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      : "grid-cols-1"
                  }`}
                >
                  {products.map((product, i) => (
                    <ProductCard key={product._id} product={product} index={i} />
                  ))}
                </motion.div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() =>
                        setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))
                      }
                      disabled={(filters.page || 1) <= 1}
                      className="px-4 py-2 text-sm border border-ink/10 rounded-sm hover:bg-parchment disabled:opacity-40 transition-colors"
                    >
                      Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setFilters((f) => ({ ...f, page }))}
                          className={`w-9 h-9 text-sm rounded-sm transition-colors ${
                            filters.page === page
                              ? "bg-ink text-cream"
                              : "border border-ink/10 hover:bg-parchment"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          page: Math.min(totalPages, (f.page || 1) + 1),
                        }))
                      }
                      disabled={(filters.page || 1) >= totalPages}
                      className="px-4 py-2 text-sm border border-ink/10 rounded-sm hover:bg-parchment disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}