import { Metadata } from "next";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: "Home | Next Shop",
  description: "Home | Next Shop",
};

export default function HomePage() {
  return <HomeClient />;
}
