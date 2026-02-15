import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  Clock,
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  subtitle?: string;
  onClick?: () => void;
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  subtitle,
  onClick,
}: KPICardProps) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-default animate-fade-in"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {change && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
              changeType === "positive"
                ? "bg-success/10 text-success"
                : changeType === "negative"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {changeType === "positive" ? (
              <TrendingUp className="w-3 h-3" />
            ) : changeType === "negative" ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {change}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
