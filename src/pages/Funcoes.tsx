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
} from "lucide-react";
import { AddModuleDialog } from "@/components/funcoes/AddModuleDialog";
import { RemoveModuleDialog } from "@/components/funcoes/RemoveModuleDialog";
import { EditRoleDialog } from "@/components/funcoes/EditRoleDialog";

type AppRole = "admin" | "gestor" | "caixeiro" | "gestor_stock";

interface ModulePermission {
  id: string;
  role: AppRole;
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
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [removeModule, setRemoveModule] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AppRole | null>(null);

  // Local overrides for role metadata (label/description)
  const [roleOverrides, setRoleOverrides] = useState<Partial<Record<AppRole, { label: string; description: string }>>>({});

  const getRoleMeta = (role: AppRole) => ({
    ...DEFAULT_ROLE_META[role],
    ...roleOverrides[role],
  });

  // Module labels stored locally, seeded from defaults
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
    onError: (err) => {
      toast.error("Erro ao actualizar permissão: " + (err as Error).message);
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async ({ slug, label }: { slug: string; label: string }) => {
      const rows = ROLES.map((role) => ({
        module: slug,
        role,
        can_access: role === "admin",
      }));
      const { error } = await supabase.from("module_permissions").insert(rows);
      if (error) throw error;
      return { slug, label };
    },
    onSuccess: ({ slug, label }) => {
      queryClient.invalidateQueries({ queryKey: ["module_permissions"] });
      setModuleLabels((prev) => ({ ...prev, [slug]: label }));
      setAddModuleOpen(false);
      toast.success(`Módulo "${label}" adicionado`);
    },
    onError: (err) => {
      toast.error("Erro ao adicionar módulo: " + (err as Error).message);
    },
  });

  const removeModuleMutation = useMutation({
    mutationFn: async (mod: string) => {
      const { error } = await supabase
        .from("module_permissions")
        .delete()
        .eq("module", mod);
      if (error) throw error;
      return mod;
    },
    onSuccess: (mod) => {
      queryClient.invalidateQueries({ queryKey: ["module_permissions"] });
      setRemoveModule(null);
      toast.success(`Módulo "${moduleLabels[mod] ?? mod}" removido`);
    },
    onError: (err) => {
      toast.error("Erro ao remover módulo: " + (err as Error).message);
    },
  });

  const modules = [...new Set(permissions.map((p) => p.module))];

  const getRolePermissions = (role: AppRole) =>
    permissions.filter((p) => p.role === role);

  const getPermission = (role: AppRole, module: string) =>
    permissions.find((p) => p.role === role && p.module === module);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Funções & Permissões
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerir cargos e controlar acesso aos módulos do sistema
            </p>
          </div>
          <Button onClick={() => setAddModuleOpen(true)}>
            <Plus className="w-4 h-4" />
            Adicionar Módulo
          </Button>
        </div>

        {/* Role Cards */}
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
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedRole(isSelected ? null : role)}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditRole(role);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {meta.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{activeModules}</span> de{" "}
                    {modules.length} módulos activos
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              {selectedRole
                ? `Permissões — ${getRoleMeta(selectedRole).label}`
                : "Matriz de Permissões"}
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedRole
                ? "Alterne os módulos que este cargo pode aceder"
                : "Seleccione um cargo acima para editar ou veja a matriz completa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-10">A carregar...</p>
            ) : selectedRole ? (
              <div className="space-y-3">
                {modules.map((mod) => {
                  const perm = getPermission(selectedRole, mod);
                  if (!perm) return null;
                  return (
                    <div
                      key={mod}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{moduleLabels[mod] ?? mod}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setRemoveModule(mod)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Switch
                          checked={perm.can_access}
                          disabled={selectedRole === "admin"}
                          onCheckedChange={(checked) =>
                            togglePermission.mutate({ id: perm.id, can_access: checked })
                          }
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
            ) : (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod) => (
                      <TableRow key={mod}>
                        <TableCell className="font-medium">
                          {moduleLabels[mod] ?? mod}
                        </TableCell>
                        {ROLES.map((role) => {
                          const perm = getPermission(role, mod);
                          return (
                            <TableCell key={role} className="text-center">
                              {perm ? (
                                <Switch
                                  checked={perm.can_access}
                                  disabled={role === "admin"}
                                  onCheckedChange={(checked) =>
                                    togglePermission.mutate({ id: perm.id, can_access: checked })
                                  }
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
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
            setRoleOverrides((prev) => ({
              ...prev,
              [editRole]: { label, description },
            }));
            setEditRole(null);
            toast.success("Cargo actualizado");
          }}
        />
      )}
    </AppLayout>
  );
}
