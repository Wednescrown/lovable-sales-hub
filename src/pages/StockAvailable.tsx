import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PackageCheck, Search, AlertTriangle, Package, TrendingDown, DollarSign, Upload, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, type ProductRow } from "@/hooks/useProducts";
import { useCategories, useAllSubcategories } from "@/hooks/useCategories";
import { StockImportDialog } from "@/components/stock/StockImportDialog";

function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}

type StockStatus = "normal" | "low" | "out";

function getStockStatus(product: ProductRow): StockStatus {
  if (product.stock <= 0) return "out";
  if (product.stock <= product.min_stock) return "low";
  return "normal";
}

const statusLabels: Record<StockStatus, string> = {
  normal: "Normal",
  low: "Baixo",
  out: "Sem Stock",
};

type SortField = "name" | "sku" | "category" | "stock" | "min_stock" | "cost_price" | "total_value" | "status";
type SortDirection = "asc" | "desc";

const StockAvailable = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useAllSubcategories();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | StockStatus>("all");
  const [importOpen, setImportOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const activeProducts = products.filter((p) => p.status === "active");

  const filteredProducts = activeProducts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchSubcategory = subcategoryFilter === "all" || p.subcategory_id === subcategoryFilter;
    const matchStatus = stockStatusFilter === "all" || getStockStatus(p) === stockStatusFilter;
    return matchSearch && matchCategory && matchSubcategory && matchStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;
    const dir = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "name": return dir * a.name.localeCompare(b.name);
      case "sku": return dir * a.sku.localeCompare(b.sku);
      case "category": return dir * (a.category_name || "").localeCompare(b.category_name || "");
      case "stock": return dir * (a.stock - b.stock);
      case "min_stock": return dir * (a.min_stock - b.min_stock);
      case "cost_price": return dir * (a.cost_price - b.cost_price);
      case "total_value": return dir * ((a.stock * a.cost_price) - (b.stock * b.cost_price));
      case "status": {
        const order: Record<StockStatus, number> = { out: 0, low: 1, normal: 2 };
        return dir * (order[getStockStatus(a)] - order[getStockStatus(b)]);
      }
      default: return 0;
    }
  });

  const totalProducts = activeProducts.length;
  const lowStockCount = activeProducts.filter((p) => getStockStatus(p) === "low").length;
  const outOfStockCount = activeProducts.filter((p) => getStockStatus(p) === "out").length;
  const totalStockValue = activeProducts.reduce((sum, p) => sum + p.stock * p.cost_price, 0);

  const filteredSubcategories = categoryFilter === "all"
    ? subcategories
    : subcategories.filter((s) => s.category_id === categoryFilter);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">Carregando estoque...</p>
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
              <PackageCheck className="w-5 h-5 text-primary" />
              Estoque Disponível
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Visão geral do stock actual de todos os produtos</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1" />Importar Stock
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Produtos</p>
                <p className="text-lg font-bold text-foreground">{totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                <p className="text-lg font-bold text-warning">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sem Stock</p>
                <p className="text-lg font-bold text-destructive">{outOfStockCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor em Stock</p>
                <p className="text-lg font-bold text-foreground">{formatKz(totalStockValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Pesquisar por nome ou SKU..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setSubcategoryFilter("all"); }}>
                <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue placeholder="Subcategoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {filteredSubcategories.map((sub) => (<SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={stockStatusFilter} onValueChange={(v) => setStockStatusFilter(v as any)}>
                <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="out">Sem Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Produtos ({sortedProducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}><span className="flex items-center">Produto<SortIcon field="name" /></span></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("sku")}><span className="flex items-center">SKU<SortIcon field="sku" /></span></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("category")}><span className="flex items-center">Categoria<SortIcon field="category" /></span></TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort("stock")}><span className="flex items-center justify-center">Stock Actual<SortIcon field="stock" /></span></TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort("min_stock")}><span className="flex items-center justify-center">Stock Mínimo<SortIcon field="min_stock" /></span></TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("cost_price")}><span className="flex items-center justify-end">Valor Custo<SortIcon field="cost_price" /></span></TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("total_value")}><span className="flex items-center justify-end">Valor Total<SortIcon field="total_value" /></span></TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort("status")}><span className="flex items-center justify-center">Estado<SortIcon field="status" /></span></TableHead>
                  <TableHead className="text-center">Cobertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product, idx) => {
                  const status = getStockStatus(product);
                  const totalValue = product.stock * product.cost_price;
                  return (
                    <TableRow key={product.id} className={status === "out" ? "bg-destructive/5" : status === "low" ? "bg-warning/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground">{product.unit}</p>
                      </TableCell>
                      <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{product.sku}</code></TableCell>
                      <TableCell>
                        <p className="text-xs">{product.category_name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{product.subcategory_name || ""}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-bold ${status === "out" ? "text-destructive" : status === "low" ? "text-warning" : "text-foreground"}`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{product.min_stock}</TableCell>
                      <TableCell className="text-right text-xs">{formatKz(product.cost_price)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatKz(totalValue)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            status === "normal" ? "bg-success/15 text-success border-success/30" :
                            status === "low" ? "bg-warning/15 text-warning border-warning/30" :
                            "bg-destructive/15 text-destructive border-destructive/30"
                          }`}
                        >
                          {statusLabels[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">—</TableCell>
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
        {/* Import Stock Dialog */}
        <StockImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </div>
    </AppLayout>
  );
};

export default StockAvailable;
