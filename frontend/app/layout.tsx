import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nextshop.com.bd"),
  title: {
    default: "Next Shop | Premium Lifestyle & Fashion in Bangladesh",
    template: "%s | Next Shop",
  },
  description: "Next Shop is Bangladesh's premier shopping destination for curated premium lifestyle collections, apparel, and accessories with nationwide fast home delivery.",
  keywords: [
    "Next Shop",
    "online shopping bangladesh",
    "bangladesh ecommerce",
    "steadfast courier delivery",
    "pathao courier",
    "premium lifestyle",
    "fashion bangladesh",
    "buy online bd",
  ],
  openGraph: {
    title: "Next Shop | Premium Lifestyle & Fashion",
    description: "Curated collections with fast Cash-on-Delivery across all 64 districts in Bangladesh.",
    url: "/",
    siteName: "Next Shop",
    locale: "en_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Shop | Online Shopping Bangladesh",
    description: "Curated collections with fast Cash-on-Delivery nationwide.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="noise">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <CartDrawer />
          <Footer />
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0A0A0A",
              color: "#F8F6F0",
              border: "1px solid rgba(248,246,240,0.1)",
              fontFamily: "var(--font-body)",
              borderRadius: "2px",
            },
          }}
        />
      </body>
    </html>
  );
}
