import { redirect } from "next/navigation";

// Life-category onboarding is paused while Milestone ships as a business CRM first.
export default function OnboardingPage() {
  redirect("/dashboard");
}
