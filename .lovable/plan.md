
# Migrar para Base de Dados + Melhorias em Gestao de Produtos e Estoque

## Resumo

Substituir todos os dados mock (`mockProducts`, `mockCategories`, `mockInventory`) por dados reais do Supabase em todas as paginas. Remover o campo "Estoque" do formulario de produtos, adicionar confirmacao ao eliminar produtos, e criar a pagina de Estoque Disponivel.

## Alteracoes

### 1. Tipo de Produto unificado

Criar um tipo `Product` compativel com a base de dados (baseado em `ProductRow`) e eliminar o tipo `Product` do `mockProducts.ts`. O novo tipo sera exportado de `useProducts.ts` e reutilizado em todo o sistema.

Campos mapeados:
- `id`, `name`, `sku`, `barcode`, `category_id`, `subcategory_id`, `cost_price`, `sell_price`, `stock`, `min_stock`, `pack_size`, `unit`, `status`
- `category_name`, `subcategory_name` (joins)

### 2. POS — Usar produtos da BD

**`POSProductGrid.tsx`**:
- Receber `products` e `categories` como props em vez de importar mocks
- Adaptar campos: `sellPrice` -> `sell_price`, `categoryId` -> `category_id`, etc.

**`POS.tsx`**:
- Importar `useProducts` e `useCategories` para obter dados reais
- Passar dados como props ao `POSProductGrid`
- Actualizar barcode scan para pesquisar nos produtos da BD
- Adaptar `POSCart` e `POSPaymentDialog` para o novo tipo

**`POSCart.tsx`**:
- Actualizar referencia ao tipo `Product` para usar `ProductRow`
- Adaptar campos (`sellPrice` -> `sell_price`)

### 3. PurchaseOrders e GoodsReceived — Usar produtos da BD

**`ProductSearchInput.tsx`** (componente partilhado):
- Receber `products: ProductRow[]` como prop em vez de importar `mockProducts`
- Adaptar campos de pesquisa e barcode scan
- Adaptar `onSelect` para devolver `ProductRow`

**`PurchaseOrders.tsx`**:
- Importar `useProducts` para buscar produtos reais
- Passar produtos ao `ProductSearchInput`
- Adaptar `handleProductSelect` para usar `ProductRow` (`cost_price`, `pack_size`, etc.)

**`GoodsReceived.tsx`**:
- Mesmas alteracoes que `PurchaseOrders`

### 4. StockAdjustment e StockCount — Usar produtos da BD

**`StockAdjustment.tsx`**:
- Substituir `mockProducts` por `useProducts()`
- Substituir `mockStores` por dados de `branches` (query Supabase)
- Adaptar campos

**`StockCount.tsx`**:
- Substituir `mockProducts` por `useProducts()`
- Substituir `mockStores` por `branches`
- Adaptar campos

### 5. Labels — Usar produtos da BD

**`Labels.tsx`**:
- Substituir `mockProducts` por `useProducts()`
- Adaptar campos

### 6. Eliminar ficheiros mock

- Eliminar `src/data/mockProducts.ts`
- Actualizar `src/data/mockInventory.ts` para remover dependencia de mockProducts (manter tipos e constantes uteis como `adjustmentReasonLabels`, mover `Store` para usar `branches`)

### 7. Gestao de Produtos — Melhorias

**Remover campo "Estoque Inicial"** do formulario de criacao/edicao em `Products.tsx`:
- Remover o campo `stock` do formulario (o stock sera gerido apenas por recebimentos e ajustes)
- Manter `min_stock` (alerta de estoque baixo)

**Confirmacao ao eliminar produto**:
- Adicionar `AlertDialog` de confirmacao antes de eliminar um produto
- Mostrar nome do produto na mensagem de confirmacao

### 8. Pagina "Estoque Disponivel"

Criar `src/pages/StockAvailable.tsx`:
- Listar todos os produtos com stock actual, stock minimo, estado (normal/baixo/sem stock)
- Filtros: categoria, subcategoria, estado de stock
- KPI cards: total produtos, produtos com stock baixo, produtos sem stock, valor total em stock
- Coluna de "Cobertura" (dias estimados baseado em vendas — placeholder por agora)
- Rota: `/estoque` em `App.tsx`

### 9. Ficheiros a criar/editar

| Ficheiro | Accao |
|---|---|
| `src/hooks/useProducts.ts` | Editar — exportar tipo `ProductRow` como tipo principal |
| `src/components/pos/POSProductGrid.tsx` | Editar — receber dados por props |
| `src/components/pos/POSCart.tsx` | Editar — adaptar tipo |
| `src/pages/POS.tsx` | Editar — usar `useProducts` e `useCategories` |
| `src/components/compras/ProductSearchInput.tsx` | Editar — receber produtos por props |
| `src/pages/PurchaseOrders.tsx` | Editar — usar produtos da BD |
| `src/pages/GoodsReceived.tsx` | Editar — usar produtos da BD |
| `src/pages/StockAdjustment.tsx` | Editar — usar produtos da BD |
| `src/pages/StockCount.tsx` | Editar — usar produtos da BD |
| `src/pages/Labels.tsx` | Editar — usar produtos da BD |
| `src/pages/Products.tsx` | Editar — remover stock do form, adicionar AlertDialog de eliminacao |
| `src/pages/StockAvailable.tsx` | Criar — pagina de estoque disponivel |
| `src/App.tsx` | Editar — adicionar rota `/estoque` |
| `src/data/mockProducts.ts` | Eliminar |
| `src/data/mockInventory.ts` | Editar — remover dependencia de mockProducts |

### 10. Sequencia de implementacao

1. Actualizar `useProducts.ts` com tipo unificado
2. Actualizar `ProductSearchInput.tsx` para receber props
3. Actualizar `POSProductGrid.tsx`, `POSCart.tsx`, `POS.tsx`
4. Actualizar `PurchaseOrders.tsx` e `GoodsReceived.tsx`
5. Actualizar `StockAdjustment.tsx`, `StockCount.tsx`, `Labels.tsx`
6. Melhorar `Products.tsx` (remover stock, AlertDialog)
7. Criar `StockAvailable.tsx` e registar rota
8. Eliminar `mockProducts.ts` e limpar `mockInventory.ts`
