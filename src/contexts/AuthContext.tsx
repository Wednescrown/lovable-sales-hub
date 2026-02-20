import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface ActiveUser {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  company_id: string | null;
  branch_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  companyId: string | null;
  activeUser: ActiveUser | null;
  isCompanyAuthenticated: boolean;
  isUserSelected: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  selectUser: (user: ActiveUser) => void;
  switchUser: () => void;
  closeCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ActiveUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listen for auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          // Fetch company_id from profile
          const { data } = await supabase.rpc("get_user_company_id", {
            _user_id: newSession.user.id,
          });
          if (data) {
            setCompanyId(data);
            localStorage.setItem("angopos_company_id", data);
          }
        } else {
          setCompanyId(null);
          setActiveUser(null);
          localStorage.removeItem("angopos_company_id");
          localStorage.removeItem("angopos_active_user");
        }
        setIsLoading(false);
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!existingSession) {
        setIsLoading(false);
      }
      // onAuthStateChange will handle the rest
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check admin role when activeUser changes
  useEffect(() => {
    if (!activeUser) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: activeUser.user_id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [activeUser]);

  const selectUser = useCallback((user: ActiveUser) => {
    setActiveUser(user);
    localStorage.setItem("angopos_active_user", JSON.stringify(user));
  }, []);

  const switchUser = useCallback(() => {
    setActiveUser(null);
    localStorage.removeItem("angopos_active_user");
  }, []);

  const closeCompany = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCompanyId(null);
    setActiveUser(null);
    setIsAdmin(false);
    localStorage.removeItem("angopos_company_id");
    localStorage.removeItem("angopos_active_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        companyId,
        activeUser,
        isCompanyAuthenticated: !!session,
        isUserSelected: !!activeUser,
        isLoading,
        isAdmin,
        selectUser,
        switchUser,
        closeCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
