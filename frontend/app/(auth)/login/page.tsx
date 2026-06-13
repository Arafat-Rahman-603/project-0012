import { Metadata } from "next";
import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Login | Next Shop",
  description: "Login | Next Shop",
};

export default function LoginPage() {
  return <LoginClient />;
}