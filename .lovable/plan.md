

## Renomear para AngoPos + Cores da Bandeira de Angola

### Resumo

Duas alteracoes globais:

1. **Renomear "StockFlow" para "AngoPos"** em todos os locais onde aparece (sidebar, POS header, titulo da pagina)
2. **Mudar o esquema de cores** para reflectir as cores da bandeira de Angola: **vermelho**, **preto** e **amarelo/dourado**

---

### Cores da Bandeira de Angola

| Cor | Hex | Uso no app |
|---|---|---|
| Vermelho | #CC092F | Primary (botoes, links, destaques) |
| Preto | #000000 / tons escuros | Sidebar, backgrounds escuros |
| Amarelo/Dourado | #F9D616 | Accent, destaques secundarios, icones |

---

### Ficheiros a modificar

| Ficheiro | Alteracao |
|---|---|
| `index.html` | Mudar titulo de "angopos-wednescrown" para "AngoPos" nos tags title, og:title, twitter:title |
| `src/index.css` | Reescrever variaveis CSS: primary passa a vermelho, accent/warning a dourado, sidebar a preto/escuro, success mantém verde |
| `src/components/AppSidebar.tsx` | Mudar "StockFlow" para "AngoPos", "ERP & POS" para "Gestao & POS" |
| `src/components/pos/POSHeader.tsx` | Mudar "SF" para "AP", "StockFlow" para "AngoPos" |

### Detalhes das cores CSS

**Modo claro (`:root`)**:
- `--primary`: vermelho angolano (~0 80% 42%)
- `--primary-foreground`: branco
- `--accent`: dourado (~48 95% 53%)
- `--accent-foreground`: preto
- `--sidebar-background`: preto/quase preto (~0 0% 8%)
- `--sidebar-primary`: vermelho
- `--chart-1`: vermelho, `--chart-3`: dourado

**Modo escuro (`.dark`)**:
- `--primary`: vermelho ligeiramente mais claro (~0 75% 48%)
- `--accent`: dourado
- `--sidebar-background`: preto puro (~0 0% 5%)

As restantes cores (success, destructive, info, border, muted) mantem-se iguais ou com ajustes minimos para harmonizar.

