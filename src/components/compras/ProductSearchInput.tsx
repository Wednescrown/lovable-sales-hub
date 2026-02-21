import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { mockProducts, Product } from "@/data/mockProducts";
import { toast } from "sonner";

interface ProductSearchInputProps {
  onSelect: (product: Product) => void;
  dialogOpen: boolean;
}

export function ProductSearchInput({ onSelect, dialogOpen }: ProductSearchInputProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Barcode scanner buffer
  const barcodeBuffer = useRef("");
  const barcodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = query.length >= 1
    ? mockProducts.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
        );
      }).slice(0, 10)
    : [];

  const handleSelect = useCallback((product: Product) => {
    onSelect(product);
    setQuery("");
    setShowDropdown(false);
  }, [onSelect]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Barcode scanner listener (global keydown when dialog is open)
  useEffect(() => {
    if (!dialogOpen) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      // Allow barcode scanning even when focused on the search input
      // but skip if user is in other inputs (quantity, cost, etc.)
      const isSearchInput = target === inputRef.current;
      if (!isSearchInput && (tagName === "input" || tagName === "textarea" || tagName === "select")) return;

      if (e.key === "Enter" && barcodeBuffer.current.length >= 4) {
        e.preventDefault();
        const barcode = barcodeBuffer.current;
        barcodeBuffer.current = "";
        const product = mockProducts.find((p) => p.barcode === barcode);
        if (product) {
          handleSelect(product);
        } else {
          toast.error("Produto não encontrado para o código: " + barcode);
        }
        return;
      }

      // Only accumulate digits
      if (/^\d$/.test(e.key)) {
        if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current);
        barcodeBuffer.current += e.key;
        barcodeTimeout.current = setTimeout(() => {
          barcodeBuffer.current = "";
        }, 100);
      } else if (e.key !== "Enter") {
        // Non-digit, non-enter: reset buffer
        barcodeBuffer.current = "";
        if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialogOpen, handleSelect]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Pesquisar produto por nome, SKU ou código de barras..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => query.length >= 1 && setShowDropdown(true)}
          className="pl-9"
        />
      </div>
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-lg">
          <ScrollArea className="max-h-[200px]">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2"
                onClick={() => handleSelect(p)}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{p.sku}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {p.packSize} un/cx
                </span>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
