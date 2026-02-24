import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DenominationPanel,
  DenominationEntry,
  getDefaultDenominations,
  getTotalFromDenominations,
} from "@/components/financas/DenominationPanel";
import { DollarSign, ArrowRight } from "lucide-react";

interface POSOpeningDeclarationProps {
  onConfirm: (total: number, denominations: DenominationEntry[]) => void;
}

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

export function POSOpeningDeclaration({ onConfirm }: POSOpeningDeclarationProps) {
  const [denominations, setDenominations] = useState<DenominationEntry[]>(getDefaultDenominations());
  const total = getTotalFromDenominations(denominations);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Declaração de Abertura</h1>
          <p className="text-muted-foreground text-sm">
            Conte o dinheiro físico disponível em caixa antes de iniciar.
          </p>
        </div>

        <DenominationPanel denominations={denominations} onChange={setDenominations} />

        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => onConfirm(total, denominations)}
        >
          Abrir Caixa — {formatKz(total)}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
}
