

## Modulo de Inventario - Ajuste de Estoque e Contagem Geral

### Resumo
Criar duas paginas visuais completas para o modulo de Inventario, seguindo os padroes visuais ja estabelecidos (AppLayout, Cards, Tables, Dialogs) e usando dados mockados em Kwanza (Kz).

---

### Pagina 1: Ajuste de Estoque (`/inventario`)

**Funcionalidade visual:**
- Header com titulo "Ajuste de Estoque" e botao "Novo Ajuste"
- KPIs: Total de ajustes do dia, Ajustes positivos, Ajustes negativos
- Tabela de historico de ajustes recentes (data, produto, loja, tipo, quantidade anterior, quantidade nova, diferenca, motivo, usuario)
- Dialog "Novo Ajuste" com:
  - Selecao de loja (dropdown)
  - Campo de pesquisa por nome ou codigo de barras
  - Ao selecionar produto: mostra descricao, stock atual do sistema
  - Campo para quantidade contada
  - Tipo de ajuste: Adicionar / Reduzir (radio ou toggle)
  - Motivo do ajuste (dropdown): Contagem fisica, Dano, Roubo, Consumo interno, Erro de lancamento, Outro
  - Campo de observacao (textarea)
  - Indicador visual da diferenca (verde se positivo, vermelho se negativo)

---

### Pagina 2: Contagem Geral de Inventario (`/contagem-inventario`)

**Funcionalidade visual completa conforme especificacao:**

**Area principal:**
- Header com titulo, selecao de loja, e botoes "Salvar Rascunho" e "Finalizar Inventario"
- Campo de pesquisa por nome ou codigo de barras para adicionar produtos
- Tabela de contagem com colunas:
  - Produto (nome + descricao)
  - Qtd. Sistema (stock registrado)
  - Qtd. Contada (editavel inline)
  - Diferenca Qtd (verde positivo, vermelho negativo)
  - Diferenca Valor Custo (verde/vermelho)
  - Diferenca Valor Venda (verde/vermelho)
  - Botao editar quantidade

**Painel lateral/superior de Balanco Geral:**
- Card com 3 metricas:
  - Perda em Stock (custo)
  - Diferenca em Valor de Venda
  - Balanco Geral (positivo verde, negativo vermelho)
- Contadores: Total de produtos contados vs total de produtos na loja

**Pop-up de Produtos Nao Contados (ao finalizar):**
- Dialog listando produtos com stock diferente de zero que nao foram adicionados a contagem
- Possibilidade de inserir quantidade contada diretamente no popup
- Botao para adicionar a contagem geral

**Pop-up de Periodo do Inventario (apos produtos nao contados):**
- Selecao de data inicio (ultimo inventario)
- Comparacao com declaracoes financeiras do periodo
- Resumo final: valor do estoque, perdas obtidas, saldo

---

### Ficheiros a criar/modificar

| Ficheiro | Acao |
|---|---|
| `src/pages/StockAdjustment.tsx` | Criar - pagina de Ajuste de Estoque |
| `src/pages/StockCount.tsx` | Criar - pagina de Contagem Geral |
| `src/data/mockInventory.ts` | Criar - dados mock para ajustes e contagens |
| `src/App.tsx` | Modificar - adicionar rotas `/inventario` e `/contagem-inventario` |

---

### Detalhes Tecnicos

- Seguir padrao existente: `AppLayout` como wrapper, componentes UI do shadcn/ui (Card, Table, Dialog, Select, Input, Badge, Button)
- Formatacao de valores com `formatKz()` ja existente
- Indicadores de diferenca: classes `text-success` para positivo, `text-destructive` para negativo
- Dados mock incluirao ~10 produtos com quantidades de sistema pre-definidas para simular diferencas
- Mock de lojas (3-4 filiais) para o dropdown de selecao
- Estado local com `useState` para toda a interatividade (pesquisa, adicao a lista, edicao inline, pop-ups de finalizacao)
- Contagem geral permite acumular quantidades se produto ja existir na lista (soma automatica)

