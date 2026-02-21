import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Loader2, AlertCircle, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CompanyLogin() {
  const { isCompanyAuthenticated, isUserSelected } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const navigate = useNavigate();

  if (isCompanyAuthenticated && isUserSelected) return <Navigate to="/" replace />;
  if (isCompanyAuthenticated) return <Navigate to="/auth/user-select" replace />;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCompanyName("");
    setFullName("");
    setPhone("");
    setError("");
    setSuccess("");
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message === "Invalid login credentials" ? "Email ou senha incorrectos" : authError.message);
        return;
      }
      navigate("/auth/user-select");
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");
    setForgotLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setForgotSuccess("Email de recuperação enviado! Verifique a sua caixa de entrada.");
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    if (companyName.trim().length < 2) {
      setError("O nome da empresa deve ter pelo menos 2 caracteres");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("O nome do administrador deve ter pelo menos 2 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            display_name: fullName.trim().split(" ")[0],
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!signUpData.user) {
        setError("Erro ao criar conta. Tente novamente.");
        return;
      }

      // Register company via SECURITY DEFINER function (bypasses RLS)
      const { error: regError } = await supabase.rpc("register_company" as any, {
        _user_id: signUpData.user.id,
        _company_name: companyName.trim(),
        _company_email: email.trim(),
        _company_phone: phone.trim() || null,
      });

      if (regError) {
        setError("Conta criada, mas erro ao registar empresa: " + regError.message);
        return;
      }

      setSuccess("Empresa registada com sucesso! Verifique o seu email para confirmar a conta, ou faça login directamente.");
      setMode("login");
      setEmail(email);
      setPassword("");
      setConfirmPassword("");
      setCompanyName("");
      setFullName("");
      setPhone("");
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/images/bg-angopos.jpeg" alt="AngoPOS" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-2xl font-bold text-foreground">AngoPos</h1>
          <p className="text-sm text-muted-foreground">Gestão & Ponto de Venda</p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">
              {forgotMode ? "Recuperar Senha" : mode === "login" ? "Abrir Empresa" : "Registar Nova Empresa"}
            </CardTitle>
            <CardDescription>
              {forgotMode
                ? "Introduza o email para receber o link de recuperação"
                : mode === "login"
                ? "Introduza as credenciais da empresa para iniciar a sessão"
                : "Preencha os dados para criar uma nova empresa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "login" && !forgotMode ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 text-primary text-sm">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email da Empresa</Label>
                  <Input id="email" type="email" placeholder="empresa@exemplo.co.ao" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />A entrar...</> : "Entrar"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => { setForgotMode(true); setError(""); setForgotEmail(email); }} className="text-sm text-muted-foreground hover:text-primary hover:underline">
                    Esqueceu a senha?
                  </button>
                </div>
              </form>
            ) : mode === "login" && forgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {forgotSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 text-primary text-sm">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email da Empresa</Label>
                  <Input id="forgotEmail" type="email" placeholder="empresa@exemplo.co.ao" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoComplete="email" />
                </div>
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? <><Loader2 className="w-4 h-4 animate-spin" />A enviar...</> : "Enviar Link de Recuperação"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => { setForgotMode(false); setError(""); setForgotSuccess(""); }} className="text-sm text-muted-foreground hover:text-primary hover:underline">
                    Voltar ao login
                  </button>
                </div>
              </form>
            ) : mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input id="companyName" type="text" placeholder="Minha Empresa Lda." value={companyName} onChange={(e) => setCompanyName(e.target.value)} required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome do Administrador</Label>
                  <Input id="fullName" type="text" placeholder="João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <Input id="regEmail" type="email" placeholder="empresa@exemplo.co.ao" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input id="phone" type="tel" placeholder="+244 9XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regPassword">Senha</Label>
                  <Input id="regPassword" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />A registar...</> : <><Building2 className="w-4 h-4" />Registar Empresa</>}
                </Button>
              </form>
            ) : null}

            {!forgotMode && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode(mode === "login" ? "register" : "login"); resetForm(); setForgotMode(false); setForgotSuccess(""); }}
                  className="text-sm text-primary hover:underline"
                >
                  {mode === "login" ? "Não tem empresa? Registar nova empresa" : "Já tem empresa? Fazer login"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {mode === "login"
            ? "A sessão da empresa fica guardada neste dispositivo"
            : "Ao registar, será criado o primeiro utilizador como administrador"}
        </p>
        <p className="text-center text-[10px] text-muted-foreground mt-4">
          © {new Date().getFullYear()} Wednescrown Enterprise. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
