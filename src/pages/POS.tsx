import { useState, useCallback } from "react";
import { POSHeader } from "@/components/pos/POSHeader";
import { POSProductGrid } from "@/components/pos/POSProductGrid";
import { POSCart, type CartItem } from "@/components/pos/POSCart";
import { POSPaymentDialog } from "@/components/pos/POSPaymentDialog";
import { type Product } from "@/data/mockProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

export default function POS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setDiscount(0);
  }, []);

  const subtotal = cartItems.reduce((sum, i) => sum + i.product.sellPrice * i.quantity, 0);
  const discountAmount = discountType === "percent" ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleConfirmSale = useCallback(() => {
    clearCart();
    setDrawerOpen(false);
  }, [clearCart]);

  const cartProps = {
    items: cartItems,
    onUpdateQuantity: updateQuantity,
    onRemoveItem: removeItem,
    onClearCart: clearCart,
    discount,
    discountType,
    onDiscountChange: setDiscount,
    onDiscountTypeChange: setDiscountType,
    onFinalize: () => {
      setPaymentOpen(true);
      setDrawerOpen(false);
    },
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <POSHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <POSProductGrid
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            searchQuery={searchQuery}
            viewMode={viewMode}
            onAddToCart={addToCart}
          />
        </div>

        {/* Desktop: sidebar cart */}
        {!isMobile && (
          <div className="w-[380px] shrink-0">
            <POSCart {...cartProps} />
          </div>
        )}
      </div>

      {/* Mobile: floating cart button */}
      {isMobile && (
        <Button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-14 rounded-full shadow-lg px-4 gap-2"
          size="lg"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {totalItems}
            </Badge>
          )}
          <span className="font-semibold text-sm">{formatKz(total)}</span>
        </Button>
      )}

      {/* Mobile: cart drawer */}
      {isMobile && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-0">
              <DrawerTitle>Carrinho</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden">
              <POSCart {...cartProps} />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <POSPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        onConfirm={handleConfirmSale}
      />
    </div>
  );
}
