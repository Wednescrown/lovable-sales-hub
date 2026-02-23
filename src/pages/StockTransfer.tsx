import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ArrowRightLeft, Plus, Search, Package, Building2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/hooks/useBranches";
import { useProducts, type ProductRow } from "@/hooks/useProducts";
import { useBranchStock, useBranchStockMutations } from "@/hooks/useBranchStock";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TransferItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  available: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  completed: { label: "Concluída", color: "bg-success/15 text-success border-success/30", icon: CheckCircle },
  cancelled: { label: "Cancelada", color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
};

const StockTransfer = () => {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: branches = [] } = useBranches();
  const { data: products = [] } = useProducts();
  const { upsertBranchStock } = useBranchStockMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch source branch stock
  const { data: sourceBranchStock = [] } = useBranchStock(fromBranch || undefined);

  const sourceStockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const bs of sourceBranchStock) {
      map.set(bs.product_id, bs.quantity);
    }
    return map;
  }, [sourceBranchStock]);

  // Fetch transfers history
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["stock_transfers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("stock_transfers")
        .select("*, stock_transfer_items(*)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const createTransferMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      // Generate transfer number
      const { data: transferNumber, error: numErr } = await supabase.rpc(
        "generate_next_transfer_number",
        { _company_id: companyId }
      );
      if (numErr) throw numErr;

      // Insert transfer header
      const { data: transfer, error: tErr } = await supabase
        .from("stock_transfers")
        .insert({
          company_id: companyId,
          transfer_number: transferNumber,
          from_branch_id: fromBranch,
          to_branch_id: toBranch,
          notes: notes || null,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (tErr) throw tErr;

      // Insert items
      const itemRows = items.map((item) => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      const { error: iErr } = await supabase
        .from("stock_transfer_items")
        .insert(itemRows);
      if (iErr) throw iErr;

      // Update branch_stock: subtract from source, add to destination
      for (const item of items) {
        const currentSource = sourceStockMap.get(item.product_id) ?? 0;
        await upsertBranchStock.mutateAsync({
          product_id: item.product_id,
          branch_id: fromBranch,
          quantity: Math.max(0, currentSource - item.quantity),
        });

        // Get destination current stock
        const { data: destStock } = await supabase
          .from("branch_stock")
          .select("quantity")
          .eq("product_id", item.product_id)
          .eq("branch_id", toBranch)
          .maybeSingle();

        const destQty = destStock?.quantity ?? 0;
        await upsertBranchStock.mutateAsync({
          product_id: item.product_id,
          branch_id: toBranch,
          quantity: destQty + item.quantity,
        });
      }

      return transfer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_transfers"] });
      qc.invalidateQueries({ queryKey: ["branch_stock"] });
      toast({ title: "Transferência criada", description: "O stock foi movido com sucesso." });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setFromBranch("");
    setToBranch("");
    setNotes("");
    setItems([]);
    setProductSearch("");
  };

  const addProduct = (product: ProductRow) => {
    if (items.find((i) => i.product_id === product.id)) return;
    const available = sourceStockMap.get(product.id) ?? 0;
    setItems((prev) => [
      ...prev,
      { product_id: product.id, product_name: product.name, sku: product.sku, quantity: 1, available },
    ]);
    setProductSearch("");
  };

  const updateItemQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(qty, i.available)) } : i))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const filteredSearchProducts = products.filter(
    (p) =>
      p.status === "active" &&
      (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())) &&
      !items.find((i) => i.product_id === p.id)
  ).slice(0, 8);

  const canSubmit = fromBranch && toBranch && fromBranch !== toBranch && items.length > 0 && items.every((i) => i.quantity > 0 && i.quantity <= i.available);

  const getBranchName = (id: string) => branches.find((b) => b.id === id)?.name || id;

  const filteredTransfers = transfers.filter((t: any) => {
    const matchSearch = t.transfer_number?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const todayTransfers = transfers.filter((t: any) => {
    const d = new Date(t.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Movimentação de Stock
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Transferência de produtos entre filiais</p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Transferência
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transferências</p>
                <p className="text-lg font-bold text-foreground">{transfers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluídas Hoje</p>
                <p className="text-lg font-bold text-foreground">{todayTransfers.filter((t: any) => t.status === "completed").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-foreground">{transfers.filter((t: any) => t.status === "pending").length}</p>
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
                <Input placeholder="Pesquisar por número..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Histórico ({filteredTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-center">Itens</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                ) : filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Nenhuma transferência encontrada.</TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map((t: any) => {
                    const cfg = statusConfig[t.status] || statusConfig.pending;
                    return (
                      <TableRow key={t.id}>
                        <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{t.transfer_number}</code></TableCell>
                        <TableCell className="text-sm">{getBranchName(t.from_branch_id)}</TableCell>
                        <TableCell className="text-sm">{getBranchName(t.to_branch_id)}</TableCell>
                        <TableCell className="text-center text-sm">{t.stock_transfer_items?.length || 0}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("pt-AO")} {new Date(t.created_at).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{t.notes || "—"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Transfer Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Transferência de Stock</DialogTitle>
              <DialogDescription>Selecione as filiais e os produtos a transferir.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Branch selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Filial de Origem</Label>
                  <Select value={fromBranch} onValueChange={(v) => { setFromBranch(v); setItems([]); }}>
                    <SelectTrigger className="h-9 text-sm">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id} disabled={b.id === toBranch}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Filial de Destino</Label>
                  <Select value={toBranch} onValueChange={setToBranch}>
                    <SelectTrigger className="h-9 text-sm">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id} disabled={b.id === fromBranch}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product search */}
              {fromBranch && toBranch && fromBranch !== toBranch && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Adicionar Produtos</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar produto por nome ou SKU..."
                      className="pl-9 h-9 text-sm"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  {productSearch && filteredSearchProducts.length > 0 && (
                    <div className="border rounded-md bg-popover max-h-40 overflow-y-auto">
                      {filteredSearchProducts.map((p) => {
                        const avail = sourceStockMap.get(p.id) ?? 0;
                        return (
                          <button
                            key={p.id}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                            onClick={() => addProduct(p)}
                            disabled={avail <= 0}
                          >
                            <span>{p.name} <span className="text-muted-foreground text-xs">({p.sku})</span></span>
                            <span className={`text-xs ${avail <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                              Disp: {avail}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Items table */}
              {items.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[80px] text-center">Disp.</TableHead>
                        <TableHead className="w-[100px] text-center">Qtd.</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.sku}</p>
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">{item.available}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={1}
                              max={item.available}
                              value={item.quantity}
                              onChange={(e) => updateItemQty(item.product_id, Number(e.target.value))}
                              className="h-8 text-sm text-center w-20 mx-auto"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => removeItem(item.product_id)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Observações (opcional)</Label>
                <Textarea
                  placeholder="Motivo da transferência..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm h-20"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button
                onClick={() => createTransferMutation.mutate()}
                disabled={!canSubmit || createTransferMutation.isPending}
              >
                {createTransferMutation.isPending ? "A transferir..." : "Confirmar Transferência"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default StockTransfer;
