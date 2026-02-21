

# Pesquisa inteligente de produtos + Quantidade por Caixa + Pop-ups em tela cheia

## Resumo

Substituir o botao "Adicionar" manual por um campo de pesquisa inteligente com suporte a scanner de codigo de barras nos dialogos de Lista de Compras e Recebimento (GRN). Adicionar a coluna "Qtd Caixas" com calculo automatico de unidades totais. Maximizar o tamanho dos pop-ups com scroll interno.

## O que muda para o utilizador

1. **Campo de pesquisa inteligente** no topo da tabela de itens — ao digitar, aparece uma lista de sugestoes filtradas por nome, SKU ou codigo de barras (usando os dados de `mockProducts`)
2. **Scanner de codigo de barras** — ao usar o leitor, o produto e adicionado automaticamente a lista e o cursor salta para o campo de quantidade
3. **Nova coluna "Qtd Caixas"** — o utilizador indica quantas caixas recebeu; o sistema multiplica pelo `packSize` do produto para calcular o total de unidades
4. **Colunas da tabela de itens**: Produto | SKU | Qtd Caixas | Un/Caixa (packSize, so leitura) | Total Unidades (calculado) | Custo Unit. | Total
5. **Pop-ups em tela cheia** — os dialogos ocupam ate 95% da largura e altura do ecra, com scroll vertical e horizontal interno

## Detalhes tecnicos

### 1. Componente reutilizavel: `ProductSearchInput`

Criar `src/components/compras/ProductSearchInput.tsx`:
- Um `Input` com icone de pesquisa
- Filtra `mockProducts` por `name`, `sku` e `barcode` (case-insensitive)
- Mostra dropdown (Popover ou lista absoluta) com resultados
- Ao seleccionar, chama `onSelect(product: Product)`
- Listener de buffer de codigo de barras (mesmo padrao do POS): acumula teclas rapidas (<100ms entre elas), ao detectar Enter procura por `barcode`, adiciona automaticamente sem clique

### 2. Modelo de item actualizado

Nas interfaces `POItem` e `NewGRNItem`, adicionar:
- `box_quantity: number` (caixas)
- `pack_size: number` (unidades por caixa, vindo do produto)
- `total_units: number` (= box_quantity * pack_size, calculado)

O campo `quantity_ordered` (PO) ou `quantity_received` (GRN) passa a ser preenchido automaticamente como `box_quantity * pack_size`.

### 3. Alteracoes em `PurchaseOrders.tsx`

- Remover botao "Adicionar" manual
- Adicionar `ProductSearchInput` acima da tabela de itens
- Ao seleccionar produto: adicionar linha com `product_name`, `sku`, `pack_size` pre-preenchidos, `box_quantity = 1`, cursor no campo quantidade
- Colunas: Produto | SKU | Qtd Caixas | Un/Caixa | Total Un. | Custo Unit. | Total | (remover)
- Logica de calculo: `total_units = box_quantity * pack_size`; `total_cost = total_units * unit_cost`
- `DialogContent` com classe `max-w-[95vw] max-h-[95vh] h-[95vh]` e conteudo em `ScrollArea` interno
- Listener global de barcode dentro do dialogo (activo apenas quando `dialogOpen === true`)

### 4. Alteracoes em `GoodsReceived.tsx`

- Mesmas alteracoes no dialogo de "Novo Recebimento":
  - `ProductSearchInput` em vez de botao "Adicionar"
  - Colunas com Qtd Caixas + Un/Caixa + Total Unidades
  - Pop-up maximizado com scroll
  - Barcode scanner listener
- Dialogo de "Detalhes" e "Devolucao" tambem maximizados com scroll

### 5. Tamanho dos pop-ups

Nos `DialogContent` de ambas as paginas:
- Classe: `max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col`
- Corpo do formulario dentro de `ScrollArea` com `flex-1 overflow-auto`
- Footer fixo no fundo do dialogo

### 6. Ficheiros a criar/editar

| Ficheiro | Accao |
|---|---|
| `src/components/compras/ProductSearchInput.tsx` | Criar — campo de pesquisa + barcode scanner |
| `src/pages/PurchaseOrders.tsx` | Editar — novo campo pesquisa, colunas caixa, pop-up maximizado |
| `src/pages/GoodsReceived.tsx` | Editar — novo campo pesquisa, colunas caixa, pop-ups maximizados |

### 7. Fluxo do scanner

```text
Utilizador scaneia codigo de barras
       |
       v
Buffer acumula digitos (< 100ms entre teclas)
       |
       v
Enter detectado → procura em mockProducts por barcode
       |
       ├── Encontrou → adiciona item a lista, foco no campo "Qtd Caixas"
       |
       └── Nao encontrou → toast de erro "Produto nao encontrado"
```

