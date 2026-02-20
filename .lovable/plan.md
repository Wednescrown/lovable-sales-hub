

## Leitura Global de Codigo de Barras no POS

### Resumo

Implementar um listener global de teclado no modulo POS que captura automaticamente leituras de scanners de codigo de barras, sem necessidade de foco manual no campo de pesquisa. O scanner envia caracteres rapidamente seguidos de Enter -- o sistema detecta esse padrao, busca o produto pelo barcode e adiciona ao carrinho.

---

### Como funciona

1. Um `useEffect` no componente `POS` regista um event listener global em `document` para eventos `keydown`
2. Caracteres alfanumericos sao acumulados num buffer (ref)
3. Ao detectar `Enter`, o buffer e processado como codigo de barras
4. O buffer e limpo automaticamente apos um timeout (ex: 100ms sem tecla) para evitar captura acidental de digitacao normal
5. A leitura e ignorada quando:
   - O caixa esta em pausa (`paused === true`)
   - Um modal/dialog esta aberto (`paymentOpen`, `panelDialogOpen`)
   - O foco esta num campo de input/textarea (o utilizador esta a digitar manualmente)

### Logica de processamento

```text
keydown -> caracter alfanumerico?
  Sim -> acumular no buffer, resetar timeout
  Enter? -> processar buffer:
    -> Buscar produto em mockProducts onde barcode === buffer
    -> Encontrado? -> addToCart(produto) + toast de sucesso
    -> Nao encontrado? -> toast de erro "Produto nao cadastrado"
    -> Limpar buffer
  Timeout 100ms sem tecla -> limpar buffer (input humano lento, nao e scanner)
```

---

### Ficheiros a modificar

| Ficheiro | Alteracao |
|---|---|
| `src/pages/POS.tsx` | Adicionar hook `useEffect` com listener global `keydown`; criar `useRef` para buffer e timeout; funcao `handleBarcodeScan(barcode)` que busca produto e chama `addToCart` ou mostra toast de erro |

### Detalhes tecnicos

- **Buffer**: `useRef<string>("")` para acumular caracteres
- **Timeout**: `useRef<NodeJS.Timeout>()` -- resetado a cada keydown; ao expirar (100ms), limpa o buffer
- **Filtro de foco**: verificar `document.activeElement?.tagName` -- se for `INPUT` ou `TEXTAREA`, ignorar (o utilizador esta a digitar no campo de pesquisa normalmente)
- **Filtro de modais**: verificar estados `paused`, `paymentOpen`, `panelDialogOpen`, `drawerOpen` -- se algum estiver `true`, ignorar
- **Toast**: usar `toast` do sonner para feedback visual nao bloqueante ("Produto adicionado" ou "Produto nao cadastrado")
- **Dados**: por agora busca em `mockProducts` pelo campo `barcode`. Quando houver base de dados, bastara trocar por query ao Supabase

### Exemplo de uso

O operador aponta o scanner para o codigo de barras de uma "Coca-Cola 350ml" (barcode: `7891234560012`). O scanner envia rapidamente `7891234560012` + `Enter`. O sistema:
1. Acumula os digitos no buffer
2. Ao receber Enter, busca `mockProducts.find(p => p.barcode === "7891234560012")`
3. Encontra o produto -> chama `addToCart(produto)`
4. Mostra toast: "Coca-Cola 350ml adicionada ao carrinho"

