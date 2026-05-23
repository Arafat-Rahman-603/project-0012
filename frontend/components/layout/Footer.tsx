"use client";

import Link from "next/link";
import { ShoppingBag, ExternalLink, Globe, Mail } from "lucide-react";
import { defaultSiteSettings, useSiteSettings } from "@/hooks/useSiteSettings";

export default function Footer() {
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || defaultSiteSettings.siteName;

  return (
    <footer className="bg-ink text-cream mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber rounded-sm flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-ink" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{siteName}</span>
            </Link>
            <p className="text-sm text-cream/50 leading-relaxed max-w-[200px]">
              Premium sarees curated for festive elegance, daily grace, and timeless style.
            </p>
            <div className="flex gap-3 mt-5">
              {[ExternalLink, Globe, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 border border-cream/10 rounded-sm flex items-center justify-center hover:border-cream/30 hover:bg-cream/5 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Shop",
              links: [
                { label: "All Products", href: "/products" },
                { label: "Featured", href: "/products?featured=true" },
                { label: "New Arrivals", href: "/products?sort=-createdAt" },
                { label: "Sale", href: "/products?sort=-discountPrice" },
              ],
            },
            {
              title: "Account",
              links: [
                { label: "My Profile", href: "/profile" },
                { label: "My Orders", href: "/orders" },
                { label: "Wishlist", href: "/profile?tab=wishlist" },
                { label: "Addresses", href: "/profile?tab=addresses" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Contact Us", href: "#" },
                { label: "FAQ", href: "#" },
                { label: "Shipping Policy", href: "#" },
                { label: "Returns", href: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold tracking-widest uppercase text-cream/40 mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-cream/60 hover:text-cream transition-colors link-amber">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-cream/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/30">© 2026 {siteName}. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-cream/30">
            <a href="#" className="hover:text-cream/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cream/60 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cream/60 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
