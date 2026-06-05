import SessionWrapper from "@/components/admin/SessionWrapper";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <SessionWrapper>{children}</SessionWrapper>;
}
