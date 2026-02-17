import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, ShoppingCart, Percent, DollarSign } from "lucide-react";
import { type Product } from "@/data/mockProducts";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  discount: number;
  discountType: "percent" | "fixed";
  onDiscountChange: (value: number) => void;
  onDiscountTypeChange: (type: "percent" | "fixed") => void;
  onFinalize: () => void;
}

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

export function POSCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  discount,
  discountType,
  onDiscountChange,
  onDiscountTypeChange,
  onFinalize,
}: POSCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = discountType === "percent" ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <span className="font-semibold">Carrinho</span>
          {totalItems > 0 && (
            <Badge variant="secondary" className="text-xs">{totalItems} itens</Badge>
          )}
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onClearCart}>
            Limpar
          </Button>
        )}
      </div>

      {/* Items */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Carrinho vazio</p>
            <p className="text-xs">Clique nos produtos para adicionar</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 rounded-md border p-2 bg-background">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatKz(item.product.sellPrice)}/un</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.product.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.product.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-semibold w-20 text-right">{formatKz(item.product.sellPrice * item.quantity)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onRemoveItem(item.product.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Summary */}
      <div className="border-t p-4 space-y-3">
        {/* Discount */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Desconto:</span>
          <div className="flex items-center gap-1 flex-1">
            <Input
              type="number"
              min={0}
              className="h-8 text-sm"
              value={discount || ""}
              onChange={(e) => onDiscountChange(Number(e.target.value))}
              placeholder="0"
            />
            <Button
              variant={discountType === "percent" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onDiscountTypeChange("percent")}
            >
              <Percent className="h-3 w-3" />
            </Button>
            <Button
              variant={discountType === "fixed" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onDiscountTypeChange("fixed")}
            >
              <span className="text-xs font-bold">Kz</span>
            </Button>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatKz(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Desconto</span>
              <span>-{formatKz(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1 border-t">
            <span>Total</span>
            <span className="text-primary">{formatKz(total)}</span>
          </div>
        </div>

        <Button className="w-full" size="lg" disabled={items.length === 0} onClick={onFinalize}>
          Finalizar Venda
        </Button>
      </div>
    </div>
  );
}
