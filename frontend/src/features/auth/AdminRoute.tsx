import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { useGetCurrentUserQuery } from "./authApi";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";

export default function AdminRoute() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: sessionData, isLoading: isSessionLoading } =
    useGetCurrentUserQuery();

  // Ainda carregando sessão
  if (isAuthenticated && !user) {
    return <div className="p-4 text-center">Verificando permissões...</div>;
  }
  // Não autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (isSessionLoading) {
    return <div className="p-4 text-center">Carregando permissões...</div>;
  }

  // Verifica se o usuário tem permissão de administrador.
  // Ajuste conforme sua lógica de RBAC: pode ser uma role 'admin' ou permissão 'admin:access'
  const isAdmin =
    sessionData?.roles?.includes("admin") ||
    sessionData?.permissions?.includes("admin:access");

  if (!isAdmin) {
    return (
      <div className="p-4 text-center text-red-600">
        Acesso negado. Área restrita a administradores.
      </div>
    );
  }

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
