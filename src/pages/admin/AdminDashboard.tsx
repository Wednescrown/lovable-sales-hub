import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, LogOut, Building2, Users, CreditCard, Search,
  Ban, PlayCircle, XCircle, Loader2, Package, BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  max_users: number;
  max_branches: number;
  max_products: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  suspended_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
}

type SubscriptionAction = "activate" | "suspend" | "cancel";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: SubscriptionAction; company: Company | null }>({ open: false, action: "activate", company: null });
  const [actionPlanId, setActionPlanId] = useState("");
  const [actionNotes, setActionNotes] = useState("");

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin"); return; }
      const { data } = await (supabase as any).from("platform_admins").select("id").eq("user_id", user.id).maybeSingle();
      if (!data) { navigate("/admin"); return; }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [navigate]);

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["admin_companies"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
    enabled: isAdmin === true,
  });

  // Fetch plans
  const { data: plans = [] } = useQuery({
    queryKey: ["admin_plans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("subscription_plans").select("*").order("sort_order");
      if (error) throw error;
      return data as Plan[];
    },
    enabled: isAdmin === true,
  });

  // Fetch subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("company_subscriptions").select("*");
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: isAdmin === true,
  });

  // Fetch user counts per company
  const { data: profileCounts = [] } = useQuery({
    queryKey: ["admin_profile_counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("profiles").select("company_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data as any[]).forEach((p: any) => { if (p.company_id) counts[p.company_id] = (counts[p.company_id] || 0) + 1; });
      return counts;
    },
    enabled: isAdmin === true,
  });

  // Upsert subscription mutation
  const upsertSubscription = useMutation({
    mutationFn: async ({ companyId, planId, status, notes }: { companyId: string; planId: string; status: string; notes: string }) => {
      const existing = subscriptions.find((s) => s.company_id === companyId);
      const payload: any = {
        company_id: companyId,
        plan_id: planId,
        status,
        notes: notes || null,
        ...(status === "active" ? { starts_at: new Date().toISOString(), suspended_at: null, cancelled_at: null } : {}),
        ...(status === "suspended" ? { suspended_at: new Date().toISOString() } : {}),
        ...(status === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}),
      };
      if (existing) {
        const { error } = await (supabase as any).from("company_subscriptions").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("company_subscriptions").insert(payload);
        if (error) throw error;
      }
      // Update company active status
      const companyActive = status === "active" || status === "trial";
      await (supabase as any).from("companies").update({ is_active: companyActive }).eq("id", companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin_companies"] });
      toast.success("Assinatura actualizada com sucesso");
      setActionDialog({ open: false, action: "activate", company: null });
      setActionPlanId("");
      setActionNotes("");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const getSubscription = (companyId: string) => subscriptions.find((s) => s.company_id === companyId);
  const getPlanName = (planId: string) => plans.find((p) => p.id === planId)?.name || "—";

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    trial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    expired: "bg-muted text-muted-foreground",
  };
  const statusLabels: Record<string, string> = {
    active: "Activo", trial: "Trial", suspended: "Suspenso", cancelled: "Cancelado", expired: "Expirado",
  };

  const openAction = (action: SubscriptionAction, company: Company) => {
    const sub = getSubscription(company.id);
    setActionPlanId(sub?.plan_id || plans[0]?.id || "");
    setActionNotes("");
    setActionDialog({ open: true, action, company });
  };

  const confirmAction = () => {
    if (!actionDialog.company) return;
    upsertSubscription.mutate({
      companyId: actionDialog.company.id,
      planId: actionPlanId,
      status: actionDialog.action === "activate" ? "active" : actionDialog.action === "suspend" ? "suspended" : "cancelled",
      notes: actionNotes,
    });
  };

  const filteredCompanies = companies.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "all") return matchSearch;
    if (statusFilter === "no_plan") return matchSearch && !getSubscription(c.id);
    const sub = getSubscription(c.id);
    return matchSearch && sub?.status === statusFilter;
  });

  // KPIs
  const totalCompanies = companies.length;
  const activeCompanies = subscriptions.filter((s) => s.status === "active" || s.status === "trial").length;
  const suspendedCompanies = subscriptions.filter((s) => s.status === "suspended").length;
  const totalUsers = Object.values(profileCounts as Record<string, number>).reduce((a: number, b: number) => a + b, 0);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const actionTitles: Record<SubscriptionAction, string> = {
    activate: "Activar Empresa",
    suspend: "Suspender Empresa",
    cancel: "Cancelar Empresa",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">AngoPos — Super Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <div><p className="text-2xl font-bold">{totalCompanies}</p><p className="text-xs text-muted-foreground">Total Empresas</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-green-600" />
            <div><p className="text-2xl font-bold">{activeCompanies}</p><p className="text-xs text-muted-foreground">Activas</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <Ban className="w-8 h-8 text-yellow-600" />
            <div><p className="text-2xl font-bold">{suspendedCompanies}</p><p className="text-xs text-muted-foreground">Suspensas</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-info" />
            <div><p className="text-2xl font-bold">{totalUsers}</p><p className="text-xs text-muted-foreground">Total Utilizadores</p></div>
          </CardContent></Card>
        </div>

        {/* Plans overview */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Planos de Assinatura</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const subCount = subscriptions.filter((s) => s.plan_id === plan.id && (s.status === "active" || s.status === "trial")).length;
              return (
                <Card key={plan.id} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {plan.name}
                      <Badge variant="secondary" className="text-xs">{subCount} empresa{subCount !== 1 ? "s" : ""}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-2xl font-bold">{plan.price.toLocaleString("pt-AO")} Kz<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Até {plan.max_users} utilizadores</p>
                      <p>Até {plan.max_branches} filiais</p>
                      <p>Até {plan.max_products.toLocaleString()} produtos</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(plan.features as string[]).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Companies table */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Building2 className="w-5 h-5" /> Empresas Cadastradas</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Pesquisar empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="no_plan">Sem Plano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Utilizadores</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma empresa encontrada</TableCell></TableRow>
                ) : filteredCompanies.map((company) => {
                  const sub = getSubscription(company.id);
                  const status = sub?.status || "no_plan";
                  const userCount = (profileCounts as Record<string, number>)[company.id] || 0;
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{company.email}</TableCell>
                      <TableCell>{sub ? getPlanName(sub.plan_id) : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-muted text-muted-foreground"}`}>
                          {statusLabels[status] || "Sem Plano"}
                        </span>
                      </TableCell>
                      <TableCell>{userCount}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(company.created_at).toLocaleDateString("pt-AO")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(!sub || sub.status !== "active") && (
                            <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => openAction("activate", company)}>
                              <PlayCircle className="w-3.5 h-3.5 mr-1" /> Activar
                            </Button>
                          )}
                          {sub?.status === "active" && (
                            <Button size="sm" variant="outline" className="text-yellow-700 border-yellow-300 hover:bg-yellow-50" onClick={() => openAction("suspend", company)}>
                              <Ban className="w-3.5 h-3.5 mr-1" /> Suspender
                            </Button>
                          )}
                          {sub && sub.status !== "cancelled" && (
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => openAction("cancel", company)}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => { if (!open) setActionDialog({ ...actionDialog, open: false }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionTitles[actionDialog.action]}</DialogTitle>
            <DialogDescription>
              {actionDialog.action === "activate" && `Atribuir um plano e activar a empresa "${actionDialog.company?.name}".`}
              {actionDialog.action === "suspend" && `Suspender temporariamente o acesso da empresa "${actionDialog.company?.name}".`}
              {actionDialog.action === "cancel" && `Cancelar definitivamente a assinatura da empresa "${actionDialog.company?.name}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.action === "activate" && (
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={actionPlanId} onValueChange={setActionPlanId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plano" /></SelectTrigger>
                  <SelectContent>
                    {plans.filter((p) => p.is_active).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString("pt-AO")} Kz/mês</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea placeholder="Motivo ou observações..." value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ ...actionDialog, open: false })}>Cancelar</Button>
            <Button
              onClick={confirmAction}
              disabled={upsertSubscription.isPending || (actionDialog.action === "activate" && !actionPlanId)}
              variant={actionDialog.action === "cancel" ? "destructive" : "default"}
            >
              {upsertSubscription.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
