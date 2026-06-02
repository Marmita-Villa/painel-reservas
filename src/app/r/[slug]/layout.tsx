import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fazer Reserva",
  description: "Reserve sua mesa de forma rápida e fácil",
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)" }}
    >
      {children}
    </div>
  );
}
