import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Banknote, Coins } from "lucide-react";

export interface DenominationEntry {
  value: number;
  quantity: number;
  type: "note" | "coin";
}

const DEFAULT_DENOMINATIONS: DenominationEntry[] = [
  { value: 5000, quantity: 0, type: "note" },
  { value: 2000, quantity: 0, type: "note" },
  { value: 1000, quantity: 0, type: "note" },
  { value: 500, quantity: 0, type: "note" },
  { value: 200, quantity: 0, type: "note" },
  { value: 100, quantity: 0, type: "note" },
  { value: 50, quantity: 0, type: "coin" },
  { value: 10, quantity: 0, type: "coin" },
  { value: 5, quantity: 0, type: "coin" },
  { value: 2, quantity: 0, type: "coin" },
  { value: 1, quantity: 0, type: "coin" },
];

interface DenominationPanelProps {
  denominations: DenominationEntry[];
  onChange: (denominations: DenominationEntry[]) => void;
  readOnly?: boolean;
}

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

export function getDefaultDenominations(): DenominationEntry[] {
  return DEFAULT_DENOMINATIONS.map((d) => ({ ...d }));
}

export function getTotalFromDenominations(denominations: DenominationEntry[]): number {
  return denominations.reduce((sum, d) => sum + d.value * d.quantity, 0);
}

export function DenominationPanel({ denominations, onChange, readOnly = false }: DenominationPanelProps) {
  const total = getTotalFromDenominations(denominations);

  const updateQuantity = (value: number, quantity: number) => {
    onChange(
      denominations.map((d) => (d.value === value ? { ...d, quantity: Math.max(0, quantity) } : d))
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {denominations.map((d) => (
          <div
            key={d.value}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
              {d.type === "note" ? (
                <Banknote className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Coins className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-sm font-medium w-16">{formatKz(d.value)}</span>
            <span className="text-muted-foreground text-xs">×</span>
            <Input
              type="number"
              min={0}
              className="h-8 w-20 text-sm text-center"
              value={d.quantity || ""}
              onChange={(e) => updateQuantity(d.value, Number(e.target.value))}
              placeholder="0"
              readOnly={readOnly}
            />
            <span className="text-sm font-semibold text-right flex-1">
              {formatKz(d.value * d.quantity)}
            </span>
          </div>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total Contado</span>
          <span className="text-xl font-bold text-primary">{formatKz(total)}</span>
        </div>
      </Card>
    </div>
  );
}
