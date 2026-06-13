import { Metadata } from "next";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard | Next Shop",
  description: "Dashboard | Next Shop",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
