import { AppLayout } from "@/components/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  SalesHourlyChart,
  PaymentMethodsChart,
  StoreComparisonChart,
} from "@/components/dashboard/DashboardCharts";
import {
  TopStoresTable,
  TopCashiersTable,
  TopProductsTable,
  RecentSalesTable,
} from "@/components/dashboard/DashboardTables";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";

const Index = () => {
  const today = new Date().toLocaleDateString("pt-AO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <CalendarDays className="w-3 h-3" />
              {today}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-xs border border-border rounded-md px-3 py-1.5 bg-card text-card-foreground">
              <option>Todas as Lojas</option>
              <option>Loja Central</option>
              <option>Loja Talatona</option>
              <option>Loja Viana</option>
              <option>Loja Cacuaco</option>
              <option>Loja Kilamba</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Venda Bruta do Dia"
            value="1.850.000 Kz"
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
            subtitle="vs dia anterior"
          />
          <KPICard
            title="Lucro do Dia"
            value="462.500 Kz"
            change="+8.2%"
            changeType="positive"
            icon={TrendingUp}
            subtitle="Margem: 25%"
          />
          <KPICard
            title="Total de Vendas"
            value="187"
            change="-3.1%"
            changeType="negative"
            icon={ShoppingBag}
            subtitle="transações realizadas"
          />
          <KPICard
            title="Ticket Médio"
            value="9.893 Kz"
            change="+5.4%"
            changeType="positive"
            icon={ArrowUpRight}
            subtitle="por transação"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SalesHourlyChart />
          </div>
          <PaymentMethodsChart />
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TopStoresTable />
          <TopCashiersTable />
          <TopProductsTable />
        </div>

        {/* Store Comparison + Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StoreComparisonChart />
          <RecentSalesTable />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
