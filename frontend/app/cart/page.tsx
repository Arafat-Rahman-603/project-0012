import { Metadata } from "next";
import CartClient from "./cart-client";

export const metadata: Metadata = {
  title: "Cart | Next Shop",
  description: "Cart | Next Shop",
};

export default function CartPage() {
  return <CartClient />;
}
