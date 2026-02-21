import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit, FileText, Trash2, PackageCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductSearchInput } from "@/components/compras/ProductSearchInput";
import { useProducts, type ProductRow } from "@/hooks/useProducts";

interface Supplier { id: string; name: string; }
interface PurchaseOrder {
  id: string; company_id: string; supplier_id: string; order_number: string;
  status: string; notes: string | null; expected_date: string | null;
  total_amount: number; created_at: string;
}
interface POItem {
  id?: string; product_name: string; sku: string;
  box_quantity: number; pack_size: number; total_units: number;
  unit_cost: number; total_cost: number;
  quantity_ordered: number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho", sent: "Enviada", partial: "Parcial", received: "Recebida", cancelled: "Cancelada",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-700 border-blue-200",
  partial: "bg-amber-500/10 text-amber-700 border-amber-200",
  received: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

function formatKz(v: number) {
  return v.toLocaleString("pt-AO", { minimumFractionDigits: 2 }) + " Kz";
}

export default function PurchaseOrders() {
  const queryClient = useQueryClient();
  const { companyId, activeUser } = useAuth();
  const navigate = useNavigate();
  const { data: dbProducts = [] } = useProducts();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({ supplier_id: "", notes: "", expected_date: "" });
  const [items, setItems] = useState<POItem[]>([]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("purchase_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (selected) {
        const totalAmount = items.reduce((s, i) => s + i.total_cost, 0);
        const { error } = await (supabase as any).from("purchase_orders")
          .update({ supplier_id: form.supplier_id, notes: form.notes || null, expected_date: form.expected_date || null, total_amount: totalAmount })
          .eq("id", selected.id);
        if (error) throw error;
        await (supabase as any).from("purchase_order_items").delete().eq("purchase_order_id", selected.id);
        if (items.length > 0) {
          const rows = items.map((i) => ({ purchase_order_id: selected.id, product_name: i.product_name, sku: i.sku, quantity_ordered: i.total_units, unit_cost: i.unit_cost, total_cost: i.total_cost, quantity_received: 0 }));
          const { error: ie } = await (supabase as any).from("purchase_order_items").insert(rows);
          if (ie) throw ie;
        }
      } else {
        const { data: numData, error: numErr } = await (supabase as any).rpc("generate_next_order_number", { _company_id: companyId });
        if (numErr) throw numErr;
        const totalAmount = items.reduce((s, i) => s + i.total_cost, 0);
        const { data: newOrder, error } = await (supabase as any).from("purchase_orders")
          .insert({ company_id: companyId, supplier_id: form.supplier_id, order_number: numData, notes: form.notes || null, expected_date: form.expected_date || null, total_amount: totalAmount, created_by: activeUser?.id })
          .select("id").single();
        if (error) throw error;
        if (items.length > 0) {
          const rows = items.map((i) => ({ purchase_order_id: newOrder.id, product_name: i.product_name, sku: i.sku, quantity_ordered: i.total_units, unit_cost: i.unit_cost, total_cost: i.total_cost, quantity_received: 0 }));
          const { error: ie } = await (supabase as any).from("purchase_order_items").insert(rows);
          if (ie) throw ie;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success(selected ? "Ordem actualizada" : "Ordem criada");
      setDialogOpen(false);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("Estado actualizado");
    },
  });

  const openCreate = () => {
    setSelected(null);
    setForm({ supplier_id: "", notes: "", expected_date: "" });
    setItems([]);
    setDialogOpen(true);
  };

  const openEdit = async (o: PurchaseOrder) => {
    setSelected(o);
    setForm({ supplier_id: o.supplier_id, notes: o.notes ?? "", expected_date: o.expected_date ?? "" });
    const { data } = await (supabase as any).from("purchase_order_items").select("*").eq("purchase_order_id", o.id);
    setItems((data ?? []).map((i: any) => ({
      id: i.id, product_name: i.product_name, sku: i.sku ?? "",
      box_quantity: Number(i.quantity_ordered), pack_size: 1, total_units: Number(i.quantity_ordered),
      unit_cost: Number(i.unit_cost), total_cost: Number(i.total_cost),
      quantity_ordered: Number(i.quantity_ordered),
    })));
    setDialogOpen(true);
  };

  const handleProductSelect = (product: ProductRow) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.sku === product.sku);
      if (existing >= 0) {
        return prev.map((item, idx) => {
          if (idx !== existing) return item;
          const newBoxQty = item.box_quantity + 1;
          const newTotalUnits = newBoxQty * item.pack_size;
          return { ...item, box_quantity: newBoxQty, total_units: newTotalUnits, quantity_ordered: newTotalUnits, total_cost: newTotalUnits * item.unit_cost };
        });
      }
      const newItem: POItem = {
        product_name: product.name, sku: product.sku,
        box_quantity: 1, pack_size: product.pack_size,
        total_units: product.pack_size,
        unit_cost: product.cost_price, total_cost: product.pack_size * product.cost_price,
        quantity_ordered: product.pack_size,
      };
      return [...prev, newItem];
    });
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: number) => {
    setItems(items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "box_quantity" || field === "unit_cost") {
        updated.total_units = updated.box_quantity * updated.pack_size;
        updated.quantity_ordered = updated.total_units;
        updated.total_cost = updated.total_units * updated.unit_cost;
      }
      return updated;
    }));
  };

  const getSupplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";

  const filtered = orders.filter((o) =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    getSupplierName(o.supplier_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lista de Compras</h1>
            <p className="text-sm text-muted-foreground">Notas de encomenda e ordens de compra</p>
          </div>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Nova Ordem</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card><CardContent className="flex items-center gap-3 p-4"><div className="p-2 rounded-lg bg-primary/10"><FileText className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">Total Ordens</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><div className="p-2 rounded-lg bg-blue-500/10"><FileText className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{orders.filter((o) => o.status === "draft").length}</p><p className="text-xs text-muted-foreground">Rascunhos</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><div className="p-2 rounded-lg bg-amber-500/10"><FileText className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{orders.filter((o) => o.status === "sent" || o.status === "partial").length}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><div className="p-2 rounded-lg bg-green-500/10"><PackageCheck className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{orders.filter((o) => o.status === "received").length}</p><p className="text-xs text-muted-foreground">Recebidas</p></div></CardContent></Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar ordens..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Ordem</TableHead><TableHead>Fornecedor</TableHead><TableHead>Data Prevista</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">A carregar...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma ordem encontrada.</TableCell></TableRow>
                ) : (
                  filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium font-mono">{o.order_number}</TableCell>
                      <TableCell>{getSupplierName(o.supplier_id)}</TableCell>
                      <TableCell className="text-muted-foreground">{o.expected_date ? new Date(o.expected_date).toLocaleDateString("pt-AO") : "—"}</TableCell>
                      <TableCell>{formatKz(Number(o.total_amount))}</TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        {o.status === "draft" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: o.id, status: "sent" })}>Enviar</Button>
                          </>
                        )}
                        {(o.status === "sent" || o.status === "partial") && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/recebimento?po=${o.id}`)}><PackageCheck className="w-3.5 h-3.5" /> Receber</Button>
                        )}
                        {o.status === "draft" && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateStatus.mutate({ id: o.id, status: "cancelled" })}>Cancelar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
            <DialogHeader><DialogTitle>{selected ? `Editar ${selected.order_number}` : "Nova Ordem de Compra"}</DialogTitle></DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fornecedor *</Label>
                    <Select value={form.supplier_id} onValueChange={(v) => setForm((f) => ({ ...f, supplier_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>{suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Prevista</Label>
                    <Input type="date" value={form.expected_date} onChange={(e) => setForm((f) => ({ ...f, expected_date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                <div className="space-y-2">
                  <Label>Itens</Label>
                  <ProductSearchInput products={dbProducts} onSelect={handleProductSelect} dialogOpen={dialogOpen} />
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead><TableHead>SKU</TableHead><TableHead className="w-24">Qtd Caixas</TableHead><TableHead className="w-24">Un/Caixa</TableHead><TableHead className="w-28">Total Un.</TableHead><TableHead className="w-28">Custo Unit.</TableHead><TableHead className="w-28">Total</TableHead><TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="text-center py-4 text-muted-foreground text-sm">Pesquise ou escaneie produtos para adicionar</TableCell></TableRow>
                        ) : items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                            <TableCell><Input type="number" value={item.box_quantity} onChange={(e) => updateItem(idx, "box_quantity", Math.max(1, Number(e.target.value)))} className="h-8" min={1} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.pack_size}</TableCell>
                            <TableCell className="text-sm font-medium">{item.total_units}</TableCell>
                            <TableCell><Input type="number" value={item.unit_cost} onChange={(e) => updateItem(idx, "unit_cost", Number(e.target.value))} className="h-8" min={0} step="0.01" /></TableCell>
                            <TableCell className="text-sm font-medium">{formatKz(item.total_cost)}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {items.length > 0 && <div className="text-right text-sm font-semibold">Total: {formatKz(items.reduce((s, i) => s + i.total_cost, 0))}</div>}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.supplier_id || items.length === 0}>
                {saveMutation.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
