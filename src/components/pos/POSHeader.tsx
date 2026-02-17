import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, LayoutGrid, List, LogOut, Store, User } from "lucide-react";
import { Link } from "react-router-dom";

interface POSHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function POSHeader({ searchQuery, onSearchChange, viewMode, onViewModeChange }: POSHeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">SF</span>
        </div>
        <span className="font-semibold text-foreground hidden sm:inline">StockFlow</span>
      </div>

      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span>Loja Central</span>
        <span className="mx-1">·</span>
        <User className="h-4 w-4" />
        <span>Carlos Operador</span>
      </div>

      <div className="flex-1 max-w-md ml-auto">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou código de barras..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 border rounded-md p-0.5">
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      <Button variant="outline" size="sm" asChild>
        <Link to="/">
          <LogOut className="h-4 w-4 mr-1" />
          Painel
        </Link>
      </Button>
    </header>
  );
}
