"use client";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, ChevronDown, Grid2X2, LayoutList } from "lucide-react";
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
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1, limit: 12,
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: "-createdAt",
    inStock: false,
    featured: searchParams.get("featured") === "true",
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { ...filters };
      Object.keys(params).forEach(k => { if (params[k] === "" || params[k] === false || params[k] === undefined) delete params[k]; });
      const { data } = await productsApi.list(params);
      setProducts(extractList<Product>(data, "products"));
      setTotal(extractTotal(data));
    } catch { setProducts([]); }
    finally { setIsLoading(false); }
  }, [filters]);

  useEffect(() => {
    categoriesApi
      .list()
      .then(({ data }) => setCategories(extractList<Category>(data, "categories")))
      .catch(() => {});
  }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (window.innerWidth <= 480) {
      if (showFilters) {
        setView("list");
      } else {
        setView("grid");
      }
    }
    if (window.innerWidth >= 480) {
      setView("grid");
    }

  }, [showFilters]);

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

  // Sync filters to URL
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
    // We only want to sync to URL when filters change. 
    // Including searchParams in the dependency array can cause race conditions 
    // with the URL-to-filters sync effect.
  }, [filters, pathname, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / (filters.limit || 12));

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      {/* Header bar */}
      <div className="border-b border-ink/10 bg-cream sticky top-16 md:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {filters.search ? `"${filters.search}"` : filters.featured ? "Featured Sarees" : "All Sarees"}
              </h1>
              {!isLoading && <p className="text-xs text-ink/40 mt-0.5">{total} items found</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value, page: 1 }))}
                  className="appearance-none text-sm bg-parchment border border-ink/10 rounded-sm px-3 py-2 pr-8 cursor-pointer focus:outline-none focus:border-amber">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-ink/50" />
              </div>
              <div className="flex border border-ink/10 rounded-sm overflow-hidden">
                <button onClick={() => setView("grid")} className={`p-2 transition-colors ${view === "grid" ? "bg-ink text-cream" : "hover:bg-parchment"}`}>
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button onClick={() => setView("list")} className={`p-2 transition-colors ${view === "list" ? "bg-ink text-cream" : "hover:bg-parchment"}`}>
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 border border-ink/10 rounded-sm hover:bg-parchment transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>
          {/* Active filters */}
          <div className="flex flex-wrap gap-2 mt-3 empty:hidden">
            {filters.search && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ink text-cream px-2.5 py-1 rounded-sm">
                Search: {filters.search}
                <button onClick={() => setFilters(f => ({ ...f, search: "", page: 1 }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ink text-cream px-2.5 py-1 rounded-sm">
                {categories.find(c => c._id === filters.category)?.name || "Category"}
                <button onClick={() => setFilters(f => ({ ...f, category: "", page: 1 }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.featured && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-amber text-ink px-2.5 py-1 rounded-sm">
                Featured
                <button onClick={() => setFilters(f => ({ ...f, featured: false, page: 1 }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.inStock && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-sm">
                In Stock
                <button onClick={() => setFilters(f => ({ ...f, inStock: false, page: 1 }))}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="shrink-0 overflow-hidden">
                <div className="w-60 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink/40">Category</h3>
                    <div className="space-y-1">
                      <button onClick={() => setFilters(f => ({ ...f, category: "", page: 1 }))}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-sm transition-colors ${!filters.category ? "bg-ink text-cream" : "hover:bg-parchment"}`}>
                        All Categories
                      </button>
                      {categories.map(cat => (
                        <button key={cat._id} onClick={() => setFilters(f => ({ ...f, category: cat._id, page: 1 }))}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-sm transition-colors ${filters.category === cat._id ? "bg-ink text-cream" : "hover:bg-parchment"}`}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink/40">Price Range (৳)</h3>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.minPrice || ""}
                        onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
                        className="w-full text-sm bg-parchment border border-ink/10 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber" />
                      <input type="number" placeholder="Max" value={filters.maxPrice || ""}
                        onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
                        className="w-full text-sm bg-parchment border border-ink/10 rounded-sm px-2 py-1.5 focus:outline-none focus:border-amber" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink/40">Availability</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filters.inStock} className="accent-amber"
                        onChange={e => setFilters(f => ({ ...f, inStock: e.target.checked, page: 1 }))} />
                      <span className="text-sm">In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input type="checkbox" checked={filters.featured} className="accent-amber"
                        onChange={e => setFilters(f => ({ ...f, featured: e.target.checked, page: 1 }))} />
                      <span className="text-sm">Featured Only</span>
                    </label>
                  </div>
                  <button onClick={() => setFilters({ page: 1, limit: 12, search: "", category: "", sort: "-createdAt", inStock: false, featured: false })}
                    className="w-full text-sm text-ink/50 hover:text-ink border border-ink/10 rounded-sm py-2 transition-colors">
                    Clear All Filters
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className={`grid gap-5 ${view === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
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
                <button onClick={() => setFilters({ page: 1, limit: 12, search: "", category: "", sort: "-createdAt", inStock: false, featured: false })}
                  className="mt-4 text-sm text-amber-500 hover:text-amber-600">Clear filters →</button>
              </div>
            ) : (
              <>
                <motion.div layout className={`grid gap-5 ${view === "grid"
                  ? showFilters ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1"}`}>
                  {products.map((product, i) => <ProductCard key={product._id} product={product} index={i} />)}
                </motion.div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                      disabled={(filters.page || 1) <= 1}
                      className="px-4 py-2 text-sm border border-ink/10 rounded-sm hover:bg-parchment disabled:opacity-40 transition-colors">Prev</button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <button key={page} onClick={() => setFilters(f => ({ ...f, page }))}
                          className={`w-9 h-9 text-sm rounded-sm transition-colors ${filters.page === page ? "bg-ink text-cream" : "border border-ink/10 hover:bg-parchment"}`}>
                          {page}
                        </button>
                      );
                    })}
                    <button onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                      disabled={(filters.page || 1) >= totalPages}
                      className="px-4 py-2 text-sm border border-ink/10 rounded-sm hover:bg-parchment disabled:opacity-40 transition-colors">Next</button>
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
