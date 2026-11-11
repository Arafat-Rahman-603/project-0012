"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  Heart,
  Package,
  LogOut,
  LayoutDashboard,
  Truck,
  Sparkles,
  Grid,
  Phone,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { categoriesApi } from "@/lib/api";
import { Category } from "@/types";
import { extractList } from "@/lib/listResponse";
import { toast } from "sonner";
import { defaultSiteSettings, useSiteSettings } from "@/hooks/useSiteSettings";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, toggleCart } = useCartStore();
  const count = itemCount();
  const wishlistCount = user?.wishlist?.length || 0;

  const { settings } = useSiteSettings();
  const siteName = settings.siteName || defaultSiteSettings.siteName;
  const categoriesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch categories for navbar dropdown
  useEffect(() => {
    categoriesApi
      .list()
      .then(({ data }) => setCategories(extractList<Category>(data, "categories")))
      .catch(() => {});
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setCategoriesOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    router.push("/");
    setUserMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleCategoriesMouseEnter = () => {
    if (categoriesTimeoutRef.current) clearTimeout(categoriesTimeoutRef.current);
    setCategoriesOpen(true);
  };

  const handleCategoriesMouseLeave = () => {
    categoriesTimeoutRef.current = setTimeout(() => {
      setCategoriesOpen(false);
    }, 200);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-200 ${
          scrolled
            ? "bg-cream/95 backdrop-blur-md border-b border-ink/10 shadow-xs"
            : "bg-cream border-b border-ink/5"
        }`}
      >
        {/* Top Announcement Bar */}
        {settings.showAnnouncement && settings.announcementText && (
          <div
            style={{
              backgroundColor: settings.announcementBg || "#D97706",
              color: settings.announcementColor || "#FFFFFF",
            }}
            className="w-full text-center py-1.5 px-4 text-[11px] sm:text-xs font-medium tracking-wide transition-all select-none shadow-xs relative z-50 flex items-center justify-center gap-2"
          >
            <span>{settings.announcementText}</span>
          </div>
        )}

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between h-15 sm:h-16 md:h-18">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                {settings.logo?.url ? (
                  <Image
                    src={settings.logo.url}
                    alt={siteName}
                    width={140}
                    height={36}
                    className="h-7 sm:h-8 md:h-9 w-auto object-contain"
                    priority
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-ink rounded-sm flex items-center justify-center group-hover:bg-amber transition-colors duration-200 shadow-xs">
                      <ShoppingBag className="w-4 h-4 text-cream" />
                    </div>
                    <span
                      className="text-lg sm:text-xl font-bold tracking-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {siteName}
                    </span>
                  </>
                )}
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                <Link
                  href="/"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                    isActive("/")
                      ? "text-ink bg-parchment/70 font-bold"
                      : "text-ink/70 hover:text-ink hover:bg-parchment/40"
                  }`}
                >
                  Home
                </Link>

                <Link
                  href="/products"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                    pathname === "/products" && !pathname.includes("featured")
                      ? "text-ink bg-parchment/70 font-bold"
                      : "text-ink/70 hover:text-ink hover:bg-parchment/40"
                  }`}
                >
                  Shop All
                </Link>

                {/* Categories Dropdown Trigger */}
                <div
                  className="relative"
                  onMouseEnter={handleCategoriesMouseEnter}
                  onMouseLeave={handleCategoriesMouseLeave}
                >
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
                      categoriesOpen || pathname.includes("category")
                        ? "text-ink bg-parchment/70 font-bold"
                        : "text-ink/70 hover:text-ink hover:bg-parchment/40"
                    }`}
                  >
                    <span>Categories</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        categoriesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {categoriesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full pt-1.5 w-64 z-50"
                      >
                        <div className="bg-cream border border-ink/10 shadow-xl rounded-sm p-2 space-y-1">
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/40 border-b border-ink/5 flex items-center justify-between">
                            <span>Product Categories</span>
                            <Grid className="w-3 h-3" />
                          </div>

                          <div className="max-h-64 overflow-y-auto pr-1">
                            {categories.length > 0 ? (
                              categories.map((cat) => (
                                <Link
                                  key={cat._id}
                                  href={`/products?category=${cat._id}`}
                                  className="flex items-center justify-between px-3 py-2 text-xs text-ink/80 hover:text-ink hover:bg-parchment/70 rounded-xs transition-colors"
                                >
                                  <span className="font-medium truncate">{cat.name}</span>
                                  <ChevronRight className="w-3 h-3 text-ink/30" />
                                </Link>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-ink/40">Loading categories…</div>
                            )}
                          </div>

                          <div className="pt-1.5 border-t border-ink/10">
                            <Link
                              href="/products"
                              className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-amber hover:text-ink transition-colors"
                            >
                              <span>Browse Catalog</span>
                              <span>→</span>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/track"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                    isActive("/track")
                      ? "text-ink bg-parchment/70 font-bold"
                      : "text-ink/70 hover:text-ink hover:bg-parchment/40"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-ink/60" />
                  <span>Track Order</span>
                </Link>
              </nav>
            </div>

            {/* Right Action Icons & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Quick Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 p-2 rounded-sm text-ink/70 hover:text-ink hover:bg-parchment transition-colors"
                title="Search Products"
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span className="hidden xl:inline text-xs text-ink/40 font-normal">Search…</span>
              </button>

              {/* Wishlist Link */}
              <Link
                href={isAuthenticated ? "/profile?tab=wishlist" : "/login"}
                className="relative p-2 rounded-sm text-ink/70 hover:text-ink hover:bg-parchment transition-colors"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button
                onClick={toggleCart}
                className="relative p-2 rounded-sm text-ink/80 hover:text-ink hover:bg-parchment transition-colors"
                title="Cart"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1 right-1 w-4 h-4 bg-amber text-ink text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                    >
                      {count > 9 ? "9+" : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User Account Dropdown */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm hover:bg-parchment transition-colors"
                  >
                    <div className="w-6.5 h-6.5 rounded-full bg-ink text-cream flex items-center justify-center text-xs font-semibold overflow-hidden shadow-xs">
                      {user?.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={26}
                          height={26}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold max-w-[80px] truncate">
                      {user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-ink/50" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-56 bg-cream border border-ink/10 shadow-xl rounded-sm overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 bg-parchment/40 border-b border-ink/10">
                          <p className="text-xs font-bold truncate text-ink">{user?.name}</p>
                          <p className="text-[11px] text-ink/50 truncate">{user?.email}</p>
                        </div>
                        <div className="p-1 space-y-0.5">
                          {[
                            ...(user?.role === "admin"
                              ? [{ icon: LayoutDashboard, label: "Admin Panel", href: "/admin", badge: "Admin" }]
                              : [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }]),
                            { icon: User, label: "My Profile", href: "/profile" },
                            { icon: Package, label: "My Orders", href: "/orders" },
                            { icon: Heart, label: "Saved Wishlist", href: "/profile?tab=wishlist" },
                            { icon: Truck, label: "Track Package", href: "/track" },
                          ].map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center justify-between px-3 py-2 text-xs text-ink/80 hover:text-ink hover:bg-parchment/80 rounded-xs transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <item.icon className="w-3.5 h-3.5 text-ink/50" />
                                <span className="font-medium">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className="text-[9px] bg-amber/20 text-ink font-bold px-1.5 py-0.5 rounded">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-red-50 text-red-600 rounded-xs transition-colors w-full text-left font-medium border-t border-ink/5 mt-1 pt-1.5"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="text-xs font-semibold px-3 py-1.5 text-ink/80 hover:text-ink hover:bg-parchment rounded-sm transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-xs font-semibold px-3 py-1.5 bg-ink text-cream rounded-sm hover:bg-ink/90 transition-colors shadow-xs"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-sm text-ink/80 hover:text-ink hover:bg-parchment transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-ink/10 bg-cream overflow-hidden shadow-lg"
            >
              <div className="px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Mobile Search Input */}
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search products, brands…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-parchment/60 border border-ink/10 rounded-sm pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber"
                  />
                  <Search className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </form>

                {/* Primary Nav Links */}
                <div className="space-y-1">
                  {[
                    { label: "Home", href: "/", icon: Sparkles },
                    { label: "Shop All Products", href: "/products", icon: ShoppingBag },
                    { label: "Live Order Tracker", href: "/track", icon: Truck },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-sm hover:bg-parchment transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-ink/50" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ink/30" />
                    </Link>
                  ))}
                </div>

                {/* Categories quick links */}
                {categories.length > 0 && (
                  <div className="pt-2 border-t border-ink/10">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-ink/40 mb-2">
                      Popular Categories
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 px-1">
                      {categories.slice(0, 6).map((cat) => (
                        <Link
                          key={cat._id}
                          href={`/products?category=${cat._id}`}
                          onClick={() => setMobileOpen(false)}
                          className="px-2.5 py-1.5 bg-parchment/50 hover:bg-parchment rounded-sm text-[11px] font-medium text-ink/80 truncate"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Links */}
                <div className="pt-2 border-t border-ink/10 space-y-1">
                  {isAuthenticated ? (
                    <>
                      {user?.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber hover:bg-parchment rounded-sm"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Admin Control Panel</span>
                        </Link>
                      )}
                      <Link
                        href="/orders"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-parchment rounded-sm"
                      >
                        <Package className="w-4 h-4 text-ink/50" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-parchment rounded-sm"
                      >
                        <User className="w-4 h-4 text-ink/50" />
                        <span>My Account Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-parchment rounded-sm w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2 text-xs font-semibold text-center bg-parchment hover:bg-parchment/80 rounded-sm"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2 text-xs font-semibold text-center bg-ink text-cream rounded-sm"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>

                {/* Support Contact */}
                {settings.contactPhone && (
                  <div className="pt-2 border-t border-ink/10 px-3 text-[11px] text-ink/50 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Support: {settings.contactPhone}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Global Search Overlay (Ctrl+K or Search Click) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-start justify-center pt-20 md:pt-24 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-cream rounded-sm shadow-2xl overflow-hidden border border-ink/10"
            >
              <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3.5 border-b border-ink/10">
                <Search className="w-5 h-5 text-ink/40 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products, brands, or categories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-base bg-transparent border-none outline-none placeholder:text-ink/30 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-1.5 hover:bg-parchment rounded-sm transition-colors text-ink/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Suggestions / Links */}
              <div className="p-3 bg-parchment/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40 px-2 mb-2">
                  Quick Shortcuts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => {
                        router.push(`/products?category=${cat._id}`);
                        setSearchOpen(false);
                      }}
                      className="px-2.5 py-1 bg-cream border border-ink/10 hover:border-amber rounded-sm text-xs font-medium text-ink/80 transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      router.push("/products?featured=true");
                      setSearchOpen(false);
                    }}
                    className="px-2.5 py-1 bg-amber/10 border border-amber/30 hover:bg-amber/20 rounded-sm text-xs font-semibold text-ink transition-colors"
                  >
                    ⭐ Featured Items
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </>
  );
}
