import { Metadata } from "next";
import RegisterClient from "./register-client";

export const metadata: Metadata = {
  title: "Register | Next Shop",
  description: "Register | Next Shop",
};

export default function RegisterPage() {
  return <RegisterClient />;
}