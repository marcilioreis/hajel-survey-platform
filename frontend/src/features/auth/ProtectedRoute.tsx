import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { useGetCurrentUserQuery } from "./authApi";
import { useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials, setLoading } from "./authSlice";
import Skeleton from "../../components/common/Skeleton";

function isSessionResponse(obj: unknown): obj is {
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
} {
  return (
    typeof obj === "object" && obj !== null && "user" in obj && "session" in obj
  );
}

export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { data: sessionData, error, isSuccess } = useGetCurrentUserQuery();

  useEffect(() => {
    if (isSuccess && sessionData && isSessionResponse(sessionData)) {
      dispatch(setCredentials({ user: sessionData.user }));
    } else if (error) {
      dispatch(setLoading(false));
    }
  }, [isSuccess, sessionData, error, dispatch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
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
