

## Interface Visual do POS (Ponto de Venda)

### Resumo
Criar a pagina do POS com layout fullscreen (sem sidebar do ERP), dividida em duas areas: grelha de produtos a esquerda e carrinho/resumo a direita. Interface otimizada para uso rapido em caixa, com suporte a grelha e lista, filtros por categoria, pesquisa por codigo de barras, metodos de pagamento multiplos e resumo do pedido.

---

### Layout Geral

A pagina POS sera independente do `AppLayout` (sem sidebar ERP), ocupando 100% do ecra. Tera um botao para voltar ao painel de gestao.

```text
+------------------------------------------------------------------+
| HEADER: Logo | Loja | Operador | Pesquisa | Grelha/Lista | Sair  |
+----------------------------------------------+-------------------+
|                                              |                    |
|  FILTROS DE CATEGORIA (tabs horizontais)     |   CARRINHO         |
|                                              |   - Item 1  x2    |
|  +--------+ +--------+ +--------+           |   - Item 2  x1    |
|  | Prod 1 | | Prod 2 | | Prod 3 |           |   - Item 3  x3    |
|  | 200 Kz | | 220 Kz | | 150 Kz |           |                    |
|  +--------+ +--------+ +--------+           |   Subtotal         |
|  +--------+ +--------+ +--------+           |   Desconto         |
|  | Prod 4 | | Prod 5 | | Prod 6 |           |   TOTAL            |
|  |3500 Kz | | 950 Kz | | 550 Kz |           |                    |
|  +--------+ +--------+ +--------+           |   [Pagamento]      |
|                                              |   [Finalizar]      |
+----------------------------------------------+-------------------+
```

---

### Componentes da Pagina

**Header do POS:**
- Logo StockFlow compacto
- Nome da loja e operador de caixa (mock)
- Campo de pesquisa por nome ou codigo de barras
- Toggle Grelha/Lista para alternar visualizacao
- Botao "Voltar ao Painel" (link para /)

**Area de Produtos (esquerda ~65%):**
- Tabs horizontais de categorias (Todos, Bebidas, Alimentacao, etc.) usando dados de `mockCategories`
- Modo Grelha: cards com nome do produto, preco (Kz), e indicador de stock
- Modo Lista: tabela compacta com nome, SKU, preco, stock
- Clicar no produto adiciona ao carrinho (ou incrementa quantidade)
- Produtos sem stock aparecem desabilitados/opacidade reduzida

**Carrinho (direita ~35%):**
- Lista de itens adicionados com: nome, preco unitario, controles de quantidade (+/-), subtotal da linha, botao remover
- Campo de desconto (percentual ou valor fixo)
- Resumo: Subtotal, Desconto, Total a pagar
- Contador de itens totais

**Selecao de Metodo de Pagamento (Dialog ao finalizar):**
- Dialog/modal com opcoes: Dinheiro, TPA (cartao), Transferencia, Multicaixa Express
- Suporte a pagamento multiplo (split): ex. parte em dinheiro, parte em TPA
- Para cada metodo: campo de valor
- Calculo automatico do troco (para dinheiro)
- Resumo final antes de confirmar

**Confirmacao da Venda:**
- Apos confirmar pagamento, exibe resumo da venda com numero do recibo
- Botao "Nova Venda" para limpar carrinho

---

### Ficheiros a criar/modificar

| Ficheiro | Acao |
|---|---|
| `src/pages/POS.tsx` | Criar - pagina principal do POS |
| `src/components/pos/POSHeader.tsx` | Criar - header do POS |
| `src/components/pos/POSProductGrid.tsx` | Criar - grelha/lista de produtos |
| `src/components/pos/POSCart.tsx` | Criar - carrinho lateral |
| `src/components/pos/POSPaymentDialog.tsx` | Criar - dialog de pagamento |
| `src/App.tsx` | Modificar - adicionar rota `/pos` |

---

### Detalhes Tecnicos

- Layout fullscreen sem `AppLayout` (POS tem layout proprio)
- Reutiliza dados de `mockProducts` e `mockCategories` de `src/data/mockProducts.ts`
- Estado local com `useState` para carrinho, categoria ativa, modo de visualizacao, dialog de pagamento
- Formatacao de valores com `formatKz()` (funcao utilitaria a incluir se nao existir)
- Componentes shadcn/ui: Card, Dialog, Badge, Button, Input, Tabs, ScrollArea
- Icones lucide-react para acoes (Plus, Minus, Trash2, CreditCard, Banknote, etc.)
- Cores do tema corporativo existente
- Responsivo: em ecras menores o carrinho pode colapsar para um drawer inferior

