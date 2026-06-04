import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { ReservaProvider } from "@/components/admin/ReservaProvider";
import SessionWrapper from "@/components/admin/SessionWrapper";
import { RestaurantProvider } from "@/contexts/RestaurantContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionWrapper>
      <RestaurantProvider>
        <ReservaProvider>
          <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </div>
        </ReservaProvider>
      </RestaurantProvider>
    </SessionWrapper>
  );
}
