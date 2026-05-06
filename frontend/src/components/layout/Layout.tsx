import { Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import Header from "./Header";
import { AppSidebar } from "./AppSidebar";

export default function Layout() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) return null; // ou redirecionar

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar visível apenas em desktop */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
