import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RemoveModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function RemoveModuleDialog({ open, onOpenChange, moduleName, onConfirm, isPending }: RemoveModuleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover módulo?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem a certeza que deseja remover o módulo <strong>"{moduleName}"</strong> da matriz de permissões? Esta acção remove o módulo de todos os cargos e não pode ser revertida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isPending ? "A remover..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
