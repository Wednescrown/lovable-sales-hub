## Melhorias no Modulo de Declaracoes Financeiras

### Resumo das alteracoes

Tres melhorias no painel de Declaracoes do Dia:

1. **Duas abas no card de Declaracoes**: aba "Declaracao Actual" (formulario) e aba "Historico" (lista de declaracoes passadas)
2. **Limite de caixa apenas sobre dinheiro (cash)**: a excedencia e calculada so com base no valor em mao, sem incluir TPA nem transferencias
3. **Campos para TPA e Multicaixa na declaracao**: alem das denominacoes de notas/moedas, o operador pode inserir o valor declarado em TPA e em transferencias Multicaixa

---

### Detalhes

**1. Abas no card de Declaracoes**

O card "Declaracao de Abertura" passa a usar o componente `Tabs` com duas abas:

- **Declaracao Actual**: contem o formulario de abertura (denominacoes + campos TPA/Multicaixa + botao declarar). Apos declarar, mostra o resumo read-only
- **Historico**: mostra uma lista/tabela de declaracoes anteriores (mock data) com data, hora, operador, total cash, TPA, transferencias e estado (Aberto/Fechado)

**2. Excedencia apenas sobre cash**

Actualmente `currentCashInDrawer` soma abertura + vendas cash - pickups. O limite de 50.000 Kz ja se aplica apenas a este valor. Nao ha alteracao de logica aqui -- so garantir que os novos campos de TPA/Multicaixa NAO entram no calculo do limite nem no `currentCashInDrawer`. A barra de limite e o alerta continuam a referir-se apenas ao dinheiro fisico.

**3. Campos TPA e Multicaixa na declaracao**

O formulario de abertura ganha duas seccoes adicionais abaixo do `DenominationPanel`:

- **Valor TPA**: campo numerico para o operador declarar quanto tem em recibos/comprovantes TPA
- **Valor Multicaixa/Transferencias**: campo numerico para comprovantes de transferencias

O resumo total passa a mostrar tres linhas: Total Cash (das denominacoes), Total TPA, Total Transferencias, e um Gran Total.

---

### Ficheiros a modificar


| Ficheiro                                        | Alteracao                                                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Financas.tsx`                        | Adicionar `Tabs` ao card de declaracoes; novos estados para `tpaAmount` e `multicaixaAmount`; mock data para historico; garantir que limite se aplica so a cash |
| `src/components/financas/DenominationPanel.tsx` | Sem alteracao                                                                                                                                                   |


### Dados mock do historico

Criar um array `mockDeclarationHistory` com 3-4 registos anteriores contendo: id, data, operador, totalCash, totalTpa, totalTransfer, estado.

E as declarações devem ser feitas pelo supervisor ou gerente,  selecionando o operador de caixa , em casos de lojas com mais de 1 operador de caixa

### Estrutura visual das abas

```text
+--------------------------------------------------+
| Declaracao de Abertura                           |
| [Declaracao Actual] [Historico]                  |
+--------------------------------------------------+
| Aba "Declaracao Actual":                         |
|   Denominacoes (notas/moedas)    Total: X Kz     |
|   ----------------------------------------       |
|   Valor TPA:           [________] Kz             |
|   Valor Multicaixa:    [________] Kz             |
|   ----------------------------------------       |
|   Cash: X | TPA: Y | Transf: Z | TOTAL: W       |
|   [Declarar Abertura -- W Kz]                    |
+--------------------------------------------------+
| Aba "Historico":                                 |
|   Data       | Operador | Cash   | TPA   | Est. |
|   18/02/2026 | Maria    | 25000  | 12000 | Fech.|
|   17/02/2026 | Joao     | 18000  | 8500  | Fech.|
+--------------------------------------------------+ 


```