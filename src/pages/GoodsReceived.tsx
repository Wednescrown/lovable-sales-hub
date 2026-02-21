import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, ReceiptText, Trash2, Undo2, Eye, PackageCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ProductSearchInput } from "@/components/compras/ProductSearchInput";
import { useProducts, type ProductRow } from "@/hooks/useProducts";

interface Supplier { id: string; name: string; }
interface GRN {
  id: string; company_id: string; supplier_id: string; purchase_order_id: string | null;
  grn_number: string; status: string; notes: string | null; total_amount: number;
  received_by: string | null; received_at: string; created_at: string;
}
interface GRNItem {
  id: string; grn_id: string; product_name: string; sku: string | null;
  quantity_received: number; unit_cost: number; total_cost: number;
}
interface GRNReturn {
  id: string; grn_id: string; return_number: string; reason: string | null;
  total_amount: number; returned_at: string;
}
interface NewGRNItem {
  product_name: string; sku: string;
  box_quantity: number; pack_size: number; total_units: number;
  unit_cost: number; total_cost: number;
  quantity_received: number;
}

const STATUS_LABELS: Record<string, string> = { received: "Recebido", returned: "Devolvido", corrected: "Corrigido" };
const STATUS_COLORS: Record<string, string> = {
  received: "bg-green-500/10 text-green-700 border-green-200",
  returned: "bg-red-500/10 text-red-700 border-red-200",
  corrected: "bg-amber-500/10 text-amber-700 border-amber-200",
};

function formatKz(v: number) { return v.toLocaleString("pt-AO", { minimumFractionDigits: 2 }) + " Kz"; }

