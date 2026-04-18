import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center p-2 text-xs ${
      isActive ? "text-blue-600" : "text-gray-500"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16">
      <NavLink to="/dashboard" className={linkClass}>
        <span className="text-xl">📋</span>
        <span>Pesquisas</span>
      </NavLink>
      <NavLink to="/reports" className={linkClass}>
        <span className="text-xl">📊</span>
        <span>Relatórios</span>
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <span className="text-xl">👤</span>
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}
