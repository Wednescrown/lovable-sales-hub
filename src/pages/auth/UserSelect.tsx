import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, AlertCircle, Lock, LogOut, Store } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  company_id: string | null;
  branch_id: string | null;
}

export default function UserSelect() {
  const { isCompanyAuthenticated, isUserSelected, companyId, selectUser, closeCompany, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [validating, setValidating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, display_name, avatar_url, is_active, company_id, branch_id")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("full_name");

      if (!error && data) setProfiles(data);
      setLoading(false);
    };

    fetchProfiles();
  }, [companyId]);

  // Redirects after hooks
  if (!isCompanyAuthenticated) return <Navigate to="/auth/company" replace />;
  if (isUserSelected) return <Navigate to="/" replace />;

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setPin("");
    setPinError("");
  };

  const handleValidatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !pin) return;

    setValidating(true);
    setPinError("");

    try {
      const { data, error } = await supabase.rpc("validate_user_pin", {
        _profile_id: selectedProfile.id,
        _pin: pin,
      });

      if (error) {
        setPinError("Erro ao validar PIN. Tente novamente.");
        return;
      }

      if (!data) {
        setPinError("PIN incorrecto");
        return;
      }

      selectUser(selectedProfile);
      navigate("/");
    } catch {
      setPinError("Erro inesperado");
    } finally {
      setValidating(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Seleccionar Utilizador</h1>
          <p className="text-sm text-muted-foreground">Escolha o seu perfil para continuar</p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Utilizadores Activos</CardTitle>
            <CardDescription>Toque no seu perfil e insira o PIN</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum utilizador encontrado para esta empresa
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-foreground leading-tight text-center">
                      {profile.display_name || profile.full_name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={closeCompany} className="text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4 mr-1" />
            Fechar Empresa
          </Button>
        </div>

        <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {selectedProfile ? getInitials(selectedProfile.full_name) : ""}
                  </AvatarFallback>
                </Avatar>
              </div>
              <DialogTitle>{selectedProfile?.display_name || selectedProfile?.full_name}</DialogTitle>
              <DialogDescription>Insira o seu PIN para aceder ao sistema</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleValidatePin} className="space-y-4">
              {pinError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  autoFocus
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={validating || !pin}>
                {validating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />A validar...</>
                ) : "Confirmar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
