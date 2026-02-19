import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DenominationPanel,
  getDefaultDenominations,
  getTotalFromDenominations,
  type DenominationEntry,
} from "@/components/financas/DenominationPanel";
import { CashPickupDialog } from "@/components/financas/CashPickupDialog";
import { CashCloseDialog } from "@/components/financas/CashCloseDialog";
import {
  Wallet,
  ArrowUpFromLine,
  Lock,
  AlertTriangle,
  Banknote,
  TrendingUp,
  CreditCard,
  Smartphone,
  Clock,
  CheckCircle2,
  History,
} from "lucide-react";

function formatKz(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

const CASH_LIMIT = 50000;

// Mock data for today's financial summary
const mockSalesData = {
  totalSales: 127500,
  cashSales: 82000,
  tpaSales: 28500,
  transferSales: 12000,
  multicaixaSales: 5000,
  transactionCount: 34,
  averageTicket: 3750,
};

interface PickupRecord {
  id: string;
  time: string;
  amount: number;
  notes: string;
}

interface DeclarationRecord {
  id: string;
  date: string;
  operator: string;
  totalCash: number;
  totalTpa: number;
  totalTransfer: number;
  status: "Aberto" | "Fechado";
}

const mockDeclarationHistory: DeclarationRecord[] = [
  { id: "DEC-004", date: "18/02/2026 08:15", operator: "Maria Silva", totalCash: 25000, totalTpa: 12000, totalTransfer: 3500, status: "Fechado" },
  { id: "DEC-003", date: "17/02/2026 08:30", operator: "João Mendes", totalCash: 18000, totalTpa: 8500, totalTransfer: 2000, status: "Fechado" },
  { id: "DEC-002", date: "16/02/2026 08:00", operator: "Maria Silva", totalCash: 30000, totalTpa: 15000, totalTransfer: 5000, status: "Fechado" },
  { id: "DEC-001", date: "15/02/2026 08:45", operator: "Ana Costa", totalCash: 22000, totalTpa: 9000, totalTransfer: 1500, status: "Fechado" },
];

const mockOperators = ["Maria Silva", "João Mendes", "Ana Costa"];

export default function Financas() {
  const [openingDenominations, setOpeningDenominations] = useState(getDefaultDenominations);
  const [isOpeningDeclared, setIsOpeningDeclared] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [tpaAmount, setTpaAmount] = useState(0);
  const [multicaixaAmount, setMulticaixaAmount] = useState(0);
  const [selectedOperator, setSelectedOperator] = useState("");

  const openingTotal = getTotalFromDenominations(openingDenominations);
  const totalPickups = pickups.reduce((sum, p) => sum + p.amount, 0);
  const currentCashInDrawer = (isOpeningDeclared ? openingTotal : 0) + mockSalesData.cashSales - totalPickups;
  const overLimit = currentCashInDrawer > CASH_LIMIT;

  const handleDeclareOpening = () => {
    setIsOpeningDeclared(true);
  };

  const handlePickupConfirm = (amount: number, denominations: DenominationEntry[], notes: string) => {
    setPickups((prev) => [
      ...prev,
      {
        id: `PK-${Date.now()}`,
        time: new Date().toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }),
        amount,
        notes,
      },
    ]);
  };

  const handleCloseConfirm = (counted: number, denominations: DenominationEntry[]) => {
    // In production, would save to database
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finanças</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("pt-AO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPickupOpen(true)}
              disabled={!isOpeningDeclared}
              className="gap-2"
            >
              <ArrowUpFromLine className="h-4 w-4" />
              Pickup
            </Button>
            <Button
              onClick={() => setCloseOpen(true)}
              disabled={!isOpeningDeclared}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              Fechar Caixa
            </Button>
          </div>
        </div>

        {/* Cash alert */}
        {isOpeningDeclared && overLimit && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Dinheiro em caixa acima do limite!</p>
              <p className="text-xs text-muted-foreground">
                Valor actual: {formatKz(currentCashInDrawer)} — Limite: {formatKz(CASH_LIMIT)}. Faça um pickup.
              </p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => setPickupOpen(true)} className="gap-1">
              <ArrowUpFromLine className="h-3.5 w-3.5" />
              Pickup Agora
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Opening Declaration */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI cards */}
            {isOpeningDeclared && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Vendas Hoje</span>
                  </div>
                  <p className="text-lg font-bold">{formatKz(mockSalesData.totalSales)}</p>
                  <p className="text-xs text-muted-foreground">{mockSalesData.transactionCount} transacções</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-4 w-4 text-success" />
                    <span className="text-xs text-muted-foreground">Dinheiro</span>
                  </div>
                  <p className="text-lg font-bold">{formatKz(mockSalesData.cashSales)}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 text-info" />
                    <span className="text-xs text-muted-foreground">TPA</span>
                  </div>
                  <p className="text-lg font-bold">{formatKz(mockSalesData.tpaSales)}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="h-4 w-4 text-warning" />
                    <span className="text-xs text-muted-foreground">Multicaixa + Transf.</span>
                  </div>
                  <p className="text-lg font-bold">{formatKz(mockSalesData.transferSales + mockSalesData.multicaixaSales)}</p>
                </Card>
              </div>
            )}

            {/* Opening declaration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-primary" />
                  Declaração de Abertura
                  {isOpeningDeclared && (
                    <Badge className="bg-success text-success-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Declarado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="current">
                  <TabsList className="w-full">
                    <TabsTrigger value="current" className="flex-1 gap-1.5">
                      <Wallet className="h-3.5 w-3.5" />
                      Declaração Actual
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      Histórico
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="current">
                    {!isOpeningDeclared ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Conte as notas e moedas em caixa para iniciar o turno.
                        </p>

                        {/* Operator selector */}
                        <div className="space-y-1.5">
                          <Label htmlFor="operator">Operador de Caixa</Label>
                          <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                            <SelectTrigger id="operator">
                              <SelectValue placeholder="Seleccione o operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockOperators.map((op) => (
                                <SelectItem key={op} value={op}>{op}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <DenominationPanel
                          denominations={openingDenominations}
                          onChange={setOpeningDenominations}
                        />

                        {/* TPA and Multicaixa fields */}
                        <div className="border-t pt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="tpa" className="flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                Valor TPA
                              </Label>
                              <div className="relative">
                                <Input
                                  id="tpa"
                                  type="number"
                                  min={0}
                                  value={tpaAmount || ""}
                                  onChange={(e) => setTpaAmount(Math.max(0, Number(e.target.value)))}
                                  placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Kz</span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="multicaixa" className="flex items-center gap-1.5">
                                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                Multicaixa / Transf.
                              </Label>
                              <div className="relative">
                                <Input
                                  id="multicaixa"
                                  type="number"
                                  min={0}
                                  value={multicaixaAmount || ""}
                                  onChange={(e) => setMulticaixaAmount(Math.max(0, Number(e.target.value)))}
                                  placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Kz</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cash (notas/moedas)</span>
                            <span className="font-medium">{formatKz(openingTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">TPA</span>
                            <span className="font-medium">{formatKz(tpaAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Multicaixa / Transf.</span>
                            <span className="font-medium">{formatKz(multicaixaAmount)}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold pt-2 border-t">
                            <span>Total Geral</span>
                            <span className="text-primary">{formatKz(openingTotal + tpaAmount + multicaixaAmount)}</span>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          size="lg"
                          disabled={openingTotal <= 0 || !selectedOperator}
                          onClick={handleDeclareOpening}
                        >
                          Declarar Abertura — {formatKz(openingTotal + tpaAmount + multicaixaAmount)}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <span className="text-sm text-muted-foreground">Operador</span>
                          <span className="text-sm font-medium">{selectedOperator}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-xs text-muted-foreground">Cash</p>
                            <p className="text-sm font-bold">{formatKz(openingTotal)}</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-xs text-muted-foreground">TPA</p>
                            <p className="text-sm font-bold">{formatKz(tpaAmount)}</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-xs text-muted-foreground">Transf.</p>
                            <p className="text-sm font-bold">{formatKz(multicaixaAmount)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                          <span className="text-sm font-medium">Total Geral</span>
                          <span className="text-lg font-bold text-primary">{formatKz(openingTotal + tpaAmount + multicaixaAmount)}</span>
                        </div>
                        <DenominationPanel
                          denominations={openingDenominations}
                          onChange={setOpeningDenominations}
                          readOnly
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Operador</TableHead>
                            <TableHead className="text-right">Cash</TableHead>
                            <TableHead className="text-right">TPA</TableHead>
                            <TableHead className="text-right">Transf.</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockDeclarationHistory.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="text-xs">{d.date}</TableCell>
                              <TableCell className="text-sm">{d.operator}</TableCell>
                              <TableCell className="text-right text-sm">{formatKz(d.totalCash)}</TableCell>
                              <TableCell className="text-right text-sm">{formatKz(d.totalTpa)}</TableCell>
                              <TableCell className="text-right text-sm">{formatKz(d.totalTransfer)}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={d.status === "Fechado" ? "secondary" : "default"} className="text-xs">
                                  {d.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Cash status + Pickups */}
          <div className="space-y-6">
            {/* Cash drawer status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="h-5 w-5 text-primary" />
                  Estado da Caixa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Abertura</span>
                    <span>{formatKz(isOpeningDeclared ? openingTotal : 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">+ Vendas (dinheiro)</span>
                    <span className="text-success">{formatKz(isOpeningDeclared ? mockSalesData.cashSales : 0)}</span>
                  </div>
                  {totalPickups > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">- Pickups</span>
                      <span className="text-destructive">-{formatKz(totalPickups)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Em caixa</span>
                    <span className={overLimit ? "text-destructive" : "text-primary"}>
                      {formatKz(Math.max(0, currentCashInDrawer))}
                    </span>
                  </div>
                </div>

                {/* Limit bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Limite: {formatKz(CASH_LIMIT)}</span>
                    <span>{Math.round((Math.max(0, currentCashInDrawer) / CASH_LIMIT) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overLimit ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (Math.max(0, currentCashInDrawer) / CASH_LIMIT) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pickup history */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowUpFromLine className="h-5 w-5 text-primary" />
                  Pickups do Dia
                  {pickups.length > 0 && (
                    <Badge variant="secondary">{pickups.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pickups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum pickup registado hoje.
                  </p>
                ) : (
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {pickups.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-md border p-2.5">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{formatKz(p.amount)}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.time}{p.notes ? ` — ${p.notes}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CashPickupDialog
        open={pickupOpen}
        onOpenChange={setPickupOpen}
        currentCashInDrawer={Math.max(0, currentCashInDrawer)}
        onConfirm={handlePickupConfirm}
      />
      <CashCloseDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        expectedCash={Math.max(0, currentCashInDrawer)}
        onConfirm={handleCloseConfirm}
      />
    </AppLayout>
  );
}
