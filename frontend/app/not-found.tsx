import { Metadata } from "next";
import NotFoundClient from "./not-found-client";

export const metadata: Metadata = {
  title: "404 | Not Found | Next Shop",
  description: "404 | Not Found | Next Shop",
};

export default function NotFound() {
  return <NotFoundClient />;
}
