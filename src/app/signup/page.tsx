import type { Metadata } from "next";
import SignupPage from "@/components/SignupPage";

export const metadata: Metadata = {
  title: "Sign Up | MediCore",
  description: "Create your MediCore account as a patient or verified healthcare provider.",
};

export default function Page() {
  return <SignupPage />;
}
