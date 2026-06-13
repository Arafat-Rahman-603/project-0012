"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { defaultSiteSettings, useSiteSettings } from "@/hooks/useSiteSettings";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, toggleCart } = useCartStore();
  const router = useRouter();
  const count = itemCount();
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || defaultSiteSettings.siteName;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-300 ${
          scrolled
            ? "bg-cream/95 backdrop-blur-sm border-b border-ink/10 shadow-sm"
            : "bg-cream"
        }`}
      >
        {settings.showAnnouncement && settings.announcementText && (
          <div
            style={{
              backgroundColor: settings.announcementBg || "#D97706",
              color: settings.announcementColor || "#FFFFFF",
            }}
            className="w-full text-center py-1.5 px-4 text-xs font-semibold tracking-wider transition-all select-none shadow-sm relative z-50"
          >
            {settings.announcementText}
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              {settings.logo?.url ? (
                <img
                  src={settings.logo.url}
                  alt={siteName}
                  className="h-8 md:h-10 w-auto object-contain"
                />
              ) : (
                <>
                  <div className="w-8 h-8 bg-ink rounded-sm flex items-center justify-center group-hover:bg-amber transition-colors duration-200">
                    <ShoppingBag className="w-4 h-4 text-cream" />
                  </div>
                  <span
                    className="text-xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {siteName}
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: "Shop", href: "/products" },
                { label: "Orders", href: "/orders" },
                { label: "About", href: "#" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-ink/70 hover:text-ink transition-colors link-amber"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-sm hover:bg-parchment transition-colors focus-ring"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative p-2 rounded-sm hover:bg-parchment transition-colors focus-ring"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber text-ink text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {count > 9 ? "9+" : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User */}
              {isAuthenticated ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-sm hover:bg-parchment transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-ink text-cream flex items-center justify-center text-xs font-medium overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium max-w-[80px] truncate">
                      {user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-ink/50" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-cream border border-ink/10 shadow-lg rounded-sm overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-ink/10">
                          <p className="text-sm font-semibold truncate">{user?.name}</p>
                          <p className="text-xs text-ink/50 truncate">{user?.email}</p>
                        </div>
                        {[
                          ...(user?.role === "admin"
                            ? [{ icon: LayoutDashboard, label: "Admin", href: "/admin" }]
                            : [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }]),
                          { icon: User, label: "Profile", href: "/profile" },
                          { icon: Package, label: "My Orders", href: "/orders" },
                          { icon: Heart, label: "Wishlist", href: "/profile?tab=wishlist" },
                        ].map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-parchment transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-ink/50" />
                            {item.label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-parchment transition-colors w-full text-left border-t border-ink/10 text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-sm font-medium px-4 py-1.5 hover:bg-parchment rounded-sm transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium px-4 py-1.5 bg-ink text-cream rounded-sm hover:bg-ink/90 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-sm hover:bg-parchment transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-ink/10 bg-cream overflow-hidden"
            >
              <nav className="px-4 py-4 flex flex-col gap-1">
                {[
                  { label: "Shop", href: "/products" },
                  ...(isAuthenticated
                    ? user?.role === "admin"
                      ? [{ label: "Admin", href: "/admin" }]
                      : [{ label: "Dashboard", href: "/dashboard" }]
                    : []),
                  { label: "Orders", href: "/orders" },
                  { label: "Profile", href: "/profile" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm font-medium hover:bg-parchment rounded-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-ink/10">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium text-center hover:bg-parchment rounded-sm transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium text-center bg-ink text-cream rounded-sm"
                    >
                      Register
                    </Link>
                  </div>
                )}
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-parchment rounded-sm transition-colors mt-2 border-t border-ink/10 text-left"
                  >
                    Sign Out
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-cream rounded-sm shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSearch} className="flex items-center gap-3 px-5 py-4">
                <Search className="w-5 h-5 text-ink/40 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products, brands, categories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-ink/30 font-body"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-1 hover:bg-parchment rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
              <div className="px-5 pb-3 text-xs text-ink/40">
                Press Enter to search or Escape to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </>
  );
}
