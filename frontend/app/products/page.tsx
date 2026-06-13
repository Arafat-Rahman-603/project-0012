import { Suspense } from "react";
import ProductsContent from "./ProductsContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Next Shop",
  description: "Products | Next Shop",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
