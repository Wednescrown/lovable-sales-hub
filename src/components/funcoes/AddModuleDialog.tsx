import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (slug: string, label: string) => void;
  isPending: boolean;
}

export function AddModuleDialog({ open, onOpenChange, onConfirm, isPending }: AddModuleDialogProps) {
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");

  const handleConfirm = () => {
    if (!slug.trim() || !label.trim()) return;
    onConfirm(slug.trim().toLowerCase().replace(/\s+/g, "_"), label.trim());
    setSlug("");
    setLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Módulo</DialogTitle>
          <DialogDescription>
            Crie um novo módulo na matriz de permissões. Será adicionado a todos os cargos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module-slug">Identificador (slug)</Label>
            <Input
              id="module-slug"
              placeholder="ex: relatorios"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-label">Nome de exibição</Label>
            <Input
              id="module-label"
              placeholder="ex: Relatórios"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!slug.trim() || !label.trim() || isPending}>
            {isPending ? "A adicionar..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