export default function GoodsReceived() {
  const queryClient = useQueryClient();
  const { companyId, activeUser, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: dbProducts = [] } = useProducts();
  const [search, setSearch] = useState("");

  const [grnDialog, setGrnDialog] = useState(false);
  const [grnForm, setGrnForm] = useState({ supplier_id: "", notes: "", purchase_order_id: "" });
  const [grnItems, setGrnItems] = useState<NewGRNItem[]>([]);

  const [detailGRN, setDetailGRN] = useState<GRN | null>(null);
  const [detailItems, setDetailItems] = useState<GRNItem[]>([]);

  const [returnDialog, setReturnDialog] = useState(false);
  const [returnGRN, setReturnGRN] = useState<GRN | null>(null);
  const [returnItems, setReturnItems] = useState<{ grn_item_id: string; product_name: string; max_qty: number; quantity: number; unit_cost: number }[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [canReturn, setCanReturn] = useState(false);

  const { data: grns = [], isLoading } = useQuery({
    queryKey: ["goods_received_notes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("goods_received_notes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as GRN[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers_active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("suppliers").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const { data: grnReturns = [] } = useQuery({
    queryKey: ["grn_returns"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("grn_returns").select("*").order("returned_at", { ascending: false });
      if (error) throw error;
      return data as GRNReturn[];
    },
  });

  useEffect(() => {
    const poId = searchParams.get("po");
    if (poId && suppliers.length > 0) {
      (async () => {
        const { data: po } = await (supabase as any).from("purchase_orders").select("*").eq("id", poId).single();
        if (!po) return;
        const { data: poItems } = await (supabase as any).from("purchase_order_items").select("*").eq("purchase_order_id", poId);
        setGrnForm({ supplier_id: po.supplier_id, notes: `Ref: ${po.order_number}`, purchase_order_id: poId });
        setGrnItems((poItems ?? []).map((i: any) => {
          const qty = Number(i.quantity_ordered) - Number(i.quantity_received);
          return {
            product_name: i.product_name, sku: i.sku ?? "",
            box_quantity: qty, pack_size: 1, total_units: qty,
            quantity_received: qty,
            unit_cost: Number(i.unit_cost), total_cost: qty * Number(i.unit_cost),
          };
        }));
        setGrnDialog(true);
      })();
    }
  }, [searchParams, suppliers]);

  const createGRN = useMutation({
    mutationFn: async () => {
      const { data: numData, error: numErr } = await (supabase as any).rpc("generate_next_grn_number", { _company_id: companyId });
      if (numErr) throw numErr;
      const totalAmount = grnItems.reduce((s, i) => s + i.total_cost, 0);
      const { data: newGrn, error } = await (supabase as any).from("goods_received_notes")
        .insert({ company_id: companyId, supplier_id: grnForm.supplier_id, purchase_order_id: grnForm.purchase_order_id || null, grn_number: numData, notes: grnForm.notes || null, total_amount: totalAmount, received_by: activeUser?.id })
        .select("id").single();
      if (error) throw error;
      if (grnItems.length > 0) {
        const rows = grnItems.map((i) => ({ grn_id: newGrn.id, product_name: i.product_name, sku: i.sku || null, quantity_received: i.total_units, unit_cost: i.unit_cost, total_cost: i.total_cost }));
        const { error: ie } = await (supabase as any).from("grn_items").insert(rows);
        if (ie) throw ie;

        // Update stock for each received product
        for (const item of grnItems) {
          if (!item.sku) continue;
          const matchedProduct = dbProducts.find((p) => p.sku === item.sku);
          if (matchedProduct) {
            const newStock = matchedProduct.stock + item.total_units;
            await supabase.from("products").update({ stock: newStock }).eq("id", matchedProduct.id);
          }
        }
      }
      if (grnForm.purchase_order_id) {
        await (supabase as any).from("purchase_orders").update({ status: "received" }).eq("id", grnForm.purchase_order_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods_received_notes"] });
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Recebimento lançado com sucesso");
      setGrnDialog(false); setGrnItems([]); setGrnForm({ supplier_id: "", notes: "", purchase_order_id: "" });
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const createReturn = useMutation({
    mutationFn: async () => {
      if (!returnGRN) throw new Error("GRN não seleccionado");
      const { data: numData, error: numErr } = await (supabase as any).rpc("generate_next_return_number", { _company_id: companyId });
      if (numErr) throw numErr;
      const itemsToReturn = returnItems.filter((i) => i.quantity > 0);
      const totalAmount = itemsToReturn.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
      const { data: newReturn, error } = await (supabase as any).from("grn_returns")
        .insert({ company_id: companyId, grn_id: returnGRN.id, return_number: numData, reason: returnReason || null, total_amount: totalAmount, returned_by: activeUser?.id })
        .select("id").single();
      if (error) throw error;
      const rows = itemsToReturn.map((i) => ({ grn_return_id: newReturn.id, grn_item_id: i.grn_item_id, quantity_returned: i.quantity, unit_cost: i.unit_cost, total_cost: i.quantity * i.unit_cost }));
      const { error: ie } = await (supabase as any).from("grn_return_items").insert(rows);
      if (ie) throw ie;
      await (supabase as any).from("goods_received_notes").update({ status: "returned" }).eq("id", returnGRN.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods_received_notes"] });
      queryClient.invalidateQueries({ queryKey: ["grn_returns"] });
      toast.success("Devolução registada com sucesso");
      setReturnDialog(false);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const openDirectGRN = () => { setGrnForm({ supplier_id: "", notes: "", purchase_order_id: "" }); setGrnItems([]); setGrnDialog(true); };

  const handleProductSelect = (product: ProductRow) => {
    setGrnItems((prev) => {
      const existing = prev.findIndex((i) => i.sku === product.sku);
      if (existing >= 0) {
        return prev.map((item, idx) => {
          if (idx !== existing) return item;
          const newBoxQty = item.box_quantity + 1;
          const newTotalUnits = newBoxQty * item.pack_size;
          return { ...item, box_quantity: newBoxQty, total_units: newTotalUnits, quantity_received: newTotalUnits, total_cost: newTotalUnits * item.unit_cost };
        });
      }
      return [...prev, {
        product_name: product.name, sku: product.sku,
        box_quantity: 1, pack_size: product.pack_size,
        total_units: product.pack_size, quantity_received: product.pack_size,
        unit_cost: product.cost_price, total_cost: product.pack_size * product.cost_price,
      }];
    });
  };

  const removeGrnItem = (idx: number) => setGrnItems(grnItems.filter((_, i) => i !== idx));
  const updateGrnItem = (idx: number, field: string, value: number) => {
    setGrnItems(grnItems.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "box_quantity" || field === "unit_cost") {
        updated.total_units = updated.box_quantity * updated.pack_size;
        updated.quantity_received = updated.total_units;
        updated.total_cost = updated.total_units * updated.unit_cost;
      }
      return updated;
    }));
  };

  const viewDetail = async (grn: GRN) => {
    setDetailGRN(grn);
    const { data } = await (supabase as any).from("grn_items").select("*").eq("grn_id", grn.id);
    setDetailItems((data ?? []).map((i: any) => ({ ...i, quantity_received: Number(i.quantity_received), unit_cost: Number(i.unit_cost), total_cost: Number(i.total_cost) })));
  };

  const openReturn = async (grn: GRN) => {
    const { data: allowed } = await (supabase as any).rpc("can_return_grn", { _grn_id: grn.id, _user_id: activeUser?.user_id });
    if (!allowed) { toast.error("Prazo de devolução expirado (2 dias). Apenas o administrador pode devolver."); return; }
    setReturnGRN(grn); setCanReturn(true); setReturnReason("");
    const { data } = await (supabase as any).from("grn_items").select("*").eq("grn_id", grn.id);
    setReturnItems((data ?? []).map((i: any) => ({ grn_item_id: i.id, product_name: i.product_name, max_qty: Number(i.quantity_received), quantity: 0, unit_cost: Number(i.unit_cost) })));
    setReturnDialog(true);
  };

  const getSupplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";
  const filtered = grns.filter((g) => g.grn_number.toLowerCase().includes(search.toLowerCase()) || getSupplierName(g.supplier_id).toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">Recebimento (GRN)</h1><p className="text-sm text-muted-foreground">Lançar e gerir recebimentos de mercadoria</p></div>
          <Button onClick={openDirectGRN} className="gap-2"><Plus className="w-4 h-4" /> Recebimento Directo</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="flex items-center gap-3 p-4"><div className="p-2 rounded-lg bg-primary/10"><ReceiptText className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{grns.length}</p><p className="text-xs text-muted-foreground">Total Recebimentos</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><div className="p-2 rounded-lg bg-green-500/10"><PackageCheck className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{grns.filter((g) => g.status === "received").length}</p><p className="text-xs text-muted-foreground">Activos</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><div className="p-2 rounded-lg bg-red-500/10"><Undo2 className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold">{grnReturns.length}</p><p className="text-xs text-muted-foreground">Devoluções</p></div></CardContent></Card>
        </div>

        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Pesquisar recebimentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>

        <Card>
          <CardHeader><CardTitle className="text-base">Histórico de Recebimentos</CardTitle></CardHeader>
          <ScrollArea className="h-[450px]">
            <Table>
              <TableHeader><TableRow><TableHead>Nº Documento</TableHead><TableHead>Fornecedor</TableHead><TableHead>Data Recebimento</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acções</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">A carregar...</TableCell></TableRow>
                ) : filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum recebimento encontrado.</TableCell></TableRow>
                ) : filtered.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium font-mono">{g.grn_number}</TableCell>
                    <TableCell>{getSupplierName(g.supplier_id)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(g.received_at).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell>{formatKz(Number(g.total_amount))}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_COLORS[g.status] ?? ""}>{STATUS_LABELS[g.status] ?? g.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => viewDetail(g)}><Eye className="w-4 h-4" /></Button>
                      {g.status === "received" && (<Button variant="outline" size="sm" className="gap-1" onClick={() => openReturn(g)}><Undo2 className="w-3.5 h-3.5" /> Devolver</Button>)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!detailGRN} onOpenChange={(open) => !open && setDetailGRN(null)}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
            <DialogHeader><DialogTitle>Detalhes — {detailGRN?.grn_number}</DialogTitle></DialogHeader>
            {detailGRN && (
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Fornecedor:</span> {getSupplierName(detailGRN.supplier_id)}</div>
                    <div><span className="text-muted-foreground">Data:</span> {new Date(detailGRN.received_at).toLocaleString("pt-AO")}</div>
                    <div><span className="text-muted-foreground">Estado:</span> <Badge variant="outline" className={STATUS_COLORS[detailGRN.status]}>{STATUS_LABELS[detailGRN.status]}</Badge></div>
                    <div><span className="text-muted-foreground">Total:</span> <strong>{formatKz(Number(detailGRN.total_amount))}</strong></div>
                  </div>
                  {detailGRN.notes && <p className="text-sm text-muted-foreground">{detailGRN.notes}</p>}
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>SKU</TableHead><TableHead>Qtd</TableHead><TableHead>Custo</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {detailItems.map((i) => (<TableRow key={i.id}><TableCell>{i.product_name}</TableCell><TableCell className="text-muted-foreground">{i.sku ?? "—"}</TableCell><TableCell>{i.quantity_received}</TableCell><TableCell>{formatKz(i.unit_cost)}</TableCell><TableCell>{formatKz(i.total_cost)}</TableCell></TableRow>))}
                      </TableBody>
                    </Table>
                  </div>
                  {grnReturns.filter((r) => r.grn_id === detailGRN.id).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Devoluções</h4>
                      {grnReturns.filter((r) => r.grn_id === detailGRN.id).map((r) => (
                        <div key={r.id} className="p-3 rounded-lg border bg-muted/30 text-sm">
                          <div className="flex justify-between"><span className="font-mono font-medium">{r.return_number}</span><span className="text-muted-foreground">{new Date(r.returned_at).toLocaleDateString("pt-AO")}</span></div>
                          {r.reason && <p className="text-muted-foreground mt-1">{r.reason}</p>}
                          <p className="font-semibold mt-1">Total: {formatKz(Number(r.total_amount))}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* GRN Form Dialog */}
        <Dialog open={grnDialog} onOpenChange={setGrnDialog}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
            <DialogHeader><DialogTitle>Novo Recebimento</DialogTitle></DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fornecedor *</Label>
                    <Select value={grnForm.supplier_id} onValueChange={(v) => setGrnForm((f) => ({ ...f, supplier_id: v }))}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Notas</Label><Textarea value={grnForm.notes} onChange={(e) => setGrnForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Itens Recebidos</Label>
                  <ProductSearchInput products={dbProducts} onSelect={handleProductSelect} dialogOpen={grnDialog} />
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>SKU</TableHead><TableHead className="w-24">Qtd Caixas</TableHead><TableHead className="w-24">Un/Caixa</TableHead><TableHead className="w-28">Total Un.</TableHead><TableHead className="w-28">Custo Unit.</TableHead><TableHead className="w-28">Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {grnItems.length === 0 ? (<TableRow><TableCell colSpan={8} className="text-center py-4 text-muted-foreground text-sm">Pesquise ou escaneie produtos para adicionar</TableCell></TableRow>
                        ) : grnItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                            <TableCell><Input type="number" value={item.box_quantity} onChange={(e) => updateGrnItem(idx, "box_quantity", Math.max(1, Number(e.target.value)))} className="h-8" min={1} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.pack_size}</TableCell>
                            <TableCell className="text-sm font-medium">{item.total_units}</TableCell>
                            <TableCell><Input type="number" value={item.unit_cost} onChange={(e) => updateGrnItem(idx, "unit_cost", Number(e.target.value))} className="h-8" min={0} step="0.01" /></TableCell>
                            <TableCell className="text-sm font-medium">{formatKz(item.total_cost)}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeGrnItem(idx)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {grnItems.length > 0 && <div className="text-right text-sm font-semibold">Total: {formatKz(grnItems.reduce((s, i) => s + i.total_cost, 0))}</div>}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setGrnDialog(false)}>Cancelar</Button>
              <Button onClick={() => createGRN.mutate()} disabled={createGRN.isPending || !grnForm.supplier_id || grnItems.length === 0}>{createGRN.isPending ? "A lançar..." : "Lançar Recebimento"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Return Dialog */}
        <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
            <DialogHeader><DialogTitle>Devolução — {returnGRN?.grn_number}</DialogTitle></DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label>Motivo da devolução</Label><Textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={2} /></div>
                <div className="space-y-2">
                  <Label>Itens a devolver</Label>
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="w-24">Máx</TableHead><TableHead className="w-28">Devolver</TableHead><TableHead className="w-28">Custo</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {returnItems.map((item, idx) => (
                          <TableRow key={item.grn_item_id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.max_qty}</TableCell>
                            <TableCell><Input type="number" value={item.quantity} min={0} max={item.max_qty} onChange={(e) => setReturnItems(returnItems.map((ri, i) => i === idx ? { ...ri, quantity: Math.min(Number(e.target.value), ri.max_qty) } : ri))} className="h-8" /></TableCell>
                            <TableCell className="text-sm">{formatKz(item.quantity * item.unit_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-right text-sm font-semibold">Total devolução: {formatKz(returnItems.reduce((s, i) => s + i.quantity * i.unit_cost, 0))}</div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setReturnDialog(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => createReturn.mutate()} disabled={createReturn.isPending || returnItems.every((i) => i.quantity === 0)}>{createReturn.isPending ? "A processar..." : "Confirmar Devolução"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
