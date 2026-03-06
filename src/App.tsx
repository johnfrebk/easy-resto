import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn, isAdmin } from "@/lib/auth";
import Layout from "./components/Layout";
import TablesPage from "./pages/TablesPage";
import MenuPage from "./pages/MenuPage";
import InventoryPage from "./pages/InventoryPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<TablesPage />} />
            <Route path="/menu" element={<AdminRoute><MenuPage /></AdminRoute>} />
            <Route path="/inventario" element={<AdminRoute><InventoryPage /></AdminRoute>} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/usuarios" element={<AdminRoute><UsersPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
