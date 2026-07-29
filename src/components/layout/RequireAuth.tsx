import { Navigate, useLocation } from "react-router-dom";
import { useDeal } from "@/context/DealContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useDeal();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading deal workspace…</div>
    );
  }
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}
