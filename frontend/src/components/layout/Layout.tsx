import { Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function Layout() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) return null; // ou redirecionar

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 p-4 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
