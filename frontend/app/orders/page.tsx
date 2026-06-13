import { Metadata } from "next";
import OrdersClient from "./orders-client";

export const metadata: Metadata = {
  title: "Orders | Next Shop",
  description: "Orders | Next Shop",
};

export default function OrdersPage() {
  return <OrdersClient />;
}
