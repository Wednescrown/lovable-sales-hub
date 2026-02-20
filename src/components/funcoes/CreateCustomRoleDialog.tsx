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
import { Textarea } from "@/components/ui/textarea";

interface CreateCustomRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, label: string, description: string) => void;
  isPending: boolean;
}

export function CreateCustomRoleDialog({ open, onOpenChange, onConfirm, isPending }: CreateCustomRoleDialogProps) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  const handleConfirm = () => {
    if (!name.trim() || !label.trim()) return;
    onConfirm(
      name.trim().toLowerCase().replace(/\s+/g, "_"),
      label.trim(),
      description.trim()
    );
    setName("");
    setLabel("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Cargo Personalizado</DialogTitle>
          <DialogDescription>
            Crie um novo cargo com permissões personalizadas para a sua empresa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Identificador (slug)</Label>
            <Input
              id="role-name"
              placeholder="ex: supervisor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-label">Nome de exibição</Label>
            <Input
              id="role-label"
              placeholder="ex: Supervisor"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">Descrição</Label>
            <Textarea
              id="role-description"
              placeholder="ex: Supervisiona operações de loja"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!name.trim() || !label.trim() || isPending}>
            {isPending ? "A criar..." : "Criar Cargo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
