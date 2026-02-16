import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Package,
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  Edit,
  Trash2,
  Barcode,
  Eye,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { mockProducts, mockCategories, type Product } from "@/data/mockProducts";

function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}

const Products = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    subcategoryId: "",
    costPrice: "",
    sellPrice: "",
    stock: "",
    minStock: "",
    packSize: "",
    unit: "un",
  });

  const filteredProducts = mockProducts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchLowStock = !lowStockOnly || p.lowStock;
    return matchSearch && matchCategory && matchStatus && matchLowStock;
  });

  const totalProducts = mockProducts.length;
  const lowStockCount = mockProducts.filter((p) => p.lowStock).length;
  const activeCount = mockProducts.filter((p) => p.status === "active").length;

  const selectedCategory = mockCategories.find((c) => c.id === formData.categoryId);

  const openCreateForm = () => {
    setEditProduct(null);
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      categoryId: "",
      subcategoryId: "",
      costPrice: "",
      sellPrice: "",
      stock: "",
      minStock: "",
      packSize: "",
      unit: "un",
    });
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      costPrice: product.costPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      packSize: product.packSize.toString(),
      unit: product.unit,
    });
    setFormOpen(true);
  };

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
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie o catálogo completo de produtos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
            <Button size="sm" onClick={openCreateForm}>
              <Plus className="w-4 h-4 mr-1" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Produtos</p>
                <p className="text-lg font-bold text-foreground">{totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                <p className="text-lg font-bold text-destructive">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-success" />
              </div>
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
                <Input
                  placeholder="Pesquisar por nome, SKU ou código de barras..."
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {mockCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="lowStock"
                  checked={lowStockOnly}
                  onCheckedChange={(v) => setLowStockOnly(v === true)}
                />
                <label htmlFor="lowStock" className="text-xs text-muted-foreground cursor-pointer">
                  Apenas estoque baixo
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Produtos ({filteredProducts.length})
            </CardTitle>
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
                  <TableHead className="text-center w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, idx) => (
                  <TableRow key={product.id} className={product.lowStock ? "bg-destructive/5" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Pack: {product.packSize} {product.unit}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {product.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <BarCode className="w-3 h-3" />
                        {product.barcode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium">{product.categoryName}</p>
                        <p className="text-[10px] text-muted-foreground">{product.subcategoryName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs">{formatKz(product.costPrice)}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{formatKz(product.sellPrice)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${product.lowStock ? "text-destructive" : "text-foreground"}`}>
                          {product.stock}
                        </span>
                        {product.lowStock && (
                          <span className="text-[9px] text-destructive flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Mín: {product.minStock}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                        className={`text-[10px] ${
                          product.status === "active"
                            ? "bg-success/15 text-success border-success/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {product.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditForm(product)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-sm text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
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
                Preencha as informações do produto abaixo.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              {/* Name */}
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-xs">Nome do Produto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Coca-Cola 350ml"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9"
                />
              </div>

              {/* SKU + Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="sku" className="text-xs">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="Ex: BEB-CC-350"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="h-9 font-mono"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="barcode" className="text-xs flex items-center gap-1">
                    <BarCode className="w-3 h-3" />
                    Código de Barras *
                  </Label>
                  <Input
                    id="barcode"
                    placeholder="Ex: 7891234560012"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="h-9 font-mono"
                  />
                </div>
              </div>

              {/* Category + Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Categoria *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, categoryId: v, subcategoryId: "" })
                    }
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
                  <Label className="text-xs">Subcategoria *</Label>
                  <Select
                    value={formData.subcategoryId}
                    onValueChange={(v) => setFormData({ ...formData, subcategoryId: v })}
                    disabled={!formData.categoryId}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecionar subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory?.subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="costPrice" className="text-xs">Preço de Custo (Kz) *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    placeholder="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sellPrice" className="text-xs">Preço de Venda (Kz) *</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    placeholder="0"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Margin display */}
              {formData.costPrice && formData.sellPrice && Number(formData.costPrice) > 0 && (
                <div className="bg-muted/50 rounded-md px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Margem de lucro: </span>
                  <span className="font-semibold text-success">
                    {(
                      ((Number(formData.sellPrice) - Number(formData.costPrice)) /
                        Number(formData.costPrice)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}

              {/* Stock + Min Stock + Pack */}
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="stock" className="text-xs">Estoque Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="minStock" className="text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-warning" />
                    Alerta Estoque Baixo
                  </Label>
                  <Input
                    id="minStock"
                    type="number"
                    placeholder="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="packSize" className="text-xs">Pack Size</Label>
                  <Input
                    id="packSize"
                    type="number"
                    placeholder="1"
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Unit */}
              <div className="grid gap-1.5 max-w-[200px]">
                <Label className="text-xs">Unidade de Medida</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
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
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setFormOpen(false)}>
                {editProduct ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

// Small barcode icon component to avoid lucide naming conflict
function BarCode({ className }: { className?: string }) {
  return <Barcode className={className} />;
}

export default Products;
