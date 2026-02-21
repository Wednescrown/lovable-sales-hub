import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Layers, Plus, Edit, Trash2, ChevronRight, FolderOpen, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCategories, useAllSubcategories, useCategoryMutations } from "@/hooks/useCategories";

const Categories = () => {
  const { toast } = useToast();
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: subcategories = [], isLoading: subLoading } = useAllSubcategories();
  const { createCategory, updateCategory, deleteCategory, createSubcategory, updateSubcategory, deleteSubcategory } = useCategoryMutations();

  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [subName, setSubName] = useState("");
  const [subCategoryParent, setSubCategoryParent] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Build categories with their subcategories
  const categoriesWithSubs = categories.map((cat) => ({
    ...cat,
    subs: subcategories.filter((s) => s.category_id === cat.id),
  }));

  const filteredCategories = categoriesWithSubs.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.subs.some((sub) => sub.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSubs = subcategories.length;

  const openCreateCategory = () => {
    setEditingCatId(null);
    setCatName("");
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: { id: string; name: string }) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatDialogOpen(true);
  };

  const openCreateSubcategory = (parentId?: string) => {
    setEditingSubId(null);
    setSubName("");
    setSubCategoryParent(parentId || "");
    setSubDialogOpen(true);
  };

  const openEditSubcategory = (sub: { id: string; name: string; category_id: string }) => {
    setEditingSubId(sub.id);
    setSubName(sub.name);
    setSubCategoryParent(sub.category_id);
    setSubDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    try {
      if (editingCatId) {
        await updateCategory.mutateAsync({ id: editingCatId, name: catName.trim() });
        toast({ title: "Categoria atualizada" });
      } else {
        await createCategory.mutateAsync(catName.trim());
        toast({ title: "Categoria criada" });
      }
      setCatDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveSubcategory = async () => {
    if (!subName.trim() || !subCategoryParent) return;
    try {
      if (editingSubId) {
        await updateSubcategory.mutateAsync({ id: editingSubId, name: subName.trim(), categoryId: subCategoryParent });
        toast({ title: "Subcategoria atualizada" });
      } else {
        await createSubcategory.mutateAsync({ name: subName.trim(), categoryId: subCategoryParent });
        toast({ title: "Subcategoria criada" });
      }
      setSubDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: "Categoria removida" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      await deleteSubcategory.mutateAsync(id);
      toast({ title: "Subcategoria removida" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  if (catLoading || subLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">Carregando categorias...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Categorias & Subcategorias
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize os produtos em categorias e subcategorias
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openCreateSubcategory()}>
              <Plus className="w-4 h-4 mr-1" />
              Nova Subcategoria
            </Button>
            <Button size="sm" onClick={openCreateCategory}>
              <Plus className="w-4 h-4 mr-1" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categorias</p>
                <p className="text-lg font-bold text-foreground">{categories.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subcategorias</p>
                <p className="text-lg font-bold text-foreground">{totalSubs}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar categorias ou subcategorias..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {filteredCategories.map((cat) => {
            const isExpanded = expandedCat === cat.id;
            return (
              <Card key={cat.id}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{cat.subs.length} subcategorias</Badge>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCreateSubcategory(cat.id)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCategory(cat)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border">
                      {cat.subs.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 pl-12 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-foreground">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSubcategory(sub)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteSubcategory(sub.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {cat.subs.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma subcategoria cadastrada.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filteredCategories.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada.</CardContent>
            </Card>
          )}
        </div>

        {/* Category Dialog */}
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                {editingCatId ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCatId ? "Atualize o nome da categoria." : "Crie uma nova categoria para organizar produtos."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="catName" className="text-xs">Nome da Categoria *</Label>
                <Input id="catName" placeholder="Ex: Bebidas" value={catName} onChange={(e) => setCatName(e.target.value)} className="h-9" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveCategory} disabled={createCategory.isPending || updateCategory.isPending}>
                {editingCatId ? "Salvar" : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subcategory Dialog */}
        <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                {editingSubId ? "Editar Subcategoria" : "Nova Subcategoria"}
              </DialogTitle>
              <DialogDescription>
                {editingSubId ? "Atualize as informações da subcategoria." : "Crie uma nova subcategoria vinculada a uma categoria."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Categoria Pai *</Label>
                <Select value={subCategoryParent} onValueChange={setSubCategoryParent}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="subName" className="text-xs">Nome da Subcategoria *</Label>
                <Input id="subName" placeholder="Ex: Refrigerantes" value={subName} onChange={(e) => setSubName(e.target.value)} className="h-9" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveSubcategory} disabled={createSubcategory.isPending || updateSubcategory.isPending}>
                {editingSubId ? "Salvar" : "Criar Subcategoria"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Categories;
