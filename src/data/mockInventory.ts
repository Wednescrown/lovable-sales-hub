import { mockProducts } from "./mockProducts";

export interface Store {
  id: string;
  name: string;
}

export const mockStores: Store[] = [
  { id: "store-1", name: "Filial Talatona" },
  { id: "store-2", name: "Filial Viana" },
  { id: "store-3", name: "Filial Cacuaco" },
  { id: "store-4", name: "Filial Kilamba" },
];

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

export const mockAdjustments: StockAdjustment[] = [
  {
    id: "adj-1",
    date: "2026-02-16 09:30",
    productId: "prod-1",
    productName: "Coca-Cola 350ml",
    storeId: "store-1",
    storeName: "Filial Talatona",
    type: "reduce",
    previousQty: 450,
    newQty: 445,
    difference: -5,
    reason: "dano",
    observation: "Latas amassadas no transporte",
    user: "Admin",
  },
  {
    id: "adj-2",
    date: "2026-02-16 10:15",
    productId: "prod-4",
    productName: "Arroz Tio João 5kg",
    storeId: "store-2",
    storeName: "Filial Viana",
    type: "add",
    previousQty: 15,
    newQty: 25,
    difference: 10,
    reason: "contagem_fisica",
    observation: "Encontrados 10 unidades não registradas",
    user: "Admin",
  },
  {
    id: "adj-3",
    date: "2026-02-16 11:00",
    productId: "prod-6",
    productName: "Sabonete Dove 90g",
    storeId: "store-1",
    storeName: "Filial Talatona",
    type: "reduce",
    previousQty: 5,
    newQty: 2,
    difference: -3,
    reason: "roubo",
    observation: "Detectado falta na prateleira",
    user: "Admin",
  },
  {
    id: "adj-4",
    date: "2026-02-16 11:45",
    productId: "prod-7",
    productName: "Leite Ninho 400g",
    storeId: "store-3",
    storeName: "Filial Cacuaco",
    type: "reduce",
    previousQty: 42,
    newQty: 40,
    difference: -2,
    reason: "consumo_interno",
    observation: "Consumo para cantina",
    user: "Admin",
  },
  {
    id: "adj-5",
    date: "2026-02-16 13:20",
    productId: "prod-3",
    productName: "Água Pura 1.5L",
    storeId: "store-4",
    storeName: "Filial Kilamba",
    type: "add",
    previousQty: 620,
    newQty: 630,
    difference: 10,
    reason: "erro_lancamento",
    observation: "Correcção de entrada duplicada",
    user: "Admin",
  },
  {
    id: "adj-6",
    date: "2026-02-15 16:00",
    productId: "prod-10",
    productName: "Detergente Omo 1kg",
    storeId: "store-1",
    storeName: "Filial Talatona",
    type: "reduce",
    previousQty: 22,
    newQty: 18,
    difference: -4,
    reason: "dano",
    observation: "Embalagens danificadas por humidade",
    user: "Admin",
  },
  {
    id: "adj-7",
    date: "2026-02-15 14:30",
    productId: "prod-5",
    productName: "Óleo de Soja 900ml",
    storeId: "store-2",
    storeName: "Filial Viana",
    type: "reduce",
    previousQty: 180,
    newQty: 178,
    difference: -2,
    reason: "consumo_interno",
    observation: "Uso na cozinha",
    user: "Admin",
  },
  {
    id: "adj-8",
    date: "2026-02-15 10:00",
    productId: "prod-9",
    productName: "Massa Esparguete 500g",
    storeId: "store-3",
    storeName: "Filial Cacuaco",
    type: "add",
    previousQty: 95,
    newQty: 100,
    difference: 5,
    reason: "contagem_fisica",
    observation: "Recontagem de prateleira",
    user: "Admin",
  },
];

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

export function getInventoryProducts() {
  return mockProducts.filter((p) => p.status === "active");
}

export function formatKz(value: number) {
  return value.toLocaleString("pt-AO") + " Kz";
}
