import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  UserCircle,
  ShieldCheck,
  History,
  Users as UsersIcon,
  UserCheck,
  UserX,
  KeyRound,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

type AppRole = "admin" | "gestor" | "caixeiro" | "gestor_stock";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface CustomRole {
  id: string;
  name: string;
  label: string;
  description: string;
}

interface UserCustomRole {
  id: string;
  user_id: string;
  custom_role_id: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  caixeiro: "Caixeiro",
  gestor_stock: "Gestor de Stock",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-500/10 text-red-700 border-red-200",
  gestor: "bg-blue-500/10 text-blue-700 border-blue-200",
  caixeiro: "bg-green-500/10 text-green-700 border-green-200",
  gestor_stock: "bg-amber-500/10 text-amber-700 border-amber-200",
};

export default function Users() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    display_name: "",
    phone: "",
    role: "caixeiro" as AppRole,
    is_active: true,
    customRoleIds: [] as string[],
  });
  const [inviteData, setInviteData] = useState({
    email: "",
    full_name: "",
    display_name: "",
    phone: "",
    role: "caixeiro" as AppRole,
    customRoleIds: [] as string[],
  });
  const [isInviting, setIsInviting] = useState(false);
  const [resetPinDialog, setResetPinDialog] = useState(false);

  // Fetch profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, display_name, avatar_url, phone, branch_id, company_id, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Fetch activity log
  const { data: activityLog = [] } = useQuery({
    queryKey: ["activity_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  // Fetch custom roles
  const { data: customRoles = [] } = useQuery({
    queryKey: ["custom_roles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("custom_roles")
        .select("*")
        .order("label");
      if (error) throw error;
      return data as CustomRole[];
    },
  });

  // Fetch user custom role assignments
  const { data: userCustomRoles = [] } = useQuery({
    queryKey: ["user_custom_roles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_custom_roles")
        .select("*");
      if (error) throw error;
      return data as UserCustomRole[];
    },
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (params: {
      userId: string;
      profile: Partial<Profile>;
      role?: AppRole;
    }) => {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: params.profile.full_name,
          display_name: params.profile.display_name,
          phone: params.profile.phone,
          is_active: params.profile.is_active,
        })
        .eq("user_id", params.userId);
      if (profileError) throw profileError;

      if (params.role) {
        // Upsert role
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: params.userId, role: params.role },
            { onConflict: "user_id,role" }
          );
        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Utilizador actualizado com sucesso");
      setEditDialog(false);
    },
    onError: (err) => {
      toast.error("Erro ao actualizar: " + (err as Error).message);
    },
  });

  // Toggle active mutation
  const toggleActive = useMutation({
    mutationFn: async (params: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: params.isActive })
        .eq("user_id", params.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Estado actualizado");
    },
  });

  // Sync custom roles mutation
  const syncCustomRoles = useMutation({
    mutationFn: async ({ userId, customRoleIds }: { userId: string; customRoleIds: string[] }) => {
      // Delete existing
      const { error: delError } = await (supabase as any)
        .from("user_custom_roles")
        .delete()
        .eq("user_id", userId);
      if (delError) throw delError;
      // Insert new
      if (customRoleIds.length > 0) {
        const rows = customRoleIds.map((crId) => ({ user_id: userId, custom_role_id: crId }));
        const { error: insError } = await (supabase as any)
          .from("user_custom_roles")
          .insert(rows);
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_custom_roles"] });
    },
  });

  const getUserRole = (userId: string): AppRole => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role ?? "caixeiro";
  };

  const getUserCustomRoleIds = (userId: string): string[] =>
    userCustomRoles.filter((ucr) => ucr.user_id === userId).map((ucr) => ucr.custom_role_id);

  const getUserName = (userId: string): string => {
    const profile = profiles.find((p) => p.user_id === userId);
    return profile?.full_name ?? userId.slice(0, 8);
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.display_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone ?? "").includes(searchQuery)
  );

  const openEdit = (profile: Profile) => {
    setSelectedUser(profile);
    setFormData({
      full_name: profile.full_name,
      display_name: profile.display_name ?? "",
      phone: profile.phone ?? "",
      role: getUserRole(profile.user_id),
      is_active: profile.is_active,
      customRoleIds: getUserCustomRoleIds(profile.user_id),
    });
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!selectedUser) return;
    updateProfile.mutate({
      userId: selectedUser.user_id,
      profile: {
        full_name: formData.full_name,
        display_name: formData.display_name || null,
        phone: formData.phone || null,
        is_active: formData.is_active,
      },
      role: formData.role,
    });
    syncCustomRoles.mutate({
      userId: selectedUser.user_id,
      customRoleIds: formData.customRoleIds,
    });
  };

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.full_name) {
      toast.error("Email e nome completo são obrigatórios");
      return;
    }
    setIsInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(inviteData),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Utilizador criado com sucesso");
      setInviteDialog(false);
      setInviteData({ email: "", full_name: "", display_name: "", phone: "", role: "caixeiro", customRoleIds: [] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    } catch (err) {
      toast.error("Erro ao convidar: " + (err as Error).message);
    } finally {
      setIsInviting(false);
    }
  };

  const activeCount = profiles.filter((p) => p.is_active).length;
  const inactiveCount = profiles.filter((p) => !p.is_active).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Utilizadores</h1>
            <p className="text-sm text-muted-foreground">
              Gerir utilizadores, cargos e permissões da empresa
            </p>
          </div>
          <Button onClick={() => setInviteDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Utilizador
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-xs text-muted-foreground">Total Utilizadores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-red-500/10">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveCount}</p>
                <p className="text-xs text-muted-foreground">Inactivos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5">
              <UserCircle className="w-4 h-4" />
              Utilizadores
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Permissões por Cargo
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar utilizadores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Display</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          A carregar...
                        </TableCell>
                      </TableRow>
                    ) : filteredProfiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          {profiles.length === 0
                            ? "Nenhum utilizador registado. Os utilizadores são criados automaticamente ao registar-se."
                            : "Nenhum resultado encontrado."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProfiles.map((profile) => {
                        const role = getUserRole(profile.user_id);
                        return (
                          <TableRow key={profile.id}>
                            <TableCell className="font-medium">{profile.full_name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {profile.display_name ?? "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {profile.phone ?? "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className={ROLE_COLORS[role]}>
                                  {ROLE_LABELS[role]}
                                </Badge>
                                {getUserCustomRoleIds(profile.user_id).map((crId) => {
                                  const cr = customRoles.find((c) => c.id === crId);
                                  if (!cr) return null;
                                  return (
                                    <Badge key={crId} variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200">
                                      {cr.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={profile.is_active}
                                onCheckedChange={(checked) =>
                                  toggleActive.mutate({
                                    userId: profile.user_id,
                                    isActive: checked,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(profile)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Roles/Permissions Tab */}
          <TabsContent value="roles">
            <RolesPermissionsTab />
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas 100 Actividades</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  {activityLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      Nenhuma actividade registada ainda.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activityLog.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="p-1.5 rounded-md bg-muted">
                            <History className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {getUserName(log.user_id)} •{" "}
                              {new Date(log.created_at).toLocaleString("pt-AO")}
                            </p>
                            {log.details && (
                              <pre className="mt-1 text-[10px] text-muted-foreground bg-muted p-1.5 rounded overflow-auto max-h-20">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Utilizador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nome de Exibição</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, display_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, role: v as AppRole }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="caixeiro">Caixeiro</SelectItem>
                    <SelectItem value="gestor_stock">Gestor de Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {customRoles.length > 0 && (
                <div className="space-y-2">
                  <Label>Cargos Personalizados</Label>
                  <div className="space-y-2 rounded-lg border p-3">
                    {customRoles.map((cr) => (
                      <div key={cr.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-cr-${cr.id}`}
                          checked={formData.customRoleIds.includes(cr.id)}
                          onCheckedChange={(checked) => {
                            setFormData((f) => ({
                              ...f,
                              customRoleIds: checked
                                ? [...f.customRoleIds, cr.id]
                                : f.customRoleIds.filter((id) => id !== cr.id),
                            }));
                          }}
                        />
                        <label htmlFor={`edit-cr-${cr.id}`} className="text-sm cursor-pointer">
                          {cr.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Activo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((f) => ({ ...f, is_active: checked }))
                  }
                />
              </div>
              {/* Reset PIN */}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setResetPinDialog(true)}
                >
                  <KeyRound className="w-4 h-4" />
                  Redefinir PIN
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset PIN Confirmation */}
        <AlertDialog open={resetPinDialog} onOpenChange={setResetPinDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Redefinir PIN?</AlertDialogTitle>
              <AlertDialogDescription>
                O PIN actual de <strong>{selectedUser?.full_name}</strong> será eliminado. Na próxima vez que fizer login, será obrigado a definir um novo PIN.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (!selectedUser) return;
                  const { error } = await (supabase as any).rpc("reset_user_pin", {
                    _profile_id: selectedUser.id,
                  });
                  if (error) {
                    toast.error("Erro ao redefinir PIN: " + error.message);
                  } else {
                    toast.success("PIN redefinido com sucesso. O utilizador terá de definir um novo PIN.");
                  }
                  setResetPinDialog(false);
                }}
              >
                Redefinir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Invite Dialog */}
        <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Utilizador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={inviteData.full_name}
                  onChange={(e) => setInviteData((f) => ({ ...f, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome de Exibição</Label>
                <Input
                  value={inviteData.display_name}
                  onChange={(e) => setInviteData((f) => ({ ...f, display_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={inviteData.phone}
                  onChange={(e) => setInviteData((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(v) => setInviteData((f) => ({ ...f, role: v as AppRole }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="caixeiro">Caixeiro</SelectItem>
                    <SelectItem value="gestor_stock">Gestor de Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {customRoles.length > 0 && (
                <div className="space-y-2">
                  <Label>Cargos Personalizados</Label>
                  <div className="space-y-2 rounded-lg border p-3">
                    {customRoles.map((cr) => (
                      <div key={cr.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`invite-cr-${cr.id}`}
                          checked={inviteData.customRoleIds.includes(cr.id)}
                          onCheckedChange={(checked) => {
                            setInviteData((f) => ({
                              ...f,
                              customRoleIds: checked
                                ? [...f.customRoleIds, cr.id]
                                : f.customRoleIds.filter((id) => id !== cr.id),
                            }));
                          }}
                        />
                        <label htmlFor={`invite-cr-${cr.id}`} className="text-sm cursor-pointer">
                          {cr.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={isInviting}>
                {isInviting ? "A criar..." : "Criar Utilizador"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Sub-component for Roles & Permissions tab
function RolesPermissionsTab() {
  const { data: permissions = [] } = useQuery({
    queryKey: ["module_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_permissions")
        .select("*")
        .order("role");
      if (error) throw error;
      return data as {
        id: string;
        role: AppRole;
        module: string;
        can_access: boolean;
      }[];
    },
  });

  const modules = [...new Set(permissions.map((p) => p.module))];
  const roles: AppRole[] = ["admin", "gestor", "caixeiro", "gestor_stock"];

  const MODULE_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    pos: "Ponto de Venda",
    products: "Produtos",
    categories: "Categorias",
    labels: "Etiquetas",
    stock_count: "Contagem de Stock",
    stock_adjustment: "Ajuste de Stock",
    finances: "Finanças",
    users: "Utilizadores",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Matriz de Permissões por Cargo</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                {roles.map((role) => (
                  <TableHead key={role} className="text-center">
                    <Badge variant="outline" className={ROLE_COLORS[role]}>
                      {ROLE_LABELS[role]}
                    </Badge>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((mod) => (
                <TableRow key={mod}>
                  <TableCell className="font-medium">
                    {MODULE_LABELS[mod] ?? mod}
                  </TableCell>
                  {roles.map((role) => {
                    const perm = permissions.find(
                      (p) => p.role === role && p.module === mod
                    );
                    return (
                      <TableCell key={role} className="text-center">
                        {perm?.can_access ? (
                          <Badge className="bg-green-500/10 text-green-700 border-green-200" variant="outline">
                            ✓
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-700 border-red-200" variant="outline">
                            ✗
                          </Badge>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
