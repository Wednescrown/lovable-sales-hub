

## POS Responsivo Mobile + Prompt para Cursor/Android

### Parte 1: Tornar o POS Responsivo

**O que muda:**
Em ecras pequenos (menos de 768px), o carrinho lateral de 380px desaparece e e substituido por:
- Um botao flutuante no canto inferior direito com icone de carrinho, numero de itens e total
- Ao clicar, abre um drawer (painel inferior deslizante) com todo o conteudo do carrinho
- O header compacta: esconde info da loja/operador, pesquisa ocupa menos espaco
- A grelha de produtos passa a 2 colunas em mobile

**Ficheiros a modificar:**

| Ficheiro | Alteracao |
|---|---|
| `src/pages/POS.tsx` | Usar `useIsMobile()` para alternar entre layout side-by-side (desktop) e layout com drawer (mobile). Adicionar botao flutuante e drawer do carrinho |
| `src/components/pos/POSHeader.tsx` | Compactar header em mobile: esconder loja/operador (ja esta com `hidden md:flex`), ajustar pesquisa |
| `src/components/pos/POSProductGrid.tsx` | Ajustar grid para 2 colunas em mobile (ja tem `grid-cols-2`, esta ok) |
| `src/components/pos/POSCart.tsx` | Nenhuma alteracao necessaria - o componente ja e flexivel |

**Detalhes da implementacao:**
- Importar `useIsMobile` de `@/hooks/use-mobile`
- Importar `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle` de `@/components/ui/drawer`
- Em mobile: esconder o `div` do carrinho lateral, mostrar botao flutuante fixo
- O botao flutuante mostra: icone ShoppingCart + badge com quantidade + total formatado
- Clicar no botao abre Drawer com POSCart dentro
- Em desktop: manter layout actual sem alteracoes

---

### Parte 2: Prompt para Cursor (Android Nativo)

Apos implementar a responsividade, vou fornecer um prompt completo e detalhado para criar o frontend Android nativo no Cursor, incluindo:
- Toda a estrutura de dados (Product, Category, CartItem)
- Layout e UI com Material Design 3 / Jetpack Compose
- Logica do carrinho, pagamento, e navegacao
- Especificacoes visuais exactas baseadas no POS web actual

O prompt sera entregue como texto na mensagem de implementacao para copiar directamente para o Cursor.

---

### Detalhes Tecnicos

- Componentes existentes reutilizados: `Drawer` (vaul), `useIsMobile`, `Badge`, `Button`
- Sem novas dependencias necessarias
- Breakpoint mobile: 768px (consistente com `use-mobile.tsx`)
- O drawer usa a biblioteca `vaul` ja instalada no projecto
- Botao flutuante com `position: fixed`, `bottom-4 right-4`, `z-50`

