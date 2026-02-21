import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CompanyLogin from "./pages/auth/CompanyLogin";
import ResetPassword from "./pages/auth/ResetPassword";
import UserSelect from "./pages/auth/UserSelect";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import StockAdjustment from "./pages/StockAdjustment";
import StockCount from "./pages/StockCount";
import POS from "./pages/POS";
import Financas from "./pages/Financas";
import Labels from "./pages/Labels";
import Users from "./pages/Users";
import Funcoes from "./pages/Funcoes";
import Branches from "./pages/Branches";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import GoodsReceived from "./pages/GoodsReceived";
import StockAvailable from "./pages/StockAvailable";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/auth/company" element={<CompanyLogin />} />
            <Route path="/auth/user-select" element={<UserSelect />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><StockAdjustment /></ProtectedRoute>} />
            <Route path="/contagem-inventario" element={<ProtectedRoute><StockCount /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
            <Route path="/declaracao" element={<ProtectedRoute><Financas /></ProtectedRoute>} />
            <Route path="/etiquetas" element={<ProtectedRoute><Labels /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/funcoes" element={<ProtectedRoute><Funcoes /></ProtectedRoute>} />
            <Route path="/filiais" element={<ProtectedRoute><Branches /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/lista-compras" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
            <Route path="/recebimento" element={<ProtectedRoute><GoodsReceived /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><StockAvailable /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
