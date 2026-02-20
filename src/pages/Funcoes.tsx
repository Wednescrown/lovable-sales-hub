import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  UserCog,
  Crown,
  Briefcase,
  Monitor,
  Package,
  Plus,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { AddModuleDialog } from "@/components/funcoes/AddModuleDialog";
import { RemoveModuleDialog } from "@/components/funcoes/RemoveModuleDialog";
import { EditRoleDialog } from "@/components/funcoes/EditRoleDialog";
import { CreateCustomRoleDialog } from "@/components/funcoes/CreateCustomRoleDialog";
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

type AppRole = "admin" | "gestor" | "caixeiro" | "gestor_stock";

interface ModulePermission {
  id: string;
  role: AppRole;
  module: string;
  can_access: boolean;
}

interface CustomRole {
  id: string;
  company_id: string;
  name: string;
  label: string;
  description: string;
  created_at: string;
}

interface CustomRolePermission {
  id: string;
  custom_role_id: string;
  module: string;
  can_access: boolean;
}

const DEFAULT_ROLE_META: Record<AppRole, { label: string; description: string; icon: React.ElementType; color: string }> = {
  admin: {
    label: "Administrador",
    description: "Acesso total ao sistema, gestão de empresa e utilizadores",
    icon: Crown,
    color: "bg-red-500/10 text-red-700 border-red-200",
  },
  gestor: {
    label: "Gestor",
    description: "Acesso a relatórios, stock e finanças, sem gestão de utilizadores",
    icon: Briefcase,
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  caixeiro: {
    label: "Caixeiro / Operador",
    description: "Acesso apenas ao POS e declaração financeira",
    icon: Monitor,
    color: "bg-green-500/10 text-green-700 border-green-200",
  },
  gestor_stock: {
    label: "Gestor de Stock",
    description: "Acesso a produtos, inventário e etiquetas",
    icon: Package,
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
};

const ROLES: AppRole[] = ["admin", "gestor", "caixeiro", "gestor_stock"];

export default function Funcoes() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [selectedCustomRole, setSelectedCustomRole] = useState<string | null>(null);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [removeModule, setRemoveModule] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AppRole | null>(null);
  const [createCustomRoleOpen, setCreateCustomRoleOpen] = useState(false);
  const [editCustomRole, setEditCustomRole] = useState<CustomRole | null>(null);
  const [deleteCustomRole, setDeleteCustomRole] = useState<CustomRole | null>(null);

  const [roleOverrides, setRoleOverrides] = useState<Partial<Record<AppRole, { label: string; description: string }>>>({});

  const getRoleMeta = (role: AppRole) => ({
    ...DEFAULT_ROLE_META[role],
    ...roleOverrides[role],
  });

  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({
    dashboard: "Dashboard",
    pos: "Ponto de Venda",
    products: "Produtos",
    categories: "Categorias",
    labels: "Etiquetas",
    stock_count: "Contagem de Stock",
    stock_adjustment: "Ajuste de Stock",
    finances: "Finanças",
    users: "Utilizadores",
  });

  // --- Queries ---
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["module_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_permissions")
        .select("*")
        .order("module");
      if (error) throw error;
      return data as ModulePermission[];
    },
  });

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

  const { data: customRolePermissions = [] } = useQuery({
    queryKey: ["custom_role_permissions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("custom_role_permissions")
        .select("*");
      if (error) throw error;
      return data as CustomRolePermission[];
    },
  });

  // --- Mutations: base permissions ---
  const togglePermission = useMutation({
    mutationFn: async (params: { id: string; can_access: boolean }) => {
      const { error } = await supabase
        .from("module_permissions")
        .update({ can_access: params.can_access })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module_permissions"] });
      toast.success("Permissão actualizada");
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const addModuleMutation = useMutation({
    mutationFn: async ({ slug, label }: { slug: string; label: string }) => {
      // Add to base roles
      const rows = ROLES.map((role) => ({
        module: slug,
        role,
        can_access: role === "admin",
      }));
      const { error } = await supabase.from("module_permissions").insert(rows);
      if (error) throw error;
      // Also add to all custom roles
      if (customRoles.length > 0) {
        const customRows = customRoles.map((cr) => ({
          custom_role_id: cr.id,
          module: slug,
          can_access: false,
        }));
        const { error: crError } = await (supabase as any)
          .from("custom_role_permissions")
          .insert(customRows);
        if (crError) throw crError;
      }
      return { slug, label };
    },
    onSuccess: ({ slug, label }) => {
      queryClient.invalidateQueries({ queryKey: ["module_permissions"] });
      queryClient.invalidateQueries({ queryKey: ["custom_role_permissions"] });
      setModuleLabels((prev) => ({ ...prev, [slug]: label }));
      setAddModuleOpen(false);
      toast.success(`Módulo "${label}" adicionado`);
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const removeModuleMutation = useMutation({
    mutationFn: async (mod: string) => {
      const { error } = await supabase.from("module_permissions").delete().eq("module", mod);
      if (error) throw error;
      // Also remove from custom roles
      const { error: crError } = await (supabase as any)
        .from("custom_role_permissions")
        .delete()
        .eq("module", mod);
      if (crError) throw crError;
      return mod;
    },
    onSuccess: (mod) => {
      queryClient.invalidateQueries({ queryKey: ["module_permissions"] });
      queryClient.invalidateQueries({ queryKey: ["custom_role_permissions"] });
      setRemoveModule(null);
      toast.success(`Módulo "${moduleLabels[mod] ?? mod}" removido`);
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  // --- Mutations: custom roles ---
  const createCustomRoleMutation = useMutation({
    mutationFn: async ({ name, label, description }: { name: string; label: string; description: string }) => {
      // Get company_id from current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();
      if (!profile?.company_id) throw new Error("Sem empresa associada");

      const { data: newRole, error } = await (supabase as any)
        .from("custom_roles")
        .insert({ company_id: profile.company_id, name, label, description })
        .select()
        .single();
      if (error) throw error;

      // Create permissions for all existing modules (all off by default)
      if (modules.length > 0) {
        const permRows = modules.map((mod) => ({
          custom_role_id: newRole.id,
          module: mod,
          can_access: false,
        }));
        const { error: permError } = await (supabase as any)
          .from("custom_role_permissions")
          .insert(permRows);
        if (permError) throw permError;
      }

      return newRole as CustomRole;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      queryClient.invalidateQueries({ queryKey: ["custom_role_permissions"] });
      setCreateCustomRoleOpen(false);
      toast.success(`Cargo "${role.label}" criado`);
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const updateCustomRoleMutation = useMutation({
    mutationFn: async ({ id, label, description }: { id: string; label: string; description: string }) => {
      const { error } = await (supabase as any)
        .from("custom_roles")
        .update({ label, description })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      setEditCustomRole(null);
      toast.success("Cargo actualizado");
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const deleteCustomRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("custom_roles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
      queryClient.invalidateQueries({ queryKey: ["custom_role_permissions"] });
      setDeleteCustomRole(null);
      setSelectedCustomRole(null);
      toast.success("Cargo removido");
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const toggleCustomPermission = useMutation({
    mutationFn: async (params: { id: string; can_access: boolean }) => {
      const { error } = await (supabase as any)
        .from("custom_role_permissions")
        .update({ can_access: params.can_access })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_role_permissions"] });
      toast.success("Permissão actualizada");
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  // --- Derived data ---
  const modules = [...new Set(permissions.map((p) => p.module))];

  const getRolePermissions = (role: AppRole) => permissions.filter((p) => p.role === role);
  const getPermission = (role: AppRole, module: string) =>
    permissions.find((p) => p.role === role && p.module === module);
  const getCustomPermission = (customRoleId: string, module: string) =>
    customRolePermissions.find((p) => p.custom_role_id === customRoleId && p.module === module);

  const activeCustomRole = customRoles.find((cr) => cr.id === selectedCustomRole);

  const handleSelectRole = (role: AppRole) => {
    setSelectedCustomRole(null);
    setSelectedRole(selectedRole === role ? null : role);
  };

  const handleSelectCustomRole = (id: string) => {
    setSelectedRole(null);
    setSelectedCustomRole(selectedCustomRole === id ? null : id);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Funções & Permissões
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerir cargos e controlar acesso aos módulos do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateCustomRoleOpen(true)}>
              <Users className="w-4 h-4" />
              Criar Cargo
            </Button>
            <Button onClick={() => setAddModuleOpen(true)}>
              <Plus className="w-4 h-4" />
              Adicionar Módulo
            </Button>
          </div>
        </div>

        {/* Base Role Cards */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Cargos Base</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((role) => {
              const meta = getRoleMeta(role);
              const Icon = meta.icon;
              const rolePerms = getRolePermissions(role);
              const activeModules = rolePerms.filter((p) => p.can_access).length;
              const isSelected = selectedRole === role;

              return (
                <Card
                  key={role}
                  className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                  onClick={() => handleSelectRole(role)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm">{meta.label}</CardTitle>
                      </div>
                      {role !== "admin" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditRole(role); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <CardDescription className="text-xs mt-1">{meta.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{activeModules}</span> de {modules.length} módulos activos
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Custom Role Cards */}
        {customRoles.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Cargos Personalizados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {customRoles.map((cr) => {
                const crPerms = customRolePermissions.filter((p) => p.custom_role_id === cr.id);
                const activeCount = crPerms.filter((p) => p.can_access).length;
                const isSelected = selectedCustomRole === cr.id;

                return (
                  <Card
                    key={cr.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleSelectCustomRole(cr.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-700 border-purple-200">
                            <Users className="w-4 h-4" />
                          </div>
                          <CardTitle className="text-sm">{cr.label}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditCustomRole(cr); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteCustomRole(cr); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-xs mt-1">{cr.description || "Cargo personalizado"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{activeCount}</span> de {modules.length} módulos activos
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              {selectedRole
                ? `Permissões — ${getRoleMeta(selectedRole).label}`
                : activeCustomRole
                ? `Permissões — ${activeCustomRole.label}`
                : "Matriz de Permissões"}
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedRole || activeCustomRole
                ? "Alterne os módulos que este cargo pode aceder"
                : "Seleccione um cargo acima para editar ou veja a matriz completa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-10">A carregar...</p>
            ) : selectedRole ? (
              /* Single base role editing */
              <div className="space-y-3">
                {modules.map((mod) => {
                  const perm = getPermission(selectedRole, mod);
                  if (!perm) return null;
                  return (
                    <div key={mod} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <p className="text-sm font-medium">{moduleLabels[mod] ?? mod}</p>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setRemoveModule(mod)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Switch
                          checked={perm.can_access}
                          disabled={selectedRole === "admin"}
                          onCheckedChange={(checked) => togglePermission.mutate({ id: perm.id, can_access: checked })}
                        />
                      </div>
                    </div>
                  );
                })}
                {selectedRole === "admin" && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    O Administrador tem acesso total — as permissões não podem ser alteradas.
                  </p>
                )}
              </div>
            ) : activeCustomRole ? (
              /* Custom role editing */
              <div className="space-y-3">
                {modules.map((mod) => {
                  const perm = getCustomPermission(activeCustomRole.id, mod);
                  return (
                    <div key={mod} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <p className="text-sm font-medium">{moduleLabels[mod] ?? mod}</p>
                      <div className="flex items-center gap-2">
                        {perm ? (
                          <Switch
                            checked={perm.can_access}
                            onCheckedChange={(checked) => toggleCustomPermission.mutate({ id: perm.id, can_access: checked })}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Full matrix */
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      {ROLES.map((role) => (
                        <TableHead key={role} className="text-center">
                          <Badge variant="outline" className={getRoleMeta(role).color}>
                            {getRoleMeta(role).label}
                          </Badge>
                        </TableHead>
                      ))}
                      {customRoles.map((cr) => (
                        <TableHead key={cr.id} className="text-center">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200">
                            {cr.label}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod) => (
                      <TableRow key={mod}>
                        <TableCell className="font-medium">{moduleLabels[mod] ?? mod}</TableCell>
                        {ROLES.map((role) => {
                          const perm = getPermission(role, mod);
                          return (
                            <TableCell key={role} className="text-center">
                              {perm ? (
                                <Switch
                                  checked={perm.can_access}
                                  disabled={role === "admin"}
                                  onCheckedChange={(checked) => togglePermission.mutate({ id: perm.id, can_access: checked })}
                                />
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          );
                        })}
                        {customRoles.map((cr) => {
                          const perm = getCustomPermission(cr.id, mod);
                          return (
                            <TableCell key={cr.id} className="text-center">
                              {perm ? (
                                <Switch
                                  checked={perm.can_access}
                                  onCheckedChange={(checked) => toggleCustomPermission.mutate({ id: perm.id, can_access: checked })}
                                />
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddModuleDialog
        open={addModuleOpen}
        onOpenChange={setAddModuleOpen}
        onConfirm={(slug, label) => addModuleMutation.mutate({ slug, label })}
        isPending={addModuleMutation.isPending}
      />

      <RemoveModuleDialog
        open={!!removeModule}
        onOpenChange={(open) => !open && setRemoveModule(null)}
        moduleName={removeModule ? (moduleLabels[removeModule] ?? removeModule) : ""}
        onConfirm={() => removeModule && removeModuleMutation.mutate(removeModule)}
        isPending={removeModuleMutation.isPending}
      />

      {editRole && (
        <EditRoleDialog
          open={!!editRole}
          onOpenChange={(open) => !open && setEditRole(null)}
          roleLabel={getRoleMeta(editRole).label}
          roleDescription={getRoleMeta(editRole).description}
          onSave={(label, description) => {
            setRoleOverrides((prev) => ({ ...prev, [editRole]: { label, description } }));
            setEditRole(null);
            toast.success("Cargo actualizado");
          }}
        />
      )}

      <CreateCustomRoleDialog
        open={createCustomRoleOpen}
        onOpenChange={setCreateCustomRoleOpen}
        onConfirm={(name, label, description) => createCustomRoleMutation.mutate({ name, label, description })}
        isPending={createCustomRoleMutation.isPending}
      />

      {editCustomRole && (
        <EditRoleDialog
          open={!!editCustomRole}
          onOpenChange={(open) => !open && setEditCustomRole(null)}
          roleLabel={editCustomRole.label}
          roleDescription={editCustomRole.description}
          onSave={(label, description) => {
            updateCustomRoleMutation.mutate({ id: editCustomRole.id, label, description });
          }}
        />
      )}

      <AlertDialog open={!!deleteCustomRole} onOpenChange={(open) => !open && setDeleteCustomRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cargo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover o cargo <strong>"{deleteCustomRole?.label}"</strong>? Todas as permissões e atribuições associadas serão eliminadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCustomRole && deleteCustomRoleMutation.mutate(deleteCustomRole.id)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
