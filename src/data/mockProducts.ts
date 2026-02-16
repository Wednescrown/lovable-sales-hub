export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  subcategoryId: string;
  categoryName: string;
  subcategoryName: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  packSize: number;
  unit: string;
  status: "active" | "inactive";
  lowStock: boolean;
}

export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Bebidas",
    subcategories: [
      { id: "sub-1", name: "Refrigerantes", categoryId: "cat-1" },
      { id: "sub-2", name: "Sumos", categoryId: "cat-1" },
      { id: "sub-3", name: "Águas", categoryId: "cat-1" },
      { id: "sub-4", name: "Cervejas", categoryId: "cat-1" },
    ],
  },
  {
    id: "cat-2",
    name: "Alimentação",
    subcategories: [
      { id: "sub-5", name: "Arroz & Massas", categoryId: "cat-2" },
      { id: "sub-6", name: "Enlatados", categoryId: "cat-2" },
      { id: "sub-7", name: "Cereais", categoryId: "cat-2" },
      { id: "sub-8", name: "Óleos & Temperos", categoryId: "cat-2" },
    ],
  },
  {
    id: "cat-3",
    name: "Higiene & Limpeza",
    subcategories: [
      { id: "sub-9", name: "Higiene Pessoal", categoryId: "cat-3" },
      { id: "sub-10", name: "Limpeza Doméstica", categoryId: "cat-3" },
      { id: "sub-11", name: "Papel & Descartáveis", categoryId: "cat-3" },
    ],
  },
  {
    id: "cat-4",
    name: "Laticínios",
    subcategories: [
      { id: "sub-12", name: "Leites", categoryId: "cat-4" },
      { id: "sub-13", name: "Iogurtes", categoryId: "cat-4" },
      { id: "sub-14", name: "Queijos", categoryId: "cat-4" },
    ],
  },
  {
    id: "cat-5",
    name: "Padaria & Confeitaria",
    subcategories: [
      { id: "sub-15", name: "Pães", categoryId: "cat-5" },
      { id: "sub-16", name: "Bolos & Doces", categoryId: "cat-5" },
    ],
  },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Coca-Cola 350ml",
    sku: "BEB-CC-350",
    barcode: "7891234560012",
    categoryId: "cat-1",
    subcategoryId: "sub-1",
    categoryName: "Bebidas",
    subcategoryName: "Refrigerantes",
    costPrice: 120,
    sellPrice: 200,
    stock: 450,
    minStock: 100,
    packSize: 24,
    unit: "un",
    status: "active",
    lowStock: false,
  },
  {
    id: "prod-2",
    name: "Fanta Laranja 500ml",
    sku: "BEB-FA-500",
    barcode: "7891234560029",
    categoryId: "cat-1",
    subcategoryId: "sub-1",
    categoryName: "Bebidas",
    subcategoryName: "Refrigerantes",
    costPrice: 130,
    sellPrice: 220,
    stock: 38,
    minStock: 80,
    packSize: 12,
    unit: "un",
    status: "active",
    lowStock: true,
  },
  {
    id: "prod-3",
    name: "Água Pura 1.5L",
    sku: "BEB-AP-150",
    barcode: "7891234560036",
    categoryId: "cat-1",
    subcategoryId: "sub-3",
    categoryName: "Bebidas",
    subcategoryName: "Águas",
    costPrice: 80,
    sellPrice: 150,
    stock: 620,
    minStock: 200,
    packSize: 6,
    unit: "un",
    status: "active",
    lowStock: false,
  },
  {
    id: "prod-4",
    name: "Arroz Tio João 5kg",
    sku: "ALM-TJ-5KG",
    barcode: "7891234560043",
    categoryId: "cat-2",
    subcategoryId: "sub-5",
    categoryName: "Alimentação",
    subcategoryName: "Arroz & Massas",
    costPrice: 2800,
    sellPrice: 3500,
    stock: 15,
    minStock: 50,
    packSize: 1,
    unit: "kg",
    status: "active",
    lowStock: true,
  },
  {
    id: "prod-5",
    name: "Óleo de Soja 900ml",
    sku: "ALM-OS-900",
    barcode: "7891234560050",
    categoryId: "cat-2",
    subcategoryId: "sub-8",
    categoryName: "Alimentação",
    subcategoryName: "Óleos & Temperos",
    costPrice: 650,
    sellPrice: 950,
    stock: 180,
    minStock: 50,
    packSize: 1,
    unit: "un",
    status: "active",
    lowStock: false,
  },
  {
    id: "prod-6",
    name: "Sabonete Dove 90g",
    sku: "HIG-DV-090",
    barcode: "7891234560067",
    categoryId: "cat-3",
    subcategoryId: "sub-9",
    categoryName: "Higiene & Limpeza",
    subcategoryName: "Higiene Pessoal",
    costPrice: 350,
    sellPrice: 550,
    stock: 5,
    minStock: 30,
    packSize: 1,
    unit: "un",
    status: "active",
    lowStock: true,
  },
  {
    id: "prod-7",
    name: "Leite Ninho 400g",
    sku: "LAT-LN-400",
    barcode: "7891234560074",
    categoryId: "cat-4",
    subcategoryId: "sub-12",
    categoryName: "Laticínios",
    subcategoryName: "Leites",
    costPrice: 1800,
    sellPrice: 2500,
    stock: 42,
    minStock: 20,
    packSize: 1,
    unit: "un",
    status: "active",
    lowStock: false,
  },
  {
    id: "prod-8",
    name: "Cerveja Cuca 330ml",
    sku: "BEB-CK-330",
    barcode: "7891234560081",
    categoryId: "cat-1",
    subcategoryId: "sub-4",
    categoryName: "Bebidas",
    subcategoryName: "Cervejas",
    costPrice: 180,
    sellPrice: 300,
    stock: 0,
    minStock: 100,
    packSize: 24,
    unit: "un",
    status: "inactive",
    lowStock: true,
  },
  {
    id: "prod-9",
    name: "Massa Esparguete 500g",
    sku: "ALM-ME-500",
    barcode: "7891234560098",
    categoryId: "cat-2",
    subcategoryId: "sub-5",
    categoryName: "Alimentação",
    subcategoryName: "Arroz & Massas",
    costPrice: 380,
    sellPrice: 550,
    stock: 95,
    minStock: 40,
    packSize: 1,
    unit: "un",
    status: "active",
    lowStock: false,
  },
  {
    id: "prod-10",
    name: "Detergente Omo 1kg",
    sku: "HIG-OM-1KG",
    barcode: "7891234560104",
    categoryId: "cat-3",
    subcategoryId: "sub-10",
    categoryName: "Higiene & Limpeza",
    subcategoryName: "Limpeza Doméstica",
    costPrice: 1200,
    sellPrice: 1800,
    stock: 22,
    minStock: 25,
    packSize: 1,
    unit: "un",
    status: "active",
    lowStock: true,
  },
];
