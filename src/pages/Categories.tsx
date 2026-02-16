import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  FolderOpen,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockCategories, type Category, type Subcategory } from "@/data/mockProducts";

const Categories = () => {
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [subName, setSubName] = useState("");
  const [subCategoryParent, setSubCategoryParent] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);

  const filteredCategories = mockCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.subcategories.some((sub) =>
        sub.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  const totalSubs = mockCategories.reduce(
    (acc, cat) => acc + cat.subcategories.length,
    0
  );

  const openCreateCategory = () => {
    setEditingCat(null);
    setCatName("");
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDialogOpen(true);
  };

  const openCreateSubcategory = (parentId?: string) => {
    setEditingSub(null);
    setSubName("");
    setSubCategoryParent(parentId || "");
    setSubDialogOpen(true);
  };

  const openEditSubcategory = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubCategoryParent(sub.categoryId);
    setSubDialogOpen(true);
  };

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
                <p className="text-lg font-bold text-foreground">
                  {mockCategories.length}
                </p>
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
                  {/* Category Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {cat.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {cat.subcategories.length} subcategorias
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openCreateSubcategory(cat.id)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditCategory(cat)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {cat.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between px-4 py-2.5 pl-12 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-foreground">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditSubcategory(sub)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {cat.subcategories.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Nenhuma subcategoria cadastrada.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filteredCategories.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma categoria encontrada.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Category Dialog */}
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                {editingCat ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCat ? "Atualize o nome da categoria." : "Crie uma nova categoria para organizar produtos."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="catName" className="text-xs">Nome da Categoria *</Label>
                <Input
                  id="catName"
                  placeholder="Ex: Bebidas"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setCatDialogOpen(false)}>
                {editingCat ? "Salvar" : "Criar Categoria"}
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
                {editingSub ? "Editar Subcategoria" : "Nova Subcategoria"}
              </DialogTitle>
              <DialogDescription>
                {editingSub ? "Atualize as informações da subcategoria." : "Crie uma nova subcategoria vinculada a uma categoria."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Categoria Pai *</Label>
                <Select
                  value={subCategoryParent}
                  onValueChange={setSubCategoryParent}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="subName" className="text-xs">Nome da Subcategoria *</Label>
                <Input
                  id="subName"
                  placeholder="Ex: Refrigerantes"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setSubDialogOpen(false)}>
                {editingSub ? "Salvar" : "Criar Subcategoria"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Categories;
