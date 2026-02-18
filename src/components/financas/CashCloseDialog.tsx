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
import { Badge } from "@/components/ui/badge";
import {
  DenominationPanel,
  getDefaultDenominations,
  getTotalFromDenominations,
  type DenominationEntry,
} from "./DenominationPanel";
import { Lock, CheckCircle2, AlertTriangle } from "lucide-react";

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

interface CashCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedCash: number;
  onConfirm: (counted: number, denominations: DenominationEntry[]) => void;
}

export function CashCloseDialog({ open, onOpenChange, expectedCash, onConfirm }: CashCloseDialogProps) {
  const [denominations, setDenominations] = useState(getDefaultDenominations);
  const [step, setStep] = useState<"count" | "confirmed">("count");
  const countedTotal = getTotalFromDenominations(denominations);
  const difference = countedTotal - expectedCash;

  const handleConfirm = () => {
    onConfirm(countedTotal, denominations);
    setStep("confirmed");
  };

  const handleClose = () => {
    setDenominations(getDefaultDenominations());
    setStep("count");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step === "count" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Fecho de Caixa
              </DialogTitle>
              <DialogDescription>
                Conte todo o dinheiro em caixa para fechar o turno.
              </DialogDescription>
            </DialogHeader>

            {/* Expected */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Valor esperado em caixa</span>
              <span className="text-lg font-bold">{formatKz(expectedCash)}</span>
            </div>

            {/* Denomination counting */}
            <DenominationPanel denominations={denominations} onChange={setDenominations} />

            {/* Difference */}
            {countedTotal > 0 && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Diferença</span>
                <div className="flex items-center gap-2">
                  {difference === 0 ? (
                    <Badge className="bg-success text-success-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Conferido
                    </Badge>
                  ) : (
                    <Badge variant={difference > 0 ? "outline" : "destructive"} className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {difference > 0 ? "+" : ""}{formatKz(difference)}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button disabled={countedTotal <= 0} onClick={handleConfirm}>
                Fechar Caixa
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
                Caixa Fechada
              </DialogTitle>
              <DialogDescription>Fecho de caixa registado com sucesso.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Esperado</p>
                  <p className="text-lg font-bold">{formatKz(expectedCash)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Contado</p>
                  <p className="text-lg font-bold">{formatKz(countedTotal)}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Diferença</p>
                <p className={`text-2xl font-bold ${difference === 0 ? "text-success" : "text-destructive"}`}>
                  {difference >= 0 ? "+" : ""}{formatKz(difference)}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full" onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
