import { useState, useCallback } from "react";
import { Upload, ArrowRight, ArrowLeft, Check, AlertTriangle, FileSpreadsheet, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useProductMutations } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SystemField {
  key: string;
  label: string;
  required: boolean;
}

const SYSTEM_FIELDS: SystemField[] = [
  { key: "name", label: "Descrição do Produto", required: true },
  { key: "barcode", label: "Código de Barras", required: true },
  { key: "category", label: "Categoria", required: true },
  { key: "sell_price", label: "Preço de Venda", required: true },
  { key: "cost_price", label: "Preço de Custo", required: false },
  { key: "min_stock", label: "Estoque Mínimo", required: false },
  { key: "pack_size", label: "Tamanho do Pack", required: false },
  { key: "unit", label: "Unidade", required: false },
  { key: "subcategory", label: "Subcategoria", required: false },
];

type Step = "upload" | "mapping" | "preview" | "importing";

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const { toast } = useToast();
  const { createProduct } = useProductMutations();
  const { data: categories = [] } = useCategories();

  const [step, setStep] = useState<Step>("upload");
  const [fileData, setFileData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: 0 });

  const fileHeaders = fileData.length > 0 ? fileData[0] : [];
  const fileRows = fileData.slice(1);

  const reset = () => {
    setStep("upload");
    setFileData([]);
    setFileName("");
    setMapping({});
    setImporting(false);
    setImportProgress({ current: 0, total: 0, errors: 0 });
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
      // Auto-map by similarity
      const headers = rows[0];
      const autoMap: Record<string, string> = {};
      const namePatterns: Record<string, RegExp> = {
        name: /^(nome|descri|produto|product|name|designa)/i,
        barcode: /^(barcode|codigo.*barra|cod.*bar|ean|gtin|c[oó]d)/i,
        category: /^(categ|grupo|group|family)/i,
        sell_price: /^(pre[çc]o.*venda|sell|pvp|venda|pre[çc]o|price)/i,
        cost_price: /^(custo|cost|compra|pre[çc]o.*custo)/i,
        min_stock: /^(min|est.*min|stock.*min)/i,
        pack_size: /^(pack|embalagem|tam)/i,
        unit: /^(unid|unit|un)/i,
        subcategory: /^(sub.*categ|subcateg)/i,
      };
      headers.forEach((h) => {
        for (const [field, pattern] of Object.entries(namePatterns)) {
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

  const requiredFieldsMapped = SYSTEM_FIELDS
    .filter((f) => f.required)
    .every((f) => mapping[f.key]);

  const getMappedValue = (row: string[], fieldKey: string): string | null => {
    const headerName = mapping[fieldKey];
    if (!headerName) return null;
    const idx = fileHeaders.indexOf(headerName);
    if (idx === -1) return null;
    const val = row[idx]?.trim();
    return val === "" || val === undefined ? null : val;
  };

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");
    const total = fileRows.length;
    let current = 0;
    let errors = 0;

    for (const row of fileRows) {
      current++;
      setImportProgress({ current, total, errors });

      const name = getMappedValue(row, "name");
      if (!name) {
        errors++;
        setImportProgress({ current, total, errors });
        continue;
      }

      const barcode = getMappedValue(row, "barcode");
      const categoryName = getMappedValue(row, "category");
      const sellPriceStr = getMappedValue(row, "sell_price");
      const costPriceStr = getMappedValue(row, "cost_price");
      const minStockStr = getMappedValue(row, "min_stock");
      const packSizeStr = getMappedValue(row, "pack_size");
      const unit = getMappedValue(row, "unit");

      // Find category by name
      let category_id: string | undefined;
      if (categoryName) {
        const found = categories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        category_id = found?.id;
      }

      const sellPrice = sellPriceStr ? parseFloat(sellPriceStr.replace(/[^\d.,]/g, "").replace(",", ".")) : 0;
      const costPrice = costPriceStr ? parseFloat(costPriceStr.replace(/[^\d.,]/g, "").replace(",", ".")) : 0;

      try {
        await createProduct.mutateAsync({
          name,
          barcode: barcode || undefined,
          category_id,
          sell_price: isNaN(sellPrice) ? 0 : sellPrice,
          cost_price: isNaN(costPrice) ? 0 : costPrice,
          min_stock: minStockStr ? Number(minStockStr) || 0 : 0,
          pack_size: packSizeStr ? Number(packSizeStr) || 1 : 1,
          unit: unit || "un",
        });
      } catch {
        errors++;
        setImportProgress({ current, total, errors });
      }
    }

    setImportProgress({ current, total, errors });
    setImporting(false);
    toast({
      title: "Importação concluída",
      description: `${total - errors} de ${total} produtos importados com sucesso.${errors > 0 ? ` ${errors} erros.` : ""}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Importar Produtos
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Selecione um ficheiro CSV ou Excel para importar produtos."}
            {step === "mapping" && "Ligue os campos do ficheiro aos campos do sistema."}
            {step === "preview" && "Pré-visualize os dados antes de confirmar a importação."}
            {step === "importing" && "A importar produtos..."}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-1">
          {[
            { key: "upload", label: "1. Ficheiro" },
            { key: "mapping", label: "2. Mapeamento" },
            { key: "preview", label: "3. Pré-visualização" },
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
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Selecione o ficheiro para importar</p>
                <p className="text-xs text-muted-foreground mt-1">Formatos aceites: CSV, XLS, XLSX</p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button asChild variant="default" size="sm">
                  <span><Upload className="w-4 h-4 mr-1" />Escolher Ficheiro</span>
                </Button>
              </label>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{fileName} — {fileHeaders.length} colunas, {fileRows.length} linhas</span>
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
                            <span className="flex items-center gap-1.5">
                              {field.label}
                              {field.required && (
                                <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">
                                  Obrigatório
                                </Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {mappedHeader ? (
                              <Check className="w-4 h-4 text-success mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping[field.key] || "__none__"}
                              onValueChange={(val) =>
                                setMapping((prev) => {
                                  const next = { ...prev };
                                  if (val === "__none__") {
                                    delete next[field.key];
                                  } else {
                                    next[field.key] = val;
                                  }
                                  return next;
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecionar coluna..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Não mapear —</SelectItem>
                                {fileHeaders.map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-center truncate max-w-[120px]">
                            {exampleValue || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {!requiredFieldsMapped && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Todos os campos obrigatórios devem ser mapeados para continuar.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Pré-visualização das primeiras 20 linhas. Campos em branco serão importados como nulo e poderão ser editados posteriormente.
              </p>
              <ScrollArea className="border rounded-lg max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[40px]">#</TableHead>
                      {SYSTEM_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <TableHead key={f.key} className="text-xs whitespace-nowrap">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileRows.slice(0, 20).map((row, ri) => (
                      <TableRow key={ri}>
                        <TableCell className="text-xs text-muted-foreground">{ri + 1}</TableCell>
                        {SYSTEM_FIELDS.filter((f) => mapping[f.key]).map((f) => {
                          const val = getMappedValue(row, f.key);
                          return (
                            <TableCell key={f.key} className={`text-xs whitespace-nowrap ${!val ? "text-muted-foreground italic" : ""}`}>
                              {val || "(vazio)"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Total: {fileRows.length} produtos serão importados.
              </p>
            </div>
          )}

          {/* Step 4: Importing */}
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
                  {importProgress.errors > 0 && (
                    <span className="text-destructive">{importProgress.errors} erros</span>
                  )}
                </div>
              </div>
              {!importing && importProgress.current > 0 && (
                <div className="text-center">
                  <Check className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-sm font-medium">Importação concluída!</p>
                  <p className="text-xs text-muted-foreground">
                    {importProgress.total - importProgress.errors} produtos importados. Os dados podem ser editados na lista de produtos.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          {step === "mapping" && (
            <>
              <Button variant="outline" size="sm" onClick={reset}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />Voltar
              </Button>
              <Button size="sm" disabled={!requiredFieldsMapped} onClick={() => setStep("preview")}>
                Continuar<ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep("mapping")}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />Voltar
              </Button>
              <Button size="sm" onClick={handleImport}>
                <Check className="w-3.5 h-3.5 mr-1" />Confirmar Importação ({fileRows.length})
              </Button>
            </>
          )}
          {step === "importing" && !importing && (
            <Button size="sm" onClick={() => handleClose(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
