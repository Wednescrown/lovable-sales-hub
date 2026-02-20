import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isCompanyAuthenticated, isUserSelected, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">A carregar...</span>
        </div>
      </div>
    );
  }

  if (!isCompanyAuthenticated) {
    return <Navigate to="/auth/company" replace />;
  }

  if (!isUserSelected) {
    return <Navigate to="/auth/user-select" replace />;
  }

  return <>{children}</>;
}
