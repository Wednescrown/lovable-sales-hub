import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { POSHeader } from "@/components/pos/POSHeader";
import { POSProductGrid } from "@/components/pos/POSProductGrid";
import { POSCart, type CartItem } from "@/components/pos/POSCart";
import { POSPaymentDialog } from "@/components/pos/POSPaymentDialog";
import { type Product } from "@/data/mockProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, PauseCircle, LogOut, Coffee, Plus, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

interface SaleTab {
  id: number;
  label: string;
  cartItems: CartItem[];
  discount: number;
  discountType: "percent" | "fixed";
}

const MAX_TABS = 10;

function createTab(id: number): SaleTab {
  return { id, label: `Venda ${id}`, cartItems: [], discount: 0, discountType: "percent" };
}

export default function POS() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelDialogOpen, setPanelDialogOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const isMobile = useIsMobile();

  // Multi-tab sales
  const [tabs, setTabs] = useState<SaleTab[]>([createTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  const activeTab = tabs.find((t) => t.id === activeTabId)!;
  const cartItems = activeTab.cartItems;
  const discount = activeTab.discount;
  const discountType = activeTab.discountType;

  const updateActiveTab = useCallback((updater: (tab: SaleTab) => SaleTab) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? updater(t) : t)));
  }, [activeTabId]);

  const addTab = useCallback(() => {
    if (tabs.length >= MAX_TABS) return;
    const newTab = createTab(nextTabId);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId((prev) => prev + 1);
  }, [tabs.length, nextTabId]);

  const closeTab = useCallback((tabId: number) => {
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== tabId);
      if (remaining.length === 0) {
        const newTab = createTab(nextTabId);
        setNextTabId((n) => n + 1);
        setActiveTabId(newTab.id);
        return [newTab];
      }
      if (activeTabId === tabId) {
        setActiveTabId(remaining[0].id);
      }
      return remaining;
    });
  }, [activeTabId, nextTabId]);

  const addToCart = useCallback((product: Product) => {
    updateActiveTab((tab) => {
      const existing = tab.cartItems.find((i) => i.product.id === product.id);
      if (existing) {
        return { ...tab, cartItems: tab.cartItems.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { ...tab, cartItems: [...tab.cartItems, { product, quantity: 1 }] };
    });
  }, [updateActiveTab]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    updateActiveTab((tab) => ({
      ...tab,
      cartItems: tab.cartItems
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0),
    }));
  }, [updateActiveTab]);

  const removeItem = useCallback((productId: string) => {
    updateActiveTab((tab) => ({ ...tab, cartItems: tab.cartItems.filter((i) => i.product.id !== productId) }));
  }, [updateActiveTab]);

  const clearCart = useCallback(() => {
    updateActiveTab((tab) => ({ ...tab, cartItems: [], discount: 0 }));
  }, [updateActiveTab]);

  const setDiscount = useCallback((v: number) => {
    updateActiveTab((tab) => ({ ...tab, discount: v }));
  }, [updateActiveTab]);

  const setDiscountType = useCallback((v: "percent" | "fixed") => {
    updateActiveTab((tab) => ({ ...tab, discountType: v }));
  }, [updateActiveTab]);

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
      {/* Pause overlay */}
      {paused && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center gap-6">
          <PauseCircle className="w-20 h-20 text-primary animate-pulse" />
          <h2 className="text-3xl font-bold text-white">Caixa em Pausa</h2>
          <p className="text-muted-foreground text-lg">Operador ausente</p>
          <Button size="lg" onClick={() => setPaused(false)} className="mt-4">
            <Coffee className="w-5 h-5 mr-2" />
            Retomar
          </Button>
        </div>
      )}

      <POSHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPanelClick={() => setPanelDialogOpen(true)}
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-card overflow-x-auto">
        {tabs.map((tab) => {
          const tabItems = tab.cartItems.reduce((s, i) => s + i.quantity, 0);
          return (
            <div
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer border transition-colors ${
                tab.id === activeTabId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.label}</span>
              {tabItems > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-4 justify-center">
                  {tabItems}
                </Badge>
              )}
              {tabs.length > 1 && (
                <button
                  className="ml-1 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        {tabs.length < MAX_TABS && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={addTab}>
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

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

      {/* Panel AlertDialog */}
      <AlertDialog open={panelDialogOpen} onOpenChange={setPanelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opções do Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha uma acção para o ponto de venda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-2">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start gap-3"
              onClick={() => {
                setPanelDialogOpen(false);
                setPaused(true);
              }}
            >
              <PauseCircle className="w-6 h-6 text-warning shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Pausar Caixa</p>
                <p className="text-xs text-muted-foreground">Bloqueia o ecrã temporariamente. O carrinho é preservado.</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 justify-start gap-3"
              onClick={() => {
                setPanelDialogOpen(false);
                navigate("/declaracao");
              }}
            >
              <LogOut className="w-6 h-6 text-destructive shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Fechar Caixa</p>
                <p className="text-xs text-muted-foreground">Ir para a declaração financeira e fecho de caixa.</p>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
