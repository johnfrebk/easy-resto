import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import TablesPage from "./pages/TablesPage";
import MenuPage from "./pages/MenuPage";
import InventoryPage from "./pages/InventoryPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import BackupPage from "./pages/BackupPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<TablesPage />} />
              <Route path="/menu" element={<AdminRoute><MenuPage /></AdminRoute>} />
              <Route path="/inventario" element={<AdminRoute><InventoryPage /></AdminRoute>} />
              <Route path="/reportes" element={<ReportsPage />} />
              <Route path="/usuarios" element={<AdminRoute><UsersPage /></AdminRoute>} />
              <Route path="/backup" element={<AdminRoute><BackupPage /></AdminRoute>} />
              <Route path="/configuracion" element={<AdminRoute><SettingsPage /></AdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
