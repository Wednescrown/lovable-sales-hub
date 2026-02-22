import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BranchStockRow {
  id: string;
  product_id: string;
  branch_id: string;
  company_id: string;
  quantity: number;
  updated_at: string;
}

export function useBranchStock(branchId?: string) {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ["branch_stock", companyId, branchId],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("branch_stock")
        .select("*")
        .eq("company_id", companyId);
      if (branchId && branchId !== "all") {
        query = query.eq("branch_id", branchId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BranchStockRow[];
    },
    enabled: !!companyId,
  });
}

export function useBranchStockMutations() {
  const { companyId } = useAuth();
  const qc = useQueryClient();

  const upsertBranchStock = useMutation({
    mutationFn: async ({
      product_id,
      branch_id,
      quantity,
    }: {
      product_id: string;
      branch_id: string;
      quantity: number;
    }) => {
      const { error } = await supabase
        .from("branch_stock")
        .upsert(
          {
            product_id,
            branch_id,
            company_id: companyId!,
            quantity,
          },
          { onConflict: "product_id,branch_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branch_stock"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return { upsertBranchStock };
}
