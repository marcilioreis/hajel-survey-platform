import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { useGetCurrentUserQuery } from "./authApi";
import { useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials, setLoading } from "./authSlice";

export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { data: user, error, isSuccess } = useGetCurrentUserQuery();

  useEffect(() => {
    if (isSuccess && user) {
      dispatch(setCredentials({ user }));
    } else if (error) {
      dispatch(setLoading(false));
    }
  }, [isSuccess, user, error, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
