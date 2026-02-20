import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  DollarSign,
  BarChart3,
  Users,
  UserCircle,
  Building2,
  Monitor,
  ChevronDown,
  ChevronRight,
  Layers,
  ClipboardList,
  ClipboardCheck,
  ArrowRightLeft,
  PackageCheck,
  Trash2,
  CalendarClock,
  Truck,
  FileText,
  ReceiptText,
  Wallet,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  History,
  BadgeDollarSign,
  UserCog,
  ShieldCheck,
  Heart,
  Store,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { title: "Visão Geral", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Gestão de Produtos",
    icon: Package,
    items: [
      { title: "Produtos", url: "/produtos", icon: Package },
      { title: "Categorias", url: "/categorias", icon: Layers },
      { title: "Etiquetas", url: "/etiquetas", icon: Tag },
      { title: "Inventário", url: "/inventario", icon: ClipboardList },
      { title: "Contagem Geral", url: "/contagem-inventario", icon: ClipboardCheck },
      { title: "Movimentação", url: "/movimentacao", icon: ArrowRightLeft },
      { title: "Estoque Disponível", url: "/estoque", icon: PackageCheck },
      { title: "Desperdício", url: "/desperdicio", icon: Trash2 },
      { title: "Datas de Validade", url: "/validade", icon: CalendarClock },
    ],
  },
  {
    label: "Compras & Devoluções",
    icon: ShoppingCart,
    items: [
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Lista de Compras", url: "/lista-compras", icon: FileText },
      { title: "Recebimento (GRN)", url: "/recebimento", icon: ReceiptText },
    ],
  },
  {
    label: "Finanças",
    icon: DollarSign,
    items: [
      { title: "Declaração do Dia", url: "/declaracao", icon: Wallet },
      { title: "Perdas", url: "/perdas", icon: AlertTriangle },
      { title: "Despesas", url: "/despesas", icon: CreditCard },
    ],
  },
  {
    label: "Relatórios",
    icon: BarChart3,
    items: [
      { title: "Vendas", url: "/relatorio-vendas", icon: TrendingUp },
      { title: "Perdas", url: "/relatorio-perdas", icon: AlertTriangle },
      { title: "Desempenho Caixeiros", url: "/relatorio-caixeiros", icon: Users },
      { title: "Estoque", url: "/relatorio-estoque", icon: PackageCheck },
      { title: "Produtos a Expirar", url: "/relatorio-expirar", icon: CalendarClock },
      { title: "Declarações", url: "/relatorio-declaracoes", icon: History },
      { title: "Histórico Perdas", url: "/relatorio-historico-perdas", icon: BadgeDollarSign },
      { title: "Lucro", url: "/relatorio-lucro", icon: DollarSign },
    ],
  },
  {
    label: "Gestão de Usuários",
    icon: UserCog,
    items: [
      { title: "Usuários", url: "/usuarios", icon: UserCircle },
      { title: "Funções", url: "/funcoes", icon: ShieldCheck },
    ],
  },
  {
    label: "Clientes",
    icon: Heart,
    items: [
      { title: "Gestão de Clientes", url: "/clientes", icon: Heart },
    ],
  },
  {
    label: "Filiais",
    icon: Building2,
    items: [
      { title: "Gestão de Filiais", url: "/filiais", icon: Store },
    ],
  },
  {
    label: "POS",
    icon: Monitor,
    items: [
      { title: "Ponto de Venda", url: "/pos", icon: Monitor },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuGroups.forEach((group) => {
      const isActive = group.items.some((item) => item.url === location.pathname);
      if (isActive) initial[group.label] = true;
    });
    // Always open Dashboard by default
    initial["Dashboard"] = true;
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0 h-screen sticky top-0 overflow-hidden`}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Store className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-accent-foreground leading-tight">AngoPos</span>
              <span className="text-[10px] text-sidebar-muted leading-tight">Gestão & POS</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {menuGroups.map((group) => {
          const isOpen = openGroups[group.label] ?? false;
          const isGroupActive = group.items.some((item) => item.url === location.pathname);

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => (collapsed ? null : toggleGroup(group.label))}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                  isGroupActive
                    ? "text-sidebar-primary bg-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                title={collapsed ? group.label : undefined}
              >
                <group.icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3 text-sidebar-muted" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-sidebar-muted" />
                    )}
                  </>
                )}
              </button>

              {!collapsed && isOpen && (
                <div className="ml-3 mt-0.5 border-l border-sidebar-border pl-2 space-y-0.5 animate-fade-in">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-sidebar-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-sidebar-accent-foreground">Admin</span>
              <span className="text-[10px] text-sidebar-muted">admin@empresa.co.ao</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
