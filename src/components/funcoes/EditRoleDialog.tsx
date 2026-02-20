import { useState, useEffect } from "react";
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

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleLabel: string;
  roleDescription: string;
  onSave: (label: string, description: string) => void;
}

export function EditRoleDialog({ open, onOpenChange, roleLabel, roleDescription, onSave }: EditRoleDialogProps) {
  const [label, setLabel] = useState(roleLabel);
  const [description, setDescription] = useState(roleDescription);

  useEffect(() => {
    setLabel(roleLabel);
    setDescription(roleDescription);
  }, [roleLabel, roleDescription]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave(label.trim(), description.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cargo</DialogTitle>
          <DialogDescription>
            Altere o nome de exibição e a descrição deste cargo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-label">Nome de exibição</Label>
            <Input
              id="role-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-desc">Descrição</Label>
            <Textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!label.trim()}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
