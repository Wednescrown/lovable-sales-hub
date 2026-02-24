import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ProductRow } from "@/hooks/useProducts";
import { useProductThumbnails } from "@/hooks/useProductImages";
import { Package } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
}

interface POSProductGridProps {
  products: ProductRow[];
  categories: CategoryItem[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  viewMode: "grid" | "list";
  onAddToCart: (product: ProductRow) => void;
}

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

export function POSProductGrid({ products, categories, activeCategory, onCategoryChange, searchQuery, viewMode, onAddToCart }: POSProductGridProps) {
  const productIds = useMemo(() => products.map((p) => p.id), [products]);
  const { data: thumbnails } = useProductThumbnails(productIds);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category_id === activeCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode || "").includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && p.status === "active";
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1.5 px-4 py-2 border-b overflow-x-auto">
        <button
          onClick={() => onCategoryChange("all")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const lowStock = product.stock <= product.min_stock && product.stock > 0;
              return (
                <Card
                  key={product.id}
                  onClick={() => !outOfStock && onAddToCart(product)}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                    outOfStock ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex items-center justify-center h-12 bg-muted rounded-md mb-2 overflow-hidden">
                    {thumbnails?.get(product.id) ? (
                      <img src={thumbnails.get(product.id)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-sm text-primary">{formatKz(product.sell_price)}</span>
                    <Badge variant={outOfStock ? "destructive" : lowStock ? "outline" : "secondary"} className="text-[10px] px-1.5">
                      {outOfStock ? "Sem stock" : product.stock}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const outOfStock = product.stock <= 0;
                  return (
                    <TableRow
                      key={product.id}
                      onClick={() => !outOfStock && onAddToCart(product)}
                      className={`cursor-pointer ${outOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {thumbnails?.get(product.id) ? (
                            <img src={thumbnails.get(product.id)} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell className="text-right font-medium">{formatKz(product.sell_price)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={outOfStock ? "destructive" : "secondary"} className="text-xs">
                          {outOfStock ? "Sem stock" : product.stock}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-2" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
