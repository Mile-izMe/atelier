import type { Metadata } from "next";
import AuthenticationContent from "./AuthenticationContent";

export const metadata: Metadata = {
  title: "Authentication | ATELIER",
};

export default function AuthenticationPage() {
  return <AuthenticationContent />;
}
