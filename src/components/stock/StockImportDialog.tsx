import { useState } from "react";
import { Upload, ArrowRight, ArrowLeft, Check, AlertTriangle, FileSpreadsheet, Link2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useProductMutations, type ProductRow } from "@/hooks/useProducts";
import { useBranches } from "@/hooks/useBranches";
import { useBranchStockMutations } from "@/hooks/useBranchStock";

interface StockImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SystemField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

const SYSTEM_FIELDS: SystemField[] = [
  { key: "barcode", label: "Código de Barras", required: true, description: "Para identificar o produto" },
  { key: "quantity", label: "Quantidade", required: true, description: "Nova quantidade em stock" },
];

type Step = "branch" | "upload" | "mapping" | "preview" | "importing";

export function StockImportDialog({ open, onOpenChange }: StockImportDialogProps) {
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  const { data: branches = [] } = useBranches();
  const { updateProduct } = useProductMutations();
  const { upsertBranchStock } = useBranchStockMutations();

  const [step, setStep] = useState<Step>("branch");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [fileData, setFileData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: 0, notFound: 0 });

  const fileHeaders = fileData.length > 0 ? fileData[0] : [];
  const fileRows = fileData.slice(1);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const reset = () => {
    setStep("branch");
    setSelectedBranchId("");
    setFileData([]);
    setFileName("");
    setMapping({});
    setImporting(false);
    setImportProgress({ current: 0, total: 0, errors: 0, notFound: 0 });
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = text
        .split("\n")
        .filter((r) => r.trim())
        .map((row) => row.split(/[,;\t]/).map((c) => c.trim()));
      if (rows.length < 2) {
        toast({ title: "Ficheiro vazio", description: "O ficheiro não contém dados suficientes.", variant: "destructive" });
        return;
      }
      setFileData(rows);
      const headers = rows[0];
      const autoMap: Record<string, string> = {};
      const patterns: Record<string, RegExp> = {
        barcode: /^(barcode|codigo.*barra|cod.*bar|ean|gtin|c[oó]d)/i,
        quantity: /^(qtd|quant|stock|estoque|atual|disponivel|amount|qty)/i,
      };
      headers.forEach((h) => {
        for (const [field, pattern] of Object.entries(patterns)) {
          if (pattern.test(h) && !autoMap[field]) {
            autoMap[field] = h;
            break;
          }
        }
      });
      setMapping(autoMap);
      setStep("mapping");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const hasIdentifier = !!mapping.barcode;
  const hasQuantity = !!mapping.quantity;
  const canProceed = hasIdentifier && hasQuantity;

  const getMappedValue = (row: string[], fieldKey: string): string | null => {
    const headerName = mapping[fieldKey];
    if (!headerName) return null;
    const idx = fileHeaders.indexOf(headerName);
    if (idx === -1) return null;
    const val = row[idx]?.trim();
    return val === "" || val === undefined ? null : val;
  };

  const findProduct = (row: string[]): ProductRow | undefined => {
    const barcode = getMappedValue(row, "barcode");
    if (!barcode) return undefined;
    return products.find((p) => p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase());
  };

  const previewData = fileRows.slice(0, 30).map((row) => {
    const product = findProduct(row);
    const qty = getMappedValue(row, "quantity");
    const identifier = getMappedValue(row, "barcode") || "—";
    return {
      identifier,
      product,
      newQty: qty ? Number(qty) : null,
      currentQty: product?.stock ?? null,
    };
  });

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");
    const total = fileRows.length;
    let current = 0;
    let errors = 0;
    let notFound = 0;

    for (const row of fileRows) {
      current++;
      const product = findProduct(row);
      const qtyStr = getMappedValue(row, "quantity");

      if (!product) {
        notFound++;
        setImportProgress({ current, total, errors, notFound });
        continue;
      }

      if (qtyStr === null) {
        errors++;
        setImportProgress({ current, total, errors, notFound });
        continue;
      }

      const newStock = Number(qtyStr);
      if (isNaN(newStock)) {
        errors++;
        setImportProgress({ current, total, errors, notFound });
        continue;
      }

      try {
        // Update branch_stock for the selected branch
        await upsertBranchStock.mutateAsync({
          product_id: product.id,
          branch_id: selectedBranchId,
          quantity: newStock,
        });
        // Also update the global product stock (sum would be ideal but for now set it)
        await updateProduct.mutateAsync({ id: product.id, stock: newStock });
      } catch {
        errors++;
      }
      setImportProgress({ current, total, errors, notFound });
    }

    setImporting(false);
    const updated = total - errors - notFound;
    toast({
      title: "Importação de stock concluída",
      description: `${updated} produtos actualizados na filial ${selectedBranch?.name || ""}.${notFound > 0 ? ` ${notFound} não encontrados.` : ""}${errors > 0 ? ` ${errors} erros.` : ""}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Importar Quantidades de Stock
          </DialogTitle>
          <DialogDescription>
            {step === "branch" && "Selecione a filial que vai receber as quantidades importadas."}
            {step === "upload" && "Selecione um ficheiro CSV ou Excel com as quantidades a importar."}
            {step === "mapping" && "Ligue os campos do ficheiro aos campos do sistema para identificar produtos e quantidades."}
            {step === "preview" && "Verifique a correspondência entre os produtos do sistema e o ficheiro."}
            {step === "importing" && "A actualizar quantidades de stock..."}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-1">
          {[
            { key: "branch", label: "1. Filial" },
            { key: "upload", label: "2. Ficheiro" },
            { key: "mapping", label: "3. Mapeamento" },
            { key: "preview", label: "4. Pré-visualização" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              <Badge
                variant={step === s.key || (step === "importing" && s.key === "preview") ? "default" : "outline"}
                className="text-[10px]"
              >
                {s.label}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {/* Step 1: Branch Selection */}
          {step === "branch" && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Selecione a filial destino</p>
                <p className="text-xs text-muted-foreground mt-1">As quantidades importadas serão atribuídas a esta filial</p>
              </div>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-[280px] h-10">
                  <SelectValue placeholder="Selecionar filial..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {branches.length === 0 && (
                <p className="text-xs text-destructive">Nenhuma filial activa encontrada. Crie uma filial primeiro.</p>
              )}
            </div>
          )}

          {/* Step 2: Upload */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Selecione o ficheiro com quantidades</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Filial: <span className="font-medium text-foreground">{selectedBranch?.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">O ficheiro deve ter uma coluna de código de barras e uma coluna de quantidade</p>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
                <Button asChild variant="default" size="sm">
                  <span><Upload className="w-4 h-4 mr-1" />Escolher Ficheiro</span>
                </Button>
              </label>
            </div>
          )}

          {/* Step 3: Mapping */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{fileName} — {fileHeaders.length} colunas, {fileRows.length} linhas</span>
                <span className="ml-auto">Filial: <span className="font-medium text-foreground">{selectedBranch?.name}</span></span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs w-[200px]">Campo do Sistema</TableHead>
                      <TableHead className="text-xs w-[60px] text-center"><Link2 className="w-3.5 h-3.5 mx-auto" /></TableHead>
                      <TableHead className="text-xs">Coluna do Ficheiro</TableHead>
                      <TableHead className="text-xs w-[100px] text-center">Exemplo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SYSTEM_FIELDS.map((field) => {
                      const mappedHeader = mapping[field.key];
                      const exampleIdx = mappedHeader ? fileHeaders.indexOf(mappedHeader) : -1;
                      const exampleValue = exampleIdx >= 0 && fileRows[0] ? fileRows[0][exampleIdx] : "—";

                      return (
                        <TableRow key={field.key}>
                          <TableCell className="text-xs font-medium">
                            <div>
                              <span className="flex items-center gap-1.5">
                                {field.label}
                                {field.required && (
                                  <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Obrigatório</Badge>
                                )}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{field.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {mappedHeader ? <Check className="w-4 h-4 text-success mx-auto" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping[field.key] || "__none__"}
                              onValueChange={(val) =>
                                setMapping((prev) => {
                                  const next = { ...prev };
                                  if (val === "__none__") delete next[field.key];
                                  else next[field.key] = val;
                                  return next;
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar coluna..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Não mapear —</SelectItem>
                                {fileHeaders.map((h) => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-center truncate max-w-[120px]">{exampleValue || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {!hasIdentifier && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Deve mapear o Código de Barras para identificar os produtos.
                </div>
              )}
              {!hasQuantity && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  O campo Quantidade é obrigatório.
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preview */}
          {step === "preview" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Pré-visualização da correspondência para a filial <span className="font-medium text-foreground">{selectedBranch?.name}</span>. Produtos não encontrados serão ignorados.
              </p>
              <ScrollArea className="border rounded-lg max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[40px]">#</TableHead>
                      <TableHead className="text-xs">Identificador</TableHead>
                      <TableHead className="text-xs">Produto no Sistema</TableHead>
                      <TableHead className="text-xs text-center">Stock Actual</TableHead>
                      <TableHead className="text-xs text-center">Nova Qtd</TableHead>
                      <TableHead className="text-xs text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, ri) => (
                      <TableRow key={ri} className={!row.product ? "bg-destructive/5" : ""}>
                        <TableCell className="text-xs text-muted-foreground">{ri + 1}</TableCell>
                        <TableCell className="text-xs font-mono">{row.identifier}</TableCell>
                        <TableCell className="text-xs">{row.product?.name || <span className="text-destructive italic">Não encontrado</span>}</TableCell>
                        <TableCell className="text-xs text-center">{row.currentQty ?? "—"}</TableCell>
                        <TableCell className="text-xs text-center font-bold">{row.newQty ?? "—"}</TableCell>
                        <TableCell className="text-center">
                          {row.product ? (
                            <Badge variant="secondary" className="text-[9px] bg-success/15 text-success border-success/30">Match</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] bg-destructive/15 text-destructive border-destructive/30">Sem match</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Total: {fileRows.length} linhas</span>
                <span className="text-success">{fileRows.filter((r) => findProduct(r)).length} com correspondência</span>
                <span className="text-destructive">{fileRows.filter((r) => !findProduct(r)).length} sem correspondência</span>
              </div>
            </div>
          )}

          {/* Step 5: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-full max-w-sm">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{importProgress.current} / {importProgress.total}</span>
                  <div className="flex gap-3">
                    {importProgress.notFound > 0 && <span className="text-warning">{importProgress.notFound} não encontrados</span>}
                    {importProgress.errors > 0 && <span className="text-destructive">{importProgress.errors} erros</span>}
                  </div>
                </div>
              </div>
              {!importing && importProgress.current > 0 && (
                <div className="text-center">
                  <Check className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-sm font-medium">Importação concluída!</p>
                  <p className="text-xs text-muted-foreground">
                    {importProgress.total - importProgress.errors - importProgress.notFound} produtos actualizados na filial {selectedBranch?.name}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          {step === "branch" && (
            <Button size="sm" disabled={!selectedBranchId} onClick={() => setStep("upload")}>
              Continuar<ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
          {step === "upload" && (
            <Button variant="outline" size="sm" onClick={() => setStep("branch")}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />Voltar
            </Button>
          )}
          {step === "mapping" && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setFileData([]); setFileName(""); setMapping({}); setStep("upload"); }}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />Voltar
              </Button>
              <Button size="sm" disabled={!canProceed} onClick={() => setStep("preview")}>Continuar<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep("mapping")}><ArrowLeft className="w-3.5 h-3.5 mr-1" />Voltar</Button>
              <Button size="sm" onClick={handleImport}><Check className="w-3.5 h-3.5 mr-1" />Confirmar Importação</Button>
            </>
          )}
          {step === "importing" && !importing && importProgress.current > 0 && (
            <Button size="sm" onClick={() => handleClose(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
