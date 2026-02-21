import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ClipboardList, Search, Plus, TrendingUp, TrendingDown, ArrowUpDown, Package, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProducts, type ProductRow } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  adjustmentReasonLabels,
  type StockAdjustment,
  type AdjustmentType,
  type AdjustmentReason,
} from "@/data/mockInventory";

function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}

const StockAdjustmentPage = () => {
  const { data: products = [] } = useProducts();
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");

  const [formStore, setFormStore] = useState("");
  const [formSearch, setFormSearch] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formCountedQty, setFormCountedQty] = useState("");
  const [formType, setFormType] = useState<AdjustmentType>("reduce");
  const [formReason, setFormReason] = useState<AdjustmentReason | "">("");
  const [formObservation, setFormObservation] = useState("");

  const selectedProduct = products.find((p) => p.id === formProductId);

  const filteredProducts = useMemo(() => {
    if (!formSearch) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(formSearch.toLowerCase()) ||
        (p.barcode || "").includes(formSearch) ||
        p.sku.toLowerCase().includes(formSearch.toLowerCase())
    ).slice(0, 5);
  }, [formSearch, products]);

  const difference = useMemo(() => {
    if (!selectedProduct || !formCountedQty) return 0;
    const counted = parseInt(formCountedQty) || 0;
    return formType === "add" ? counted : -counted;
  }, [selectedProduct, formCountedQty, formType]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAdjustments = adjustments.filter((a) => a.date.startsWith(todayStr));
  const totalToday = todayAdjustments.length;
  const positiveToday = todayAdjustments.filter((a) => a.difference > 0).reduce((s, a) => s + a.difference, 0);
  const negativeToday = todayAdjustments.filter((a) => a.difference < 0).reduce((s, a) => s + a.difference, 0);

  const filteredAdjustments = adjustments.filter((a) => {
    const matchSearch = !searchFilter || a.productName.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStore = storeFilter === "all" || a.storeId === storeFilter;
    return matchSearch && matchStore;
  });

  const resetForm = () => {
    setFormStore(""); setFormSearch(""); setFormProductId(""); setFormCountedQty("");
    setFormType("reduce"); setFormReason(""); setFormObservation("");
  };

  const handleSubmit = () => {
    if (!selectedProduct || !formCountedQty || !formReason || !formStore) return;
    const store = branches.find((s) => s.id === formStore);
    const counted = parseInt(formCountedQty) || 0;
    const newAdj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      storeId: formStore,
      storeName: store?.name || "",
      type: formType,
      previousQty: selectedProduct.stock,
      newQty: formType === "add" ? selectedProduct.stock + counted : selectedProduct.stock - counted,
      difference: formType === "add" ? counted : -counted,
      reason: formReason as AdjustmentReason,
      observation: formObservation,
      user: "Admin",
    };
    setAdjustments([newAdj, ...adjustments]);
    setDialogOpen(false);
    resetForm();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" />Ajuste de Estoque</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Registre ajustes manuais de estoque por loja</p>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" />Novo Ajuste</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><ArrowUpDown className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Ajustes Hoje</p><p className="text-lg font-bold text-foreground">{totalToday}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success" /></div><div><p className="text-xs text-muted-foreground">Ajustes Positivos</p><p className="text-lg font-bold text-success">+{positiveToday}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">Ajustes Negativos</p><p className="text-lg font-bold text-destructive">{negativeToday}</p></div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Pesquisar produto..." className="pl-9 h-9 text-sm" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} /></div>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Filial" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Filiais</SelectItem>
                  {branches.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Histórico de Ajustes ({filteredAdjustments.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Produto</TableHead><TableHead>Filial</TableHead><TableHead className="text-center">Tipo</TableHead><TableHead className="text-center">Anterior</TableHead><TableHead className="text-center">Nova</TableHead><TableHead className="text-center">Diferença</TableHead><TableHead>Motivo</TableHead><TableHead>Usuário</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredAdjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{adj.date}</TableCell>
                    <TableCell className="text-sm font-medium">{adj.productName}</TableCell>
                    <TableCell className="text-xs">{adj.storeName}</TableCell>
                    <TableCell className="text-center"><Badge className={`text-[10px] ${adj.type === "add" ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>{adj.type === "add" ? "Adição" : "Redução"}</Badge></TableCell>
                    <TableCell className="text-center text-xs">{adj.previousQty}</TableCell>
                    <TableCell className="text-center text-xs">{adj.newQty}</TableCell>
                    <TableCell className="text-center"><span className={`text-sm font-bold ${adj.difference > 0 ? "text-success" : "text-destructive"}`}>{adj.difference > 0 ? `+${adj.difference}` : adj.difference}</span></TableCell>
                    <TableCell className="text-xs">{adjustmentReasonLabels[adj.reason]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{adj.user}</TableCell>
                  </TableRow>
                ))}
                {filteredAdjustments.length === 0 && (<TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Nenhum ajuste encontrado.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" />Novo Ajuste de Estoque</DialogTitle>
              <DialogDescription>Selecione a filial e o produto para registrar o ajuste.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Filial *</Label>
                <Select value={formStore} onValueChange={setFormStore}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar filial" /></SelectTrigger>
                  <SelectContent>{branches.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs flex items-center gap-1"><Barcode className="w-3 h-3" />Pesquisar Produto *</Label>
                <Input placeholder="Digite o nome ou código de barras..." className="h-9 text-sm" value={formSearch} onChange={(e) => { setFormSearch(e.target.value); setFormProductId(""); }} />
                {filteredProducts.length > 0 && !formProductId && (
                  <div className="border rounded-md bg-popover shadow-sm max-h-40 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2 border-b last:border-b-0" onClick={() => { setFormProductId(p.id); setFormSearch(p.name); }}>
                        <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div><p className="text-sm font-medium">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.barcode || ""} · {p.sku}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProduct && (
                <Card className="bg-muted/50"><CardContent className="p-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">{selectedProduct.name}</p><p className="text-[10px] text-muted-foreground">{selectedProduct.category_name} › {selectedProduct.subcategory_name}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Stock Sistema</p><p className="text-lg font-bold text-foreground">{selectedProduct.stock}</p></div></div></CardContent></Card>
              )}

              <div className="grid gap-1.5">
                <Label className="text-xs">Tipo de Ajuste *</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={formType === "add" ? "default" : "outline"} size="sm" className={formType === "add" ? "bg-success hover:bg-success/90 text-success-foreground" : ""} onClick={() => setFormType("add")}><TrendingUp className="w-4 h-4 mr-1" />Adicionar</Button>
                  <Button type="button" variant={formType === "reduce" ? "default" : "outline"} size="sm" className={formType === "reduce" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""} onClick={() => setFormType("reduce")}><TrendingDown className="w-4 h-4 mr-1" />Reduzir</Button>
                </div>
              </div>

              <div className="grid gap-1.5"><Label className="text-xs">Quantidade *</Label><Input type="number" min="1" placeholder="0" className="h-9 text-sm" value={formCountedQty} onChange={(e) => setFormCountedQty(e.target.value)} /></div>

              {selectedProduct && formCountedQty && (
                <div className={`p-3 rounded-lg border ${difference > 0 ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
                  <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Diferença</span><span className={`text-lg font-bold ${difference > 0 ? "text-success" : "text-destructive"}`}>{difference > 0 ? `+${difference}` : difference}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Novo stock: <span className="font-medium text-foreground">{selectedProduct.stock + difference}</span></p>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label className="text-xs">Motivo do Ajuste *</Label>
                <Select value={formReason} onValueChange={(v) => setFormReason(v as AdjustmentReason)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar motivo" /></SelectTrigger>
                  <SelectContent>{Object.entries(adjustmentReasonLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5"><Label className="text-xs">Observação</Label><Textarea placeholder="Descreva o motivo do ajuste..." className="text-sm" rows={3} value={formObservation} onChange={(e) => setFormObservation(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!selectedProduct || !formCountedQty || !formReason || !formStore}>Confirmar Ajuste</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default StockAdjustmentPage;
