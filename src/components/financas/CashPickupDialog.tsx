import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DenominationPanel,
  getDefaultDenominations,
  getTotalFromDenominations,
  type DenominationEntry,
} from "./DenominationPanel";
import { ArrowUpFromLine, AlertTriangle } from "lucide-react";

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

const CASH_LIMIT = 50000;

interface CashPickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCashInDrawer: number;
  onConfirm: (amount: number, denominations: DenominationEntry[], notes: string) => void;
}

export function CashPickupDialog({ open, onOpenChange, currentCashInDrawer, onConfirm }: CashPickupDialogProps) {
  const [denominations, setDenominations] = useState(getDefaultDenominations);
  const [notes, setNotes] = useState("");
  const pickupTotal = getTotalFromDenominations(denominations);
  const overLimit = currentCashInDrawer > CASH_LIMIT;
  const afterPickup = currentCashInDrawer - pickupTotal;

  const handleConfirm = () => {
    onConfirm(pickupTotal, denominations, notes);
    setDenominations(getDefaultDenominations());
    setNotes("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setDenominations(getDefaultDenominations());
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-primary" />
            Pickup de Caixa
          </DialogTitle>
          <DialogDescription>
            Retire dinheiro da caixa quando o valor exceder o limite de {formatKz(CASH_LIMIT)}.
          </DialogDescription>
        </DialogHeader>

        {/* Current status */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm text-muted-foreground">Dinheiro em caixa</p>
            <p className="text-lg font-bold">{formatKz(currentCashInDrawer)}</p>
          </div>
          {overLimit && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Acima do limite
            </Badge>
          )}
        </div>

        {/* Denomination counting */}
        <div>
          <h4 className="text-sm font-medium mb-2">Contagem do valor a retirar</h4>
          <DenominationPanel denominations={denominations} onChange={setDenominations} />
        </div>

        {/* After pickup preview */}
        {pickupTotal > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
            <span className="text-sm text-muted-foreground">Restante em caixa após pickup</span>
            <span className={`text-sm font-semibold ${afterPickup < 0 ? "text-destructive" : ""}`}>
              {formatKz(Math.max(0, afterPickup))}
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Observações (opcional)</label>
          <Textarea
            className="mt-1"
            placeholder="Motivo do pickup, responsável..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            disabled={pickupTotal <= 0 || pickupTotal > currentCashInDrawer}
            onClick={handleConfirm}
          >
            Confirmar Pickup — {formatKz(pickupTotal)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
