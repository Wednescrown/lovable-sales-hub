import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const hourlyData = [
  { hora: "08h", vendas: 45000 },
  { hora: "09h", vendas: 82000 },
  { hora: "10h", vendas: 125000 },
  { hora: "11h", vendas: 178000 },
  { hora: "12h", vendas: 235000 },
  { hora: "13h", vendas: 198000 },
  { hora: "14h", vendas: 156000 },
  { hora: "15h", vendas: 189000 },
  { hora: "16h", vendas: 210000 },
  { hora: "17h", vendas: 165000 },
  { hora: "18h", vendas: 98000 },
];

const COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(142, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
];

const formatKz = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M Kz`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K Kz`;
  return `${value.toLocaleString()} Kz`;
};

export function SalesHourlyChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">
        Vendas por Hora
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={hourlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 88%)" />
          <XAxis dataKey="hora" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={formatKz} />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString()} Kz`, "Vendas"]}
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(220, 16%, 88%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="vendas" fill="hsl(215, 80%, 48%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const paymentData = [
  { name: "Dinheiro", value: 580000 },
  { name: "TPA", value: 420000 },
  { name: "Transferência", value: 230000 },
  { name: "Multicaixa Express", value: 185000 },
];

export function PaymentMethodsChart() {
  const total = paymentData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">
        Métodos de Pagamento
      </h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={paymentData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {paymentData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {paymentData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-card-foreground">
                  {formatKz(item.value)}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const storeComparisonData = [
  { loja: "Central", hoje: 520000, ontem: 480000 },
  { loja: "Talatona", hoje: 410000, ontem: 450000 },
  { loja: "Viana", hoje: 380000, ontem: 350000 },
  { loja: "Cacuaco", hoje: 290000, ontem: 310000 },
  { loja: "Kilamba", hoje: 250000, ontem: 230000 },
];

export function StoreComparisonChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">
        Comparação de Vendas por Loja
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={storeComparisonData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 88%)" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={formatKz} />
          <YAxis dataKey="loja" type="category" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={70} />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString()} Kz`]}
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(220, 16%, 88%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="hoje" fill="hsl(215, 80%, 48%)" radius={[0, 4, 4, 0]} name="Hoje" />
          <Bar dataKey="ontem" fill="hsl(220, 16%, 88%)" radius={[0, 4, 4, 0]} name="Ontem" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
