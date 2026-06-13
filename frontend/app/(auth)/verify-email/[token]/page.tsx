import { Metadata } from "next";
import VerifyEmailClient from "./verify-email-client";

export const metadata: Metadata = {
  title: "Verify Email | Next Shop",
  description: "Verify Email | Next Shop",
};

export default function VerifyEmailLinkPage() {
  return <VerifyEmailClient />;
}
