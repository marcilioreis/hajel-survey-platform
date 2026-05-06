import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { useGetCurrentUserQuery } from "./authApi";
import { useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials, setLoading } from "./authSlice";
import Skeleton from "../../components/common/Skeleton";

// Tipo esperado após normalização
interface NormalizedSession {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt?: string;
    updatedAt?: string;
    image?: string | null;
  };
  session: unknown;
  permissions?: string[];
  roles?: string[];
}

function normalizeSessionResponse(data: unknown): NormalizedSession | null {
  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;
  // Aceita tanto { user, session } diretamente quanto { data: { user, session } }
  const inner = obj.data ?? obj;
  if (typeof inner !== "object" || inner === null) return null;

  const { user, session, permissions, roles } = inner as Record<
    string,
    unknown
  >;
  if (
    user &&
    typeof user === "object" &&
    "id" in user &&
    "email" in user &&
    "name" in user &&
    "emailVerified" in user
  ) {
    return {
      user: user as NormalizedSession["user"],
      session,
      permissions: Array.isArray(permissions)
        ? (permissions as string[])
        : undefined,
      roles: Array.isArray(roles) ? (roles as string[]) : undefined,
    };
  }
  return null;
}

export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const {
    data: sessionData,
    error,
    isSuccess,
    isLoading: isQueryLoading, // primeira carga da query
  } = useGetCurrentUserQuery();

  // Sincroniza o loading global com o loading da query
  useEffect(() => {
    if (isQueryLoading) return; // ainda buscando, não faz nada

    if (isSuccess && sessionData) {
      const normalized = normalizeSessionResponse(sessionData);
      if (normalized) {
        dispatch(
          setCredentials({
            user: normalized.user,
            permissions: normalized.permissions,
            roles: normalized.roles,
          }),
        );
        return;
      }
    }

    // Chegou aqui: terminou de carregar mas não tem sessão válida
    dispatch(setLoading(false));
  }, [isSuccess, sessionData, error, isQueryLoading, dispatch]);

  // Enquanto a query estiver carregando OU o loading global estiver ativo, mostra esqueleto
  if (isQueryLoading || isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
