import { Metadata } from "next";
import ResetPasswordClient from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password | Next Shop",
  description: "Reset Password | Next Shop",
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
