import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { useGetCurrentUserQuery } from "./authApi";
import { useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials, setLoading } from "./authSlice";
import Skeleton from "../../components/common/Skeleton";

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
