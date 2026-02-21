

# Plano: Redefinicao de PIN + Modulo de Compras e Devolucoes

## Parte 1: Redefinicao de PIN pelo Administrador

### O que muda
Na pagina de Utilizadores (`Users.tsx`), o dialogo de edicao passa a incluir um botao "Redefinir PIN" que permite ao administrador limpar o PIN actual do utilizador. Na proxima vez que o utilizador fizer login, sera obrigado a definir um novo PIN (fluxo ja existente no `UserSelect.tsx`).

### Alteracoes tecnicas
- **Migracao SQL**: Criar funcao `reset_user_pin(_profile_id uuid)` (SECURITY DEFINER) que faz `UPDATE profiles SET pin = NULL WHERE id = _profile_id`
- **`src/pages/Users.tsx`**: Adicionar botao "Redefinir PIN" no dialogo de edicao com confirmacao AlertDialog. Chama `supabase.rpc("reset_user_pin", { _profile_id })`.

---

## Parte 2: Modulo de Compras e Devolucoes

### Novas tabelas na base de dados

**`suppliers`** — Fornecedores
- `id`, `company_id`, `name`, `contact_person`, `email`, `phone`, `address`, `tax_id` (NIF), `is_active`, `created_at`, `updated_at`
- RLS: isolamento por `company_id`

**`purchase_orders`** — Lista de Compras / Notas de Encomenda
- `id`, `company_id`, `branch_id`, `supplier_id`, `order_number` (sequencial por empresa), `status` (draft/sent/partial/received/cancelled), `notes`, `expected_date`, `total_amount`, `created_by`, `created_at`, `updated_at`
- RLS: isolamento por `company_id`

**`purchase_order_items`** — Itens da lista de compra
- `id`, `purchase_order_id`, `product_name`, `sku`, `quantity_ordered`, `quantity_received`, `unit_cost`, `total_cost`
- RLS: via join com `purchase_orders`

**`goods_received_notes`** — Recebimentos (GRN)
- `id`, `company_id`, `branch_id`, `supplier_id`, `purchase_order_id` (nullable — permite recebimento directo), `grn_number` (sequencial por empresa), `status` (received/returned/corrected), `notes`, `total_amount`, `received_by`, `received_at`, `created_at`, `updated_at`
- RLS: isolamento por `company_id`

**`grn_items`** — Itens do recebimento
- `id`, `grn_id`, `product_name`, `sku`, `quantity_received`, `unit_cost`, `total_cost`
- RLS: via join com `goods_received_notes`

**`grn_returns`** — Devolucoes de recebimentos
- `id`, `company_id`, `grn_id`, `return_number` (sequencial), `reason`, `total_amount`, `returned_by`, `returned_at`, `created_at`
- Regra de negocio: so permitir devolucao ate 2 dias apos recebimento, excepto admin
- RLS: isolamento por `company_id`

**`grn_return_items`** — Itens devolvidos
- `id`, `grn_return_id`, `grn_item_id`, `quantity_returned`, `unit_cost`, `total_cost`

### Funcoes SQL auxiliares
- `generate_next_order_number(_company_id uuid)` — gera numero sequencial para purchase orders
- `generate_next_grn_number(_company_id uuid)` — gera numero sequencial para GRNs
- `generate_next_return_number(_company_id uuid)` — gera numero sequencial para devolucoes
- `can_return_grn(_grn_id uuid, _user_id uuid)` — verifica se a devolucao e permitida (2 dias ou admin)

### Novas paginas e componentes

**`src/pages/Suppliers.tsx`** — CRUD completo de fornecedores
- Listagem com pesquisa e filtros
- Dialogo para criar/editar fornecedor
- Desactivar fornecedor (soft delete)
- KPI cards: total fornecedores, activos, inactivos

**`src/pages/PurchaseOrders.tsx`** — Lista de Compras
- Listagem de ordens de compra com status (Rascunho, Enviada, Parcial, Recebida, Cancelada)
- Criar nova ordem: seleccionar fornecedor, adicionar itens (produto, quantidade, custo unitario)
- Editar/cancelar ordens em rascunho
- Botao "Receber" que abre o fluxo de GRN pre-preenchido

**`src/pages/GoodsReceived.tsx`** — Recebimento (GRN)
- Duas formas de criar recebimento:
  1. A partir de uma ordem de compra (pre-preenche itens)
  2. Recebimento directo (sem ordem de compra)
- Formulario: seleccionar fornecedor, adicionar itens, quantidades, custos
- Numeracao automatica (GRN-001, GRN-002...)
- Historico de recebimentos com tabela numerada
- Painel de detalhes por recebimento
- Botao "Devolver" por documento recebido
  - Bloqueado apos 2 dias (excepto admin)
  - Formulario de devolucao: seleccionar itens e quantidades a devolver, motivo
- Botao "Corrigir" — disponivel ate 2 dias apos lancamento (ou admin)

### Componentes auxiliares
- `src/components/compras/SupplierFormDialog.tsx` — formulario de fornecedor
- `src/components/compras/PurchaseOrderFormDialog.tsx` — formulario de ordem de compra
- `src/components/compras/PurchaseOrderItems.tsx` — tabela de itens da ordem
- `src/components/compras/GRNFormDialog.tsx` — formulario de recebimento
- `src/components/compras/GRNReturnDialog.tsx` — formulario de devolucao
- `src/components/compras/GRNDetailPanel.tsx` — painel de detalhes do recebimento

### Rotas novas em `App.tsx`
- `/fornecedores` → `Suppliers`
- `/lista-compras` → `PurchaseOrders`
- `/recebimento` → `GoodsReceived`

### Fluxo do utilizador

```text
Fornecedores (CRUD)
       |
       v
Lista de Compras ──────────────────┐
  (criar ordem)                     |
       |                            |
       v                            v
  Recebimento (GRN)          Recebimento Directo
  (a partir da ordem)        (sem ordem de compra)
       |
       v
  Historico de Recebimentos
  (numerado: GRN-001, GRN-002...)
       |
       v
  Devolucao / Correccao
  (ate 2 dias ou admin)
```

### Sequencia de implementacao
1. Migracao SQL: funcao `reset_user_pin` + botao no Users.tsx
2. Migracao SQL: criar todas as tabelas e funcoes de compras
3. Pagina de Fornecedores (CRUD completo)
4. Pagina de Lista de Compras
5. Pagina de Recebimento (GRN) com historico e devolucoes
6. Registar rotas em App.tsx

