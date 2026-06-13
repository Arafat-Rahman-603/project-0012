"use client";

import Link from "next/link";
import { ShoppingBag, ExternalLink, Globe, Mail } from "lucide-react";
import { defaultSiteSettings, useSiteSettings } from "@/hooks/useSiteSettings";

const Facebook = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const MessageCircle = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export default function Footer() {
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || defaultSiteSettings.siteName;

  const contactLinks = [];
  if (settings.contactAddress) {
    contactLinks.push({ label: settings.contactAddress, href: `https://maps.google.com/?q=${encodeURIComponent(settings.contactAddress)}` });
  }
  if (settings.contactPhone) {
    contactLinks.push({ label: `Phone: ${settings.contactPhone}`, href: `tel:${settings.contactPhone}` });
  }
  if (settings.contactEmail) {
    contactLinks.push({ label: `Email: ${settings.contactEmail}`, href: `mailto:${settings.contactEmail}` });
  }
  contactLinks.push({ label: "FAQ", href: "#" });

  return (
    <footer className="bg-ink text-cream mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {settings.logo?.url ? (
                <img
                  src={settings.logo.url}
                  alt={siteName}
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <>
                  <div className="w-8 h-8 bg-amber rounded-sm flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-ink" />
                  </div>
                  <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{siteName}</span>
                </>
              )}
            </Link>
            <p className="text-sm text-cream/50 leading-relaxed max-w-[200px]">
              Premium sarees curated for festive elegance, daily grace, and timeless style.
            </p>
            <div className="flex gap-3 mt-5">
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-cream/10 rounded-sm flex items-center justify-center hover:border-cream/30 hover:bg-cream/5 transition-colors">
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-cream/10 rounded-sm flex items-center justify-center hover:border-cream/30 hover:bg-cream/5 transition-colors">
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber.replace(/\+/g, '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-cream/10 rounded-sm flex items-center justify-center hover:border-cream/30 hover:bg-cream/5 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
              {!settings.facebookUrl && !settings.instagramUrl && !settings.whatsappNumber && (
                [ExternalLink, Globe, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 border border-cream/10 rounded-sm flex items-center justify-center hover:border-cream/30 hover:bg-cream/5 transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))
              )}
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
              links: contactLinks,
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
