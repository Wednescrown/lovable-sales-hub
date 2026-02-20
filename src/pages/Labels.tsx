import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tag, Search, Printer, Package, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { mockProducts, type Product } from "@/data/mockProducts";

function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}

interface LabelItem {
  product: Product;
  quantity: number;
}

export default function Labels() {
  const [search, setSearch] = useState("");
  const [barcodeItems, setBarcodeItems] = useState<LabelItem[]>([]);
  const [priceItems, setPriceItems] = useState<LabelItem[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const searchResults = search
    ? mockProducts.filter(
        (p) =>
          p.status === "active" &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode.includes(search) ||
            p.sku.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 5)
    : [];

  const addItem = (
    product: Product,
    setter: React.Dispatch<React.SetStateAction<LabelItem[]>>
  ) => {
    setter((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    setSearch("");
  };

  const updateQty = (
    productId: string,
    delta: number,
    setter: React.Dispatch<React.SetStateAction<LabelItem[]>>
  ) => {
    setter((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const handlePrint = () => window.print();

  const BarcodeVisual = ({ barcode, name }: { barcode: string; name: string }) => (
    <div className="border rounded-md p-3 flex flex-col items-center gap-1 w-[200px] print:w-[180px] print:border-black">
      <p className="text-[10px] font-medium text-center leading-tight truncate w-full">{name}</p>
      <div className="flex items-end gap-[1px] h-10">
        {barcode.split("").map((char, i) => (
          <div
            key={i}
            className="bg-foreground print:bg-black"
            style={{
              width: parseInt(char) % 2 === 0 ? 1.5 : 2.5,
              height: `${28 + (parseInt(char) % 4) * 3}px`,
            }}
          />
        ))}
      </div>
      <p className="text-[9px] font-mono tracking-widest">{barcode}</p>
    </div>
  );

  const PriceLabelVisual = ({ product }: { product: Product }) => (
    <div className="border rounded-md p-3 flex flex-col items-center gap-1 w-[200px] print:w-[180px] print:border-black">
      <p className="text-[10px] font-medium text-center leading-tight truncate w-full">{product.name}</p>
      <p className="text-lg font-bold text-primary print:text-black">{formatKz(product.sellPrice)}</p>
      <div className="flex items-end gap-[1px] h-6">
        {product.barcode.split("").map((char, i) => (
          <div
            key={i}
            className="bg-foreground print:bg-black"
            style={{
              width: parseInt(char) % 2 === 0 ? 1 : 2,
              height: `${16 + (parseInt(char) % 4) * 2}px`,
            }}
          />
        ))}
      </div>
      <p className="text-[8px] font-mono tracking-wider">{product.barcode}</p>
    </div>
  );

  const renderItemList = (
    items: LabelItem[],
    setter: React.Dispatch<React.SetStateAction<LabelItem[]>>
  ) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.product.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{item.product.name}</p>
            <p className="text-[10px] text-muted-foreground">{item.product.barcode}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, -1, setter)}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, 1, setter)}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Pesquise e adicione produtos acima.</p>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Gestão de Etiquetas
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Imprima etiquetas de código de barras e preços
            </p>
          </div>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />
            Imprimir
          </Button>
        </div>

        <Tabs defaultValue="barcode">
          <TabsList>
            <TabsTrigger value="barcode">Código de Barras</TabsTrigger>
            <TabsTrigger value="price">Preços Prateleira</TabsTrigger>
          </TabsList>

          <TabsContent value="barcode" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar produto para adicionar etiqueta..."
                    className="pl-9 h-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-md bg-popover shadow-sm max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between border-b last:border-b-0"
                        onClick={() => addItem(p, setBarcodeItems)}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.barcode}</p>
                          </div>
                        </div>
                        <span className="text-xs text-primary">+ Adicionar</span>
                      </button>
                    ))}
                  </div>
                )}
                {renderItemList(barcodeItems, setBarcodeItems)}
              </CardContent>
            </Card>

            {barcodeItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Preview das Etiquetas ({barcodeItems.reduce((s, i) => s + i.quantity, 0)} etiquetas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={printRef} className="flex flex-wrap gap-3 print:gap-1" id="print-area">
                    {barcodeItems.flatMap((item) =>
                      Array.from({ length: item.quantity }, (_, i) => (
                        <BarcodeVisual key={`${item.product.id}-${i}`} barcode={item.product.barcode} name={item.product.name} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="price" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar produto para etiqueta de preço..."
                    className="pl-9 h-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-md bg-popover shadow-sm max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between border-b last:border-b-0"
                        onClick={() => addItem(p, setPriceItems)}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatKz(p.sellPrice)}</p>
                          </div>
                        </div>
                        <span className="text-xs text-primary">+ Adicionar</span>
                      </button>
                    ))}
                  </div>
                )}
                {renderItemList(priceItems, setPriceItems)}
              </CardContent>
            </Card>

            {priceItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Preview das Etiquetas ({priceItems.reduce((s, i) => s + i.quantity, 0)} etiquetas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 print:gap-1" id="print-area">
                    {priceItems.flatMap((item) =>
                      Array.from({ length: item.quantity }, (_, i) => (
                        <PriceLabelVisual key={`${item.product.id}-${i}`} product={item.product} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }
        }
      `}</style>
    </AppLayout>
  );
}
