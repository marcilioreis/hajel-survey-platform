import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { authClient } from "../../lib/auth";
import logo from "../../assets/logo.png";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await authClient.signOut();
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <img src={logo} alt="Retrato Pesquisas" className="h-8 w-auto" />
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-gray-600 hidden sm:inline">
              Olá, {user.name?.split(" ")[0]}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
            title="Sair"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
}
