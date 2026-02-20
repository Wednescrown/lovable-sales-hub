

# Adicionar Botoes de Gestao a Pagina de Funcoes

## Problema
A pagina actual de Funcoes & Permissoes permite apenas visualizar e alternar permissoes existentes, mas nao tem botoes para adicionar novos modulos a matriz nem para gerir os cargos.

## O Que Sera Adicionado

### 1. Botao "Adicionar Modulo"
- Um botao no cabecalho da pagina que abre um dialogo
- O dialogo pede o identificador interno (slug) e o nome de exibicao do modulo
- Ao confirmar, insere uma linha na tabela `module_permissions` para cada um dos 4 cargos (com `can_access = false` por defeito, excepto admin que fica `true`)
- O modulo aparece imediatamente na matriz de permissoes

### 2. Botao "Editar Cargo" nos Cards de Cargo
- Adicionar um icone de edicao (lapiz) em cada card de cargo (excepto admin)
- Ao clicar, abre um dialogo onde se pode editar a descricao do cargo
- Nota: os nomes dos cargos estao definidos como enum no banco de dados (`app_role`), por isso a criacao de cargos totalmente novos requer uma migracao de base de dados. Para manter o sistema estavel, a edicao sera limitada aos metadados visuais (label e descricao) armazenados localmente

### 3. Botao "Remover Modulo"
- Na vista de edicao de um cargo, cada modulo tera um botao para remover esse modulo da matriz inteira (remove as linhas de todos os cargos)
- Com confirmacao antes de apagar

## Detalhes Tecnicos

### Ficheiros a Modificar
- **`src/pages/Funcoes.tsx`** -- adicionar os dialogos, botoes e mutacoes

### Novas Mutacoes React Query
1. **`addModule`** -- insere 4 linhas em `module_permissions` (uma por cargo) usando `supabase.from("module_permissions").insert([...])`
2. **`removeModule`** -- apaga todas as linhas de `module_permissions` onde `module = X` usando `supabase.from("module_permissions").delete().eq("module", x)`

### Componentes UI Utilizados
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` para os formularios
- `Input` para o nome do modulo
- `Button` para accoes
- `AlertDialog` para confirmacao de remocao

### Sobre Cargos Personalizados
Os cargos estao definidos como um enum PostgreSQL (`app_role`), o que significa que adicionar novos cargos requer alterar esse enum na base de dados. Para uma primeira versao, vamos focar na gestao de modulos (que e dinamica). Se no futuro quiser criar cargos completamente novos, sera necessaria uma migracao de base de dados para estender o enum.

