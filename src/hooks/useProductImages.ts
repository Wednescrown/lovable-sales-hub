import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductImage {
  id: string;
  product_id: string;
  company_id: string;
  storage_path: string;
  position: number;
  created_at: string;
  url: string;
}

export function useProductImages(productId?: string) {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ["product-images", productId],
    queryFn: async (): Promise<ProductImage[]> => {
      if (!productId || !companyId) return [];
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("position");
      if (error) throw error;
      return (data || []).map((img: any) => ({
        ...img,
        url: supabase.storage.from("product-images").getPublicUrl(img.storage_path).data.publicUrl,
      }));
    },
    enabled: !!productId && !!companyId,
  });
}

/** Fetch first image for each product in a batch */
export function useProductThumbnails(productIds: string[]) {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ["product-thumbnails", companyId, productIds.length],
    queryFn: async (): Promise<Map<string, string>> => {
      if (!companyId || productIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("product_images")
        .select("product_id, storage_path")
        .eq("company_id", companyId)
        .in("product_id", productIds)
        .order("position")
      if (error) throw error;
      const map = new Map<string, string>();
      for (const img of data || []) {
        if (!map.has(img.product_id)) {
          map.set(
            img.product_id,
            supabase.storage.from("product-images").getPublicUrl(img.storage_path).data.publicUrl
          );
        }
      }
      return map;
    },
    enabled: !!companyId && productIds.length > 0,
  });
}

export function useProductImageMutations() {
  const { companyId } = useAuth();
  const qc = useQueryClient();

  const uploadImage = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      if (!companyId) throw new Error("No company");

      // Compress image client-side
      const compressed = await compressImage(file, 1200, 0.8);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${companyId}/${productId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, { contentType: compressed.type });
      if (uploadError) throw uploadError;

      // Get current max position
      const { data: existing } = await supabase
        .from("product_images")
        .select("position")
        .eq("product_id", productId)
        .order("position", { ascending: false })
        .limit(1);
      const nextPos = (existing?.[0]?.position ?? -1) + 1;

      const { error: dbError } = await supabase
        .from("product_images")
        .insert({ product_id: productId, company_id: companyId, storage_path: path, position: nextPos });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-images"] });
      qc.invalidateQueries({ queryKey: ["product-thumbnails"] });
    },
  });

  const deleteImage = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from("product-images").remove([storagePath]);
      const { error } = await supabase.from("product_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-images"] });
      qc.invalidateQueries({ queryKey: ["product-thumbnails"] });
    },
  });

  return { uploadImage, deleteImage };
}

async function compressImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
