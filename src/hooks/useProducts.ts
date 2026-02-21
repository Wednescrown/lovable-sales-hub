import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductRow {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  cost_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  pack_size: number;
  unit: string;
  status: string;
  created_at: string;
  updated_at: string;
  // joined
  category_name?: string;
  subcategory_name?: string;
}

export function useProducts() {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ["products", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), subcategories(name)")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        category_name: p.categories?.name || "",
        subcategory_name: p.subcategories?.name || "",
      })) as ProductRow[];
    },
    enabled: !!companyId,
  });
}

export function useProductMutations() {
  const { companyId } = useAuth();
  const qc = useQueryClient();

  const generateSku = async (productName: string): Promise<string> => {
    const { data, error } = await supabase.rpc("generate_product_sku", {
      _company_id: companyId!,
      _product_name: productName,
    });
    if (error) throw error;
    return data as string;
  };

  const createProduct = useMutation({
    mutationFn: async (product: {
      name: string;
      barcode?: string;
      category_id?: string;
      subcategory_id?: string;
      cost_price: number;
      sell_price: number;
      stock: number;
      min_stock: number;
      pack_size: number;
      unit: string;
    }) => {
      const sku = await generateSku(product.name);
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, sku, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("products").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return { createProduct, updateProduct, deleteProduct, generateSku };
}
