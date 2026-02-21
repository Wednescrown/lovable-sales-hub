

# Importacao de Quantidades em Estoque + Ordenacao de Tabelas

## Resumo

Duas funcionalidades serao adicionadas:

1. **Importacao de Stock** na pagina Estoque Disponivel (`/estoque`) -- um dialogo wizard (3 passos) que permite carregar um ficheiro CSV/Excel com quantidades, fazer o link entre barcode/SKU do sistema e a coluna de quantidade do ficheiro, e actualizar o stock dos produtos correspondentes.

2. **Ordenacao de colunas** nas tabelas de Gestao de Produtos e Estoque Disponivel -- clicar no cabecalho de qualquer coluna para ordenar ascendente/descendente.

---

## 1. Importacao de Quantidades (Stock)

### Fluxo do wizard (3 passos)

1. **Upload** -- o utilizador seleciona um ficheiro CSV/Excel
2. **Mapeamento** -- o sistema mostra os cabecalhos do ficheiro e pede ao utilizador para selecionar:
   - Qual coluna do ficheiro corresponde ao **Codigo de Barras** ou **SKU** (campo de ligacao, obrigatorio escolher pelo menos um)
   - Qual coluna corresponde a **Quantidade** (obrigatorio)
3. **Pre-visualizacao e Importacao** -- mostra a correspondencia encontrada entre os produtos do sistema e as linhas do ficheiro, com a quantidade actual vs nova quantidade. Ao confirmar, actualiza `products.stock` via Supabase `updateProduct`.

### Componente novo

- `src/components/stock/StockImportDialog.tsx` -- reutiliza o mesmo estilo visual do `ProductImportDialog` (wizard com steps, badges, tabela de mapeamento)

### Campos do sistema para mapeamento

| Campo Sistema | Obrigatorio | Descricao |
|---|---|---|
| Codigo de Barras (barcode) | Sim* | Usado para fazer match com o produto |
| SKU | Sim* | Alternativa ao barcode para match |
| Quantidade (stock) | Sim | Nova quantidade a importar |

*Pelo menos um dos dois (barcode ou SKU) deve ser mapeado.

### Logica de match e actualizacao

- Para cada linha do ficheiro, procura no array de produtos carregados (`useProducts`) um produto cujo `barcode` ou `sku` corresponda ao valor do ficheiro
- Se encontrar match, actualiza `products.stock` com a quantidade do ficheiro usando `updateProduct.mutateAsync`
- Linha a linha, mostrando progresso
- Produtos sem correspondencia sao contados como "nao encontrados" e mostrados no resumo

### Integracao na pagina StockAvailable

- Adicionar botao "Importar Stock" no cabecalho da pagina, ao lado do titulo
- Abrir o `StockImportDialog` ao clicar

---

## 2. Ordenacao de Colunas

### Hook reutilizavel

Criar um pequeno hook ou logica local de ordenacao com estado `sortField` e `sortDirection` (`asc` | `desc`).

### Cabecalhos clicaveis

Nos `TableHead` de ambas as tabelas (Products e StockAvailable), adicionar um handler `onClick` que alterna a ordenacao. Mostrar um icone de seta (ChevronUp/ChevronDown) no cabecalho activo.

### Colunas ordenaveis

**Gestao de Produtos:**
- Produto (nome), SKU, Codigo de Barras, Categoria, Custo, Venda, Estoque, Status

**Estoque Disponivel:**
- Produto (nome), SKU, Categoria, Stock Actual, Stock Minimo, Valor Custo, Valor Total, Estado

---

## Detalhes Tecnicos

### Ficheiros a criar
- `src/components/stock/StockImportDialog.tsx` -- dialogo wizard de importacao de stock

### Ficheiros a editar
- `src/pages/StockAvailable.tsx` -- adicionar botao de importacao + logica de ordenacao de colunas
- `src/pages/Products.tsx` -- adicionar logica de ordenacao de colunas

### Dependencias
- Nenhuma nova dependencia necessaria -- reutiliza componentes UI existentes e `useProducts`/`useProductMutations`

