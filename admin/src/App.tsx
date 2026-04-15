import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleGuard } from "./components/auth/RoleGuard";
import { AppLayout } from "./components/layout/AppLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SelectSupervisor from "./pages/auth/SelectSupervisor";
import Dashboard from "./pages/dashboard/Dashboard";
import Publications from "./pages/content/Publications";
import Blog from "./pages/content/Blog";
import Events from "./pages/content/Events";
import Grants from "./pages/content/Grants";
import Projects from "./pages/content/Projects";
import Tutorials from "./pages/content/Tutorials";
import MemberManagement from "./pages/dashboard/MemberManagement";
import Account from "./pages/account/Account";
import Settings from "./pages/settings/Settings";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/** Listens for the 'brain:session-expired' event dispatched by the Axios interceptor
 *  and navigates to /login without a full page reload. Must live inside BrowserRouter. */
function SessionHandler() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handle = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('brain:session-expired', handle);
    return () => window.removeEventListener('brain:session-expired', handle);
  }, [logout, navigate]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionHandler />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/setup/supervisor"
            element={
              <ProtectedRoute>
                <SelectSupervisor />
              </ProtectedRoute>
            }
          />

          {/* Protected admin routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="publications" element={<Publications />} />
            <Route path="blog" element={<Blog />} />
            
            {/* Researcher and Admin only paths */}
            <Route path="events" element={<RoleGuard allowedRoles={["admin", "researcher"]}><Events /></RoleGuard>} />
            <Route path="grants" element={<RoleGuard allowedRoles={["admin", "researcher"]}><Grants /></RoleGuard>} />
            
            <Route path="projects" element={<Projects />} />
            <Route path="tutorials" element={<Tutorials />} />
            
            <Route
              path="dashboard/members"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <MemberManagement />
                </RoleGuard>
              }
            />
            
            <Route path="account" element={<Account />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Navigate to="/account" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
