import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Package, Search, Plus, Filter, Download, Upload, AlertTriangle, Edit, Trash2, Barcode, Eye, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useProductMutations, type ProductRow } from "@/hooks/useProducts";
import { useCategories, useAllSubcategories } from "@/hooks/useCategories";

function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}

const Products = () => {
  const { toast } = useToast();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useAllSubcategories();
  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<string[][]>([]);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "", barcode: "", categoryId: "", subcategoryId: "",
    costPrice: "", sellPrice: "", minStock: "", packSize: "", unit: "un",
  });

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search);
    const matchCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const isLowStock = p.stock <= p.min_stock;
    const matchLowStock = !lowStockOnly || isLowStock;
    return matchSearch && matchCategory && matchStatus && matchLowStock;
  });

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;
  const activeCount = products.filter((p) => p.status === "active").length;

  const selectedCategorySubs = subcategories.filter((s) => s.category_id === formData.categoryId);

  const openCreateForm = () => {
    setEditProduct(null);
    setFormData({ name: "", barcode: "", categoryId: "", subcategoryId: "", costPrice: "", sellPrice: "", minStock: "", packSize: "", unit: "un" });
    setFormOpen(true);
  };

  const openEditForm = (product: ProductRow) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      categoryId: product.category_id || "",
      subcategoryId: product.subcategory_id || "",
      costPrice: product.cost_price.toString(),
      sellPrice: product.sell_price.toString(),
      minStock: product.min_stock.toString(),
      packSize: product.pack_size.toString(),
      unit: product.unit,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        barcode: formData.barcode || undefined,
        category_id: formData.categoryId || undefined,
        subcategory_id: formData.subcategoryId || undefined,
        cost_price: Number(formData.costPrice) || 0,
        sell_price: Number(formData.sellPrice) || 0,
        min_stock: Number(formData.minStock) || 0,
        pack_size: Number(formData.packSize) || 1,
        unit: formData.unit,
      };

      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, ...payload });
        toast({ title: "Produto atualizado" });
      } else {
        await createProduct.mutateAsync(payload);
        toast({ title: "Produto cadastrado", description: "SKU gerado automaticamente." });
      }
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: "Produto removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = text.split("\n").filter(Boolean).map((row) => row.split(/[,;\t]/));
      setImportData(rows);
      setImportOpen(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const addToShoppingList = (productId: string, productName: string) => {
    if (shoppingList.includes(productId)) {
      toast({ title: "Já na lista", description: `${productName} já está na lista de compras.` });
      return;
    }
    setShoppingList((prev) => [...prev, productId]);
    toast({ title: "Adicionado", description: `${productName} adicionado à lista de compras.` });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">Carregando produtos...</p>
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
              <Package className="w-5 h-5 text-primary" />
              Gestão de Produtos
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Gerencie o catálogo completo de produtos</p>
          </div>
          <div className="flex items-center gap-2">
            {shoppingList.length > 0 && (
              <Badge variant="secondary" className="gap-1"><ShoppingCart className="w-3 h-3" />{shoppingList.length}</Badge>
            )}
            <input type="file" ref={fileInputRef} accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" />Importar
            </Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Exportar</Button>
            <Button size="sm" onClick={openCreateForm}><Plus className="w-4 h-4 mr-1" />Novo Produto</Button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Produtos</p>
                <p className="text-lg font-bold text-foreground">{totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                <p className="text-lg font-bold text-destructive">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Eye className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Produtos Ativos</p>
                <p className="text-lg font-bold text-foreground">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Pesquisar por nome, SKU ou código de barras..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox id="lowStock" checked={lowStockOnly} onCheckedChange={(v) => setLowStockOnly(v === true)} />
                <label htmlFor="lowStock" className="text-xs text-muted-foreground cursor-pointer">Apenas estoque baixo</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Produtos ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Cód. Barras</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-[130px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, idx) => {
                  const isLowStock = product.stock <= product.min_stock;
                  return (
                    <TableRow key={product.id} className={isLowStock ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{product.name}</p>
                            <p className="text-[10px] text-muted-foreground">Pack: {product.pack_size} {product.unit}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{product.sku}</code></TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Barcode className="w-3 h-3" />{product.barcode || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium">{product.category_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{product.subcategory_name || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs">{formatKz(product.cost_price)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatKz(product.sell_price)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-bold ${isLowStock ? "text-destructive" : "text-foreground"}`}>{product.stock}</span>
                          {isLowStock && (
                            <span className="text-[9px] text-destructive flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />Mín: {product.min_stock}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={product.status === "active" ? "default" : "secondary"}
                          className={`text-[10px] ${product.status === "active" ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}`}
                        >
                          {product.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(product)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className={`h-7 w-7 ${shoppingList.includes(product.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                            onClick={() => addToShoppingList(product.id, product.name)}
                            title="Enviar para Lista de Compras"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-sm text-muted-foreground">Nenhum produto encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {editProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editProduct ? "Atualize as informações do produto." : "Preencha as informações. O SKU será gerado automaticamente."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-xs">Nome do Produto *</Label>
                <Input id="name" placeholder="Ex: Coca-Cola 350ml" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9" />
              </div>

              {editProduct && (
                <div className="bg-muted/50 rounded-md px-3 py-2 text-xs">
                  <span className="text-muted-foreground">SKU: </span>
                  <code className="font-mono font-semibold">{editProduct.sku}</code>
                </div>
              )}

              {!editProduct && formData.name.trim() && (
                <div className="bg-muted/50 rounded-md px-3 py-2 text-xs">
                  <span className="text-muted-foreground">SKU será gerado automaticamente ao salvar</span>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="barcode" className="text-xs flex items-center gap-1"><Barcode className="w-3 h-3" />Código de Barras</Label>
                <Input id="barcode" placeholder="Ex: 7891234560012" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="h-9 font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v, subcategoryId: "" })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Subcategoria</Label>
                  <Select value={formData.subcategoryId} onValueChange={(v) => setFormData({ ...formData, subcategoryId: v })} disabled={!formData.categoryId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar subcategoria" /></SelectTrigger>
                    <SelectContent>
                      {selectedCategorySubs.map((sub) => (<SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="costPrice" className="text-xs">Preço de Custo (Kz) *</Label>
                  <Input id="costPrice" type="number" placeholder="0" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} className="h-9" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sellPrice" className="text-xs">Preço de Venda (Kz) *</Label>
                  <Input id="sellPrice" type="number" placeholder="0" value={formData.sellPrice} onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })} className="h-9" />
                </div>
              </div>

              {formData.costPrice && formData.sellPrice && Number(formData.costPrice) > 0 && (
                <div className="bg-muted/50 rounded-md px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Margem de lucro: </span>
                  <span className="font-semibold text-success">
                    {(((Number(formData.sellPrice) - Number(formData.costPrice)) / Number(formData.costPrice)) * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="minStock" className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warning" />Alerta Estoque Baixo</Label>
                  <Input id="minStock" type="number" placeholder="0" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} className="h-9" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="packSize" className="text-xs">Pack Size</Label>
                  <Input id="packSize" type="number" placeholder="1" value={formData.packSize} onChange={(e) => setFormData({ ...formData, packSize: e.target.value })} className="h-9" />
                </div>
              </div>

              <div className="grid gap-1.5 max-w-[200px]">
                <Label className="text-xs">Unidade de Medida</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="lt">Litro (lt)</SelectItem>
                    <SelectItem value="cx">Caixa (cx)</SelectItem>
                    <SelectItem value="pct">Pacote (pct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : editProduct ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Produto</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja eliminar <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser revertida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import Dialog */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" />Importar Produtos</DialogTitle>
              <DialogDescription>Preview dos dados do ficheiro importado.</DialogDescription>
            </DialogHeader>
            {importData.length > 0 && (
              <div className="border rounded-md overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {importData[0]?.map((header, i) => (
                        <TableHead key={i} className="text-xs whitespace-nowrap">{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.slice(1, 50).map((row, ri) => (
                      <TableRow key={ri}>
                        {row.map((cell, ci) => (<TableCell key={ci} className="text-xs whitespace-nowrap">{cell}</TableCell>))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {importData.length > 1 ? `${importData.length - 1} registos encontrados.` : "Nenhum dado encontrado."}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setImportOpen(false); setImportData([]); }}>Cancelar</Button>
              <Button onClick={() => {
                setImportOpen(false);
                setImportData([]);
                toast({ title: "Importação simulada", description: `${importData.length - 1} produtos processados com sucesso.` });
              }}>Confirmar Importação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Products;
