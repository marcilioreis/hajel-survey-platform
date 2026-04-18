import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 p-4 pb-20">
        {" "}
        {/* pb-20 para espaço da BottomNav */}
        <Outlet /> {/* As rotas filhas são renderizadas aqui */}
      </main>
      <BottomNav />
    </div>
  );
}
