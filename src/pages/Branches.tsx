import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Store, Plus, Edit, Trash2, Search, Building2, MapPin, Phone, Mail, UserCircle,
} from "lucide-react";

interface Branch {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  display_name: string | null;
}

export default function Branches() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Branch | null>(null);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager_id: "",
    is_active: true,
  });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("branches")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Branch[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles_for_manager"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const getCompanyId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();
    if (!profile?.company_id) throw new Error("Sem empresa associada");
    return profile.company_id;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const company_id = await getCompanyId();
      const { error } = await (supabase as any)
        .from("branches")
        .insert({
          company_id,
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          manager_id: data.manager_id || null,
          is_active: data.is_active,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setFormDialog(false);
      resetForm();
      toast.success("Filial criada com sucesso");
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await (supabase as any)
        .from("branches")
        .update({
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          manager_id: data.manager_id || null,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setFormDialog(false);
      setEditing(null);
      resetForm();
      toast.success("Filial actualizada");
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("branches")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setDeleteDialog(null);
      toast.success("Filial removida");
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "", email: "", manager_id: "", is_active: true });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setFormDialog(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setFormData({
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      manager_id: branch.manager_id ?? "",
      is_active: branch.is_active,
    });
    setFormDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("O nome da filial é obrigatório");
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "—";
    const p = profiles.find((pr) => pr.user_id === managerId);
    return p?.full_name ?? "—";
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.address ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = branches.filter((b) => b.is_active).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Gestão de Filiais
            </h1>
            <p className="text-sm text-muted-foreground">
              Criar, editar e gerir as filiais da empresa
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nova Filial
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{branches.length}</p>
                <p className="text-xs text-muted-foreground">Total Filiais</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Building2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{branches.length - activeCount}</p>
                <p className="text-xs text-muted-foreground">Inactivas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar filiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      A carregar...
                    </TableCell>
                  </TableRow>
                ) : filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      {branches.length === 0
                        ? "Nenhuma filial registada. Clique em 'Nova Filial' para começar."
                        : "Nenhum resultado encontrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          {branch.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branch.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{branch.address}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branch.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {branch.phone}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branch.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {branch.email}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getManagerName(branch.manager_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={branch.is_active ? "bg-green-500/10 text-green-700 border-green-200" : "bg-red-500/10 text-red-700 border-red-200"}>
                          {branch.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(branch)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog(branch)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog} onOpenChange={(open) => { if (!open) { setFormDialog(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Filial" : "Nova Filial"}</DialogTitle>
            <DialogDescription>
              {editing ? "Altere os dados da filial." : "Preencha os dados para criar uma nova filial."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Filial Talatona"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                placeholder="Ex: Rua da Samba, 123"
                value={formData.address}
                onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="Ex: +244 923 456 789"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Ex: filial@empresa.co.ao"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gestor Responsável</Label>
              <Select
                value={formData.manager_id || "none"}
                onValueChange={(v) => setFormData((f) => ({ ...f, manager_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Activa</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((f) => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormDialog(false); setEditing(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover filial?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover a filial <strong>"{deleteDialog?.name}"</strong>? Os utilizadores associados ficarão sem filial atribuída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog.id)}
            >
              {deleteMutation.isPending ? "A remover..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
