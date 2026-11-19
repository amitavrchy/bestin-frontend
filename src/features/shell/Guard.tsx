import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/state";
export function Guard({ admin = false }: { admin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Opening your library…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
