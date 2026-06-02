import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { ReservaProvider } from "@/components/admin/ReservaProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReservaProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ReservaProvider>
  );
}
