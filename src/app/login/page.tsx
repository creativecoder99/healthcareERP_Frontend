import type { Metadata } from "next";
import LoginPage from "@/components/LoginPage";

export const metadata: Metadata = {
  title: "Sign In | MediCore",
  description: "Access your MediCore medical history and EHR records vault securely.",
};

export default function Page() {
  return <LoginPage />;
}
