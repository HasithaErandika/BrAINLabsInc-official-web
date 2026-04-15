import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, user, _hasHydrated } = useAuth();

  // If the store hasn't hydrated yet, don't decide on redirection
  if (!_hasHydrated) {
    return null; // Or a minimal loading spinner
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Research assistants who haven't selected a supervisor yet
  // must be redirected until they complete setup (and admin approves)
  if (
    user?.role === "research_assistant" &&
    !(user as any).assigned_by_researcher_id &&
    user?.approval_status === "PENDING_ADMIN"
  ) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/setup")) {
      return <Navigate to="/setup/supervisor" replace />;
    }
  }

  return <>{children}</>;
}

