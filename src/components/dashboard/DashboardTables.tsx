import { TrendingUp, TrendingDown } from "lucide-react";

const topStores = [
  { name: "Loja Central", location: "Luanda Centro", vendas: 520000, change: 8.3 },
  { name: "Loja Talatona", location: "Talatona", vendas: 410000, change: -8.9 },
  { name: "Loja Viana", location: "Viana", vendas: 380000, change: 8.6 },
  { name: "Loja Cacuaco", location: "Cacuaco", vendas: 290000, change: -6.5 },
  { name: "Loja Kilamba", location: "Kilamba", vendas: 250000, change: 8.7 },
];

const topCashiers = [
  { name: "Maria Silva", loja: "Central", vendas: 285000, transacoes: 48 },
  { name: "João Santos", loja: "Talatona", vendas: 234000, transacoes: 41 },
  { name: "Ana Ferreira", loja: "Viana", vendas: 198000, transacoes: 37 },
  { name: "Pedro Costa", loja: "Central", vendas: 176000, transacoes: 32 },
  { name: "Teresa Neto", loja: "Kilamba", vendas: 165000, transacoes: 29 },
];

const topProducts = [
  { name: "Água Mineral 1.5L", categoria: "Bebidas", qtd: 245, valor: 122500 },
  { name: "Arroz Premium 5kg", categoria: "Mercearia", qtd: 89, valor: 356000 },
  { name: "Óleo Vegetal 1L", categoria: "Mercearia", qtd: 156, valor: 234000 },
  { name: "Leite em Pó 400g", categoria: "Laticínios", qtd: 78, valor: 195000 },
  { name: "Açúcar 1kg", categoria: "Mercearia", qtd: 134, valor: 134000 },
];

const recentSales = [
  { id: "VD-001247", hora: "17:34", loja: "Central", operador: "Maria Silva", total: 45200, metodo: "Dinheiro" },
  { id: "VD-001246", hora: "17:28", loja: "Talatona", operador: "João Santos", total: 18900, metodo: "TPA" },
  { id: "VD-001245", hora: "17:22", loja: "Central", operador: "Maria Silva", total: 67800, metodo: "Multicaixa" },
  { id: "VD-001244", hora: "17:15", loja: "Viana", operador: "Ana Ferreira", total: 23400, metodo: "Dinheiro" },
  { id: "VD-001243", hora: "17:08", loja: "Kilamba", operador: "Teresa Neto", total: 89500, metodo: "Transferência" },
  { id: "VD-001242", hora: "16:55", loja: "Cacuaco", operador: "Pedro Costa", total: 12300, metodo: "TPA" },
];

export function TopStoresTable() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        Top 5 Lojas com Maior Venda
      </h3>
      <div className="space-y-2">
        {topStores.map((store, i) => (
          <div key={store.name} className="flex items-center gap-3 py-1.5">
            <span className="text-xs font-mono font-bold text-muted-foreground w-5">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-card-foreground truncate">{store.name}</p>
              <p className="text-[10px] text-muted-foreground">{store.location}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-card-foreground">
                {store.vendas.toLocaleString()} Kz
              </p>
              <span
                className={`text-[10px] flex items-center justify-end gap-0.5 ${
                  store.change > 0 ? "text-success" : "text-destructive"
                }`}
              >
                {store.change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {store.change > 0 ? "+" : ""}
                {store.change}% vs ontem
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopCashiersTable() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        Top 5 Operadores de Caixa
      </h3>
      <div className="space-y-2">
        {topCashiers.map((cashier, i) => (
          <div key={cashier.name} className="flex items-center gap-3 py-1.5">
            <span className="text-xs font-mono font-bold text-muted-foreground w-5">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-card-foreground truncate">{cashier.name}</p>
              <p className="text-[10px] text-muted-foreground">{cashier.loja} • {cashier.transacoes} transações</p>
            </div>
            <p className="text-xs font-semibold text-card-foreground">
              {cashier.vendas.toLocaleString()} Kz
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopProductsTable() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-card-foreground mb-3">
        Produtos Mais Vendidos
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Produto</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Categoria</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Qtd</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product) => (
              <tr key={product.name} className="border-b border-border/50">
                <td className="py-2 font-medium text-card-foreground">{product.name}</td>
                <td className="py-2 text-muted-foreground">{product.categoria}</td>
                <td className="py-2 text-right font-mono">{product.qtd}</td>
                <td className="py-2 text-right font-medium">{product.valor.toLocaleString()} Kz</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RecentSalesTable() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-card-foreground">
          Últimas Vendas
        </h3>
        <button className="text-xs text-primary hover:underline">Ver todas</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">ID</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Hora</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Loja</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Operador</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Método</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale) => (
              <tr key={sale.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-2 font-mono text-primary">{sale.id}</td>
                <td className="py-2 text-muted-foreground">{sale.hora}</td>
                <td className="py-2 text-card-foreground">{sale.loja}</td>
                <td className="py-2 text-card-foreground">{sale.operador}</td>
                <td className="py-2">
                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                    {sale.metodo}
                  </span>
                </td>
                <td className="py-2 text-right font-medium">{sale.total.toLocaleString()} Kz</td>
                <td className="py-2 text-right">
                  <button className="text-destructive hover:underline text-[10px]">Estorno</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
