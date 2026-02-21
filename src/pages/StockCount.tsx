import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ClipboardCheck, Search, Save, CheckCircle2, Package, Barcode, Edit, AlertTriangle, TrendingDown, TrendingUp, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useProducts, type ProductRow } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type CountItem } from "@/data/mockInventory";

function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}

const StockCountPage = () => {
  const { data: products = [] } = useProducts();
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const [selectedStore, setSelectedStore] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [listSearch, setListSearch] = useState("");

  const [detailProduct, setDetailProduct] = useState<ProductRow | null>(null);
  const [detailQty, setDetailQty] = useState("");

  const [uncountedOpen, setUncountedOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [uncountedQtys, setUncountedQtys] = useState<Record<string, string>>({});
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>();

  const activeProducts = products.filter((p) => p.status === "active");

  const searchResults = useMemo(() => {
    if (!productSearch) return [];
    return activeProducts
      .filter((p) => !countItems.some((c) => c.productId === p.id) && (p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || "").includes(productSearch) || p.sku.toLowerCase().includes(productSearch.toLowerCase())))
      .slice(0, 5);
  }, [productSearch, countItems, activeProducts]);

  const filteredCountItems = useMemo(() => {
    if (!listSearch) return countItems;
    return countItems.filter((c) => c.productName.toLowerCase().includes(listSearch.toLowerCase()));
  }, [countItems, listSearch]);

  const openProductDetail = (product: ProductRow) => { setDetailProduct(product); setDetailQty(""); };

  const confirmProductDetail = () => {
    if (!detailProduct) return;
    addProduct(detailProduct.id, parseInt(detailQty) || 0);
    setDetailProduct(null); setDetailQty("");
  };

  const addProduct = (productId: string, countedQty: number = 0) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const existing = countItems.find((c) => c.productId === productId);
    if (existing) {
      setCountItems(countItems.map((c) => c.productId === productId ? { ...c, countedQty: c.countedQty + countedQty, differenceQty: c.countedQty + countedQty - c.systemQty, differenceCostValue: (c.countedQty + countedQty - c.systemQty) * product.cost_price, differenceSellValue: (c.countedQty + countedQty - c.systemQty) * product.sell_price } : c));
    } else {
      const diff = countedQty - product.stock;
      setCountItems([...countItems, { productId: product.id, productName: product.name, systemQty: product.stock, countedQty, differenceQty: diff, costPrice: product.cost_price, sellPrice: product.sell_price, differenceCostValue: diff * product.cost_price, differenceSellValue: diff * product.sell_price }]);
    }
    setProductSearch("");
  };

  const updateCountedQty = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCountItems(countItems.map((c) => c.productId === productId ? { ...c, countedQty: qty, differenceQty: qty - c.systemQty, differenceCostValue: (qty - c.systemQty) * product.cost_price, differenceSellValue: (qty - c.systemQty) * product.sell_price } : c));
    setEditingId(null);
  };

  const totalCostLoss = countItems.reduce((s, c) => s + (c.differenceCostValue < 0 ? c.differenceCostValue : 0), 0);
  const totalSellDiff = countItems.reduce((s, c) => s + c.differenceSellValue, 0);
  const generalBalance = countItems.reduce((s, c) => s + c.differenceCostValue, 0);
  const countedCount = countItems.length;
  const totalStoreProducts = activeProducts.length;
  const uncountedProducts = activeProducts.filter((p) => p.stock > 0 && !countItems.some((c) => c.productId === p.id));

  const handleFinalize = () => { if (uncountedProducts.length > 0) setUncountedOpen(true); else setPeriodOpen(true); };
  const handleUncountedContinue = () => { Object.entries(uncountedQtys).forEach(([productId, qty]) => { if (qty) addProduct(productId, parseInt(qty) || 0); }); setUncountedOpen(false); setUncountedQtys({}); setPeriodOpen(true); };

  const totalStockValue = countItems.reduce((s, c) => s + c.countedQty * c.costPrice, 0);
  const totalLosses = Math.abs(totalCostLoss);
  const diffColor = (val: number) => (val > 0 ? "text-success" : val < 0 ? "text-destructive" : "text-muted-foreground");
  const diffPrefix = (val: number) => (val > 0 ? "+" : "");

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" />Contagem Geral de Inventário</h1><p className="text-xs text-muted-foreground mt-0.5">Realize a contagem completa do inventário por filial</p></div>
          <div className="flex items-center gap-2">
            <Select value={selectedStore} onValueChange={setSelectedStore}><SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Selecionar Filial" /></SelectTrigger><SelectContent>{branches.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select>
            <Button variant="outline" size="sm"><Save className="w-4 h-4 mr-1" />Salvar Rascunho</Button>
            <Button size="sm" onClick={handleFinalize} disabled={countItems.length === 0}><CheckCircle2 className="w-4 h-4 mr-1" />Finalizar Inventário</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">Perda em Stock (Custo)</p><p className="text-lg font-bold text-destructive">{formatKz(Math.abs(totalCostLoss))}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalSellDiff >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>{totalSellDiff >= 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}</div><div><p className="text-xs text-muted-foreground">Diferença Valor Venda</p><p className={`text-lg font-bold ${diffColor(totalSellDiff)}`}>{diffPrefix(totalSellDiff)}{formatKz(totalSellDiff)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${generalBalance >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>{generalBalance >= 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}</div><div><p className="text-xs text-muted-foreground">Balanço Geral</p><p className={`text-lg font-bold ${diffColor(generalBalance)}`}>{diffPrefix(generalBalance)}{formatKz(generalBalance)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Produtos Contados</p><p className="text-lg font-bold text-foreground">{countedCount} <span className="text-xs font-normal text-muted-foreground">/ {totalStoreProducts}</span></p></div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Pesquisar produto por nome ou código de barras para adicionar..." className="pl-9 h-9 text-sm" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} /></div>
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-md bg-popover shadow-sm max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between border-b last:border-b-0" onClick={() => openProductDetail(p)}>
                    <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.barcode || ""} · Stock: {p.stock}</p></div></div>
                    <span className="text-xs text-primary">+ Adicionar</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold">Lista de Contagem ({countItems.length} produtos)</CardTitle>
              {countItems.length > 0 && (<div className="relative w-64"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input placeholder="Filtrar na lista..." className="pl-8 h-8 text-xs" value={listSearch} onChange={(e) => setListSearch(e.target.value)} /></div>)}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-center">Qtd. Sistema</TableHead><TableHead className="text-center">Qtd. Contada</TableHead><TableHead className="text-center">Diferença Qtd</TableHead><TableHead className="text-right">Dif. Valor Custo</TableHead><TableHead className="text-right">Dif. Valor Venda</TableHead><TableHead className="text-center w-[60px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredCountItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell><div className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground shrink-0" /><span className="text-sm font-medium">{item.productName}</span></div></TableCell>
                    <TableCell className="text-center text-sm">{item.systemQty}</TableCell>
                    <TableCell className="text-center">
                      {editingId === item.productId ? (<Input type="number" className="h-7 w-20 text-sm text-center mx-auto" value={editValue} autoFocus onChange={(e) => setEditValue(e.target.value)} onBlur={() => updateCountedQty(item.productId, parseInt(editValue) || 0)} onKeyDown={(e) => { if (e.key === "Enter") updateCountedQty(item.productId, parseInt(editValue) || 0); }} />) : (<span className="text-sm font-bold">{item.countedQty}</span>)}
                    </TableCell>
                    <TableCell className="text-center"><span className={`text-sm font-bold ${diffColor(item.differenceQty)}`}>{diffPrefix(item.differenceQty)}{item.differenceQty}</span></TableCell>
                    <TableCell className={`text-right text-xs font-medium ${diffColor(item.differenceCostValue)}`}>{diffPrefix(item.differenceCostValue)}{formatKz(item.differenceCostValue)}</TableCell>
                    <TableCell className={`text-right text-xs font-medium ${diffColor(item.differenceSellValue)}`}>{diffPrefix(item.differenceSellValue)}{formatKz(item.differenceSellValue)}</TableCell>
                    <TableCell className="text-center"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(item.productId); setEditValue(item.countedQty.toString()); }}><Edit className="w-3.5 h-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
                {countItems.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground"><Barcode className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />Pesquise e adicione produtos para iniciar a contagem.</TableCell></TableRow>)}
                {countItems.length > 0 && filteredCountItems.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Nenhum produto encontrado na lista.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Detail Dialog */}
        <Dialog open={!!detailProduct} onOpenChange={(open) => { if (!open) setDetailProduct(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Detalhe do Produto</DialogTitle><DialogDescription>Insira a quantidade contada para adicionar à lista.</DialogDescription></DialogHeader>
            {detailProduct && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{detailProduct.name}</p></div>
                  <div><p className="text-xs text-muted-foreground">SKU</p><p className="font-mono text-xs">{detailProduct.sku}</p></div>
                  <div><p className="text-xs text-muted-foreground">Código de Barras</p><p className="font-mono text-xs">{detailProduct.barcode || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Categoria</p><p>{detailProduct.category_name || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Stock no Sistema</p><p className="font-bold text-lg">{detailProduct.stock}</p></div>
                  <div><p className="text-xs text-muted-foreground">Preço Custo</p><p>{formatKz(detailProduct.cost_price)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Preço Venda</p><p className="font-medium">{formatKz(detailProduct.sell_price)}</p></div>
                </div>
                <div className="grid gap-1.5"><Label className="text-xs font-medium">Quantidade Contada</Label><Input type="number" min="0" placeholder="0" className="h-10 text-lg font-bold text-center" value={detailQty} autoFocus onChange={(e) => setDetailQty(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmProductDetail(); }} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setDetailProduct(null)}>Cancelar</Button><Button onClick={confirmProductDetail}>Adicionar à Lista</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Uncounted Products Dialog */}
        <Dialog open={uncountedOpen} onOpenChange={setUncountedOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning" />Produtos Não Contados</DialogTitle><DialogDescription>Os seguintes produtos possuem stock no sistema mas não foram incluídos na contagem.</DialogDescription></DialogHeader>
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-center">Stock Sistema</TableHead><TableHead className="text-center w-[120px]">Qtd. Contada</TableHead></TableRow></TableHeader>
              <TableBody>
                {uncountedProducts.map((p) => (
                  <TableRow key={p.id}><TableCell className="text-sm font-medium">{p.name}</TableCell><TableCell className="text-center text-sm">{p.stock}</TableCell><TableCell className="text-center"><Input type="number" min="0" placeholder="0" className="h-7 w-20 text-sm text-center mx-auto" value={uncountedQtys[p.id] || ""} onChange={(e) => setUncountedQtys({ ...uncountedQtys, [p.id]: e.target.value })} /></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
            <DialogFooter><Button variant="outline" onClick={() => { setUncountedOpen(false); setPeriodOpen(true); }}>Ignorar e Continuar</Button><Button onClick={handleUncountedContinue}>Adicionar à Contagem</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Period / Final Summary Dialog */}
        <Dialog open={periodOpen} onOpenChange={setPeriodOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" />Resumo do Inventário</DialogTitle><DialogDescription>Defina o período e revise o resumo final.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Data do Último Inventário</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !periodStartDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{periodStartDate ? format(periodStartDate, "dd/MM/yyyy", { locale: pt }) : "Selecionar data"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={periodStartDate} onSelect={setPeriodStartDate} initialFocus className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"><span className="text-sm text-muted-foreground">Valor Total do Estoque (Custo)</span><span className="text-sm font-bold">{formatKz(totalStockValue)}</span></div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"><span className="text-sm text-muted-foreground">Perdas Obtidas</span><span className="text-sm font-bold text-destructive">{formatKz(totalLosses)}</span></div>
                <div className={`flex items-center justify-between p-3 rounded-lg border ${generalBalance >= 0 ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"}`}><span className="text-sm text-muted-foreground">Saldo (Balanço Geral)</span><span className={`text-sm font-bold ${diffColor(generalBalance)}`}>{diffPrefix(generalBalance)}{formatKz(generalBalance)}</span></div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"><span className="text-sm text-muted-foreground">Produtos Contados</span><span className="text-sm font-bold">{countedCount} / {totalStoreProducts}</span></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setPeriodOpen(false)}>Voltar</Button><Button onClick={() => setPeriodOpen(false)}>Confirmar Inventário</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default StockCountPage;
