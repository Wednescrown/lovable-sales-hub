export type AdjustmentType = "add" | "reduce";
export type AdjustmentReason =
  | "contagem_fisica"
  | "dano"
  | "roubo"
  | "consumo_interno"
  | "erro_lancamento"
  | "outro";

export const adjustmentReasonLabels: Record<AdjustmentReason, string> = {
  contagem_fisica: "Contagem Física",
  dano: "Dano",
  roubo: "Roubo",
  consumo_interno: "Consumo Interno",
  erro_lancamento: "Erro de Lançamento",
  outro: "Outro",
};

export interface StockAdjustment {
  id: string;
  date: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  type: AdjustmentType;
  previousQty: number;
  newQty: number;
  difference: number;
  reason: AdjustmentReason;
  observation: string;
  user: string;
}

export const mockAdjustments: StockAdjustment[] = [];

export interface CountItem {
  productId: string;
  productName: string;
  systemQty: number;
  countedQty: number;
  differenceQty: number;
  costPrice: number;
  sellPrice: number;
  differenceCostValue: number;
  differenceSellValue: number;
}

export function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}
