import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, Building2, Smartphone, CheckCircle2, ReceiptText } from "lucide-react";

interface PaymentMethod {
  key: string;
  label: string;
  icon: React.ReactNode;
  amount: number;
}

interface POSPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: () => void;
}

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

export function POSPaymentDialog({ open, onOpenChange, total, onConfirm }: POSPaymentDialogProps) {
  const [step, setStep] = useState<"payment" | "confirmed">("payment");
  const [methods, setMethods] = useState<PaymentMethod[]>([
    { key: "cash", label: "Dinheiro", icon: <Banknote className="h-5 w-5" />, amount: 0 },
    { key: "tpa", label: "TPA (Cartão)", icon: <CreditCard className="h-5 w-5" />, amount: 0 },
    { key: "transfer", label: "Transferência", icon: <Building2 className="h-5 w-5" />, amount: 0 },
    { key: "multicaixa", label: "Multicaixa Express", icon: <Smartphone className="h-5 w-5" />, amount: 0 },
  ]);
  const [receiptNumber] = useState(() => `REC-${Date.now().toString().slice(-8)}`);

  const totalPaid = methods.reduce((sum, m) => sum + m.amount, 0);
  const remaining = total - totalPaid;
  const cashMethod = methods.find((m) => m.key === "cash");
  const change = cashMethod && cashMethod.amount > 0 && totalPaid >= total ? Math.max(0, totalPaid - total) : 0;

  const updateAmount = (key: string, value: number) => {
    setMethods((prev) => prev.map((m) => (m.key === key ? { ...m, amount: value } : m)));
  };

  const handleSetFull = (key: string) => {
    const othersTotal = methods.filter((m) => m.key !== key).reduce((s, m) => s + m.amount, 0);
    updateAmount(key, Math.max(0, total - othersTotal));
  };

  const handleConfirm = () => {
    setStep("confirmed");
  };

  const handleClose = () => {
    setStep("payment");
    setMethods((prev) => prev.map((m) => ({ ...m, amount: 0 })));
    onOpenChange(false);
    if (step === "confirmed") onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "payment" ? (
          <>
            <DialogHeader>
              <DialogTitle>Pagamento</DialogTitle>
              <DialogDescription>Total a pagar: <span className="font-bold text-primary">{formatKz(total)}</span></DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {methods.map((method) => (
                <div key={method.key} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="text-muted-foreground">{method.icon}</div>
                  <span className="text-sm font-medium flex-1">{method.label}</span>
                  <Input
                    type="number"
                    min={0}
                    className="w-28 h-8 text-sm text-right"
                    value={method.amount || ""}
                    onChange={(e) => updateAmount(method.key, Number(e.target.value))}
                    placeholder="0"
                  />
                  <Button variant="ghost" size="sm" className="text-xs px-2 h-7" onClick={() => handleSetFull(method.key)}>
                    Total
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm border-t pt-3 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total pago</span>
                <span className={totalPaid >= total ? "text-success font-medium" : ""}>{formatKz(totalPaid)}</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Em falta</span>
                  <span>{formatKz(remaining)}</span>
                </div>
              )}
              {change > 0 && (
                <div className="flex justify-between text-success font-medium">
                  <span>Troco</span>
                  <span>{formatKz(change)}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button disabled={totalPaid < total} onClick={handleConfirm}>
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
                Venda Confirmada
              </DialogTitle>
              <DialogDescription>Pagamento processado com sucesso</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2 justify-center">
                <ReceiptText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Recibo:</span>
                <Badge variant="outline" className="font-mono">{receiptNumber}</Badge>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatKz(total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pago via: {methods.filter((m) => m.amount > 0).map((m) => m.label).join(", ")}
                </p>
              </div>
              {change > 0 && (
                <div className="text-center">
                  <p className="text-sm text-success font-medium">Troco: {formatKz(change)}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button className="w-full" onClick={handleClose}>
                Nova Venda
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
