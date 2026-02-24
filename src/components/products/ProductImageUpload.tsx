import { useRef, useState } from "react";
import { ImagePlus, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useProductImages, useProductImageMutations } from "@/hooks/useProductImages";
import { useToast } from "@/hooks/use-toast";

interface ProductImageUploadProps {
  productId: string;
}

export function ProductImageUpload({ productId }: ProductImageUploadProps) {
  const { data: images = [], isLoading } = useProductImages(productId);
  const { uploadImage, deleteImage } = useProductImageMutations();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        await uploadImage.mutateAsync({ productId, file });
        uploaded++;
      } catch (e: any) {
        toast({ title: "Erro ao enviar imagem", description: e.message, variant: "destructive" });
      }
    }
    setUploading(false);
    if (uploaded > 0) {
      toast({ title: `${uploaded} imagem(ns) enviada(s)` });
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    try {
      await deleteImage.mutateAsync({ id, storagePath });
      toast({ title: "Imagem removida" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">Imagens do Produto</label>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative w-20 h-20 rounded-md overflow-hidden border border-border group cursor-pointer"
            onClick={() => setPreviewUrl(img.url)}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(img.id, img.storage_path);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5" />
              <span className="text-[9px]">Adicionar</span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Carregando imagens...</p>}

      {/* Full preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-lg p-2">
          {previewUrl && (
            <img src={previewUrl} alt="Pré-visualização" className="w-full h-auto rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
