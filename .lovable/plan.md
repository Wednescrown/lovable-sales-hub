## Melhorias em 4 Modulos: POS, Produtos, Etiquetas e Contagem de Inventario

---

### 1. POS -- Multiplas Vendas + Popup no Botao "Painel"

**Multiplas vendas**: Actualmente, apos confirmar pagamento e clicar "Nova Venda", o carrinho limpa e o operador pode iniciar uma nova venda. Isto ja funciona. Nenhuma alteracao necessaria aqui.

Multiplas vendas que digo, é haver a possibilidade de abrir mais janelas, com a mesma funcionalidade no maximo até 10, isso para facilitar vendas em restaurantes 

**Popup no botao "Painel"**: O botao "Painel" no header do POS (que redireciona para `/`) passa a abrir um `AlertDialog` com duas opcoes:

- **Pausar Caixa**: Bloqueia o ecra do POS com um overlay de "Caixa em Pausa" (com mensagem "Operador ausente" e botao "Retomar"). O carrinho actual e preservado. Ideal para idas ao WC.
- **Fechar Caixa**: Redireciona para `/declaracao` (pagina de Financas) para o caixeiro fazer a declaracao financeira e fecho de caixa.


| Ficheiro                           | Alteracao                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/components/pos/POSHeader.tsx` | Remover o `Link to="/"` do botao Painel; adicionar prop `onPanelClick` para abrir o dialog                          |
| `src/pages/POS.tsx`                | Adicionar estado `panelDialogOpen` e `paused`; criar AlertDialog com 2 opcoes; overlay de pausa com botao "Retomar" |


---

### 2. Produtos -- Importar Excel + Botao "Enviar para Lista de Compras"

**Importacao Excel**: Adicionar botao "Importar" ao lado do "Exportar" existente. Ao clicar, abre um dialog com:

- Zona de upload para ficheiro `.xlsx` / `.xls` / `.csv`
- Preview dos dados lidos (tabela simples)
- Botao "Confirmar Importacao"
- Nota: como nao ha backend, a importacao sera simulada (parse do ficheiro com `FileReader` e exibicao dos dados; sem persistencia real)

**Botao "Lista de Compras"**: Na coluna Acoes da tabela de produtos, adicionar um terceiro botao (icone ShoppingCart) ao lado de Editar e Eliminar. Ao clicar, mostra um toast "Produto adicionado a lista de compras". Criar um estado local `shoppingList` para guardar os IDs dos produtos adicionados, com badge no header indicando quantos items estao na lista.


| Ficheiro                 | Alteracao                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/Products.tsx` | Adicionar botao "Importar" + dialog de upload; botao "Lista de Compras" na tabela; estado `shoppingList`; toast de confirmacao |


---

### 3. Gestao de Etiquetas -- Nova Pagina

Criar uma nova pagina `/etiquetas` com duas funcionalidades:

- **Etiquetas de Codigo de Barras**: Seleccionar produtos, definir quantidade de etiquetas, gerar preview visual de etiquetas com codigo de barras (formato Code128/EAN13 simulado via CSS) e nome do produto. Botao "Imprimir" que chama `window.print()`.
- **Etiquetas de Preco (Prateleira)**: Seleccionar produtos, gerar etiquetas com nome, preco de venda e codigo de barras para colocar nas prateleiras. Layout optimizado para impressao em folha A4 com grelha de etiquetas.


| Ficheiro                        | Alteracao                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Labels.tsx`          | Nova pagina com tabs "Codigo de Barras" e "Precos Prateleira"; pesquisa de produtos; preview de etiquetas; botao imprimir |
| `src/App.tsx`                   | Adicionar rota `/etiquetas`                                                                                               |
| `src/components/AppSidebar.tsx` | Adicionar link "Etiquetas" no menu lateral (icone Tag)                                                                    |


---

### 4. Contagem de Inventario -- Popup de Produto + Pesquisa na Lista

**Popup ao seleccionar produto**: Quando o utilizador clica num resultado da pesquisa, em vez de adicionar directamente a lista, abre um `Dialog` com:

- Resumo do produto: nome, SKU, codigo de barras, categoria, stock actual no sistema, preco custo, preco venda
- Campo de texto para inserir a quantidade contada (com autofocus)
- Ao confirmar (Enter ou botao), adiciona a lista com a quantidade inserida

**Pesquisa dentro da lista de contagem**: Adicionar um segundo campo de pesquisa acima da tabela de contagem que filtra os items ja adicionados por nome. Util quando ha mais de 100 produtos na lista e se precisa editar um especifico.


| Ficheiro                   | Alteracao                                                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/StockCount.tsx` | Adicionar dialog de detalhe do produto com campo quantidade autofocus; adicionar campo de pesquisa/filtro na lista de contagem; estado `listSearch` para filtrar `countItems` |


---

### Detalhes Tecnicos

- **Dependencias**: Nenhuma nova dependencia necessaria. Todos os componentes UI ja existem (Dialog, AlertDialog, Tabs, Input, Badge, Table, Toast)
- **Rota nova**: `/etiquetas` em `App.tsx`
- **Sidebar**: Novo item "Etiquetas" com icone `Tag` do lucide-react
- **Impressao de etiquetas**: Usar `@media print` CSS para esconder tudo excepto as etiquetas ao imprimir, e `window.print()`
- **Upload Excel**: Usar `FileReader` nativo para ler ficheiros; parse basico de CSV. Para `.xlsx` real seria necessaria uma lib como `xlsx`, mas inicialmente suportaremos CSV
- **POS pausa**: Overlay `fixed inset-0 z-[100]` com fundo escuro e mensagem central; estado `paused` impede interaccoes com o POS