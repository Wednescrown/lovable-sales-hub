

## Correcção: PIN e Botão "Fechar Empresa"

### Problema 1: PIN nunca aceite
O utilizador registado **não tem PIN definido** na base de dados. A função `validate_user_pin` compara o PIN inserido com o PIN armazenado, mas como o campo `pin` é `NULL`, retorna sempre `false`.

**Solução**: Quando o utilizador não tem PIN definido, permitir o acesso sem PIN (primeiro acesso) e apresentar um formulário para definir o PIN imediatamente após a entrada.

### Problema 2: Botão "Fechar Empresa" sem acção
O `closeCompany` faz `signOut` de forma assíncrona mas o componente depende do `<Navigate>` reactivo para redirecionar. Isto pode falhar se o componente desmonta antes do estado actualizar.

**Solução**: Adicionar navegação explícita após o `closeCompany`.

---

### Alteracoes

#### 1. `src/pages/auth/UserSelect.tsx`
- No `handleValidatePin`: antes de chamar `validate_user_pin`, verificar se o perfil tem PIN definido. Se nao tiver, permitir acesso directo e redirecionar para definir PIN.
- Adicionar um fluxo de "Definir PIN" quando o utilizador nao tem PIN (dialogo apos seleccionar perfil mostra formulario para criar PIN em vez de pedir PIN).
- Corrigir o botao "Fechar Empresa": criar `handleCloseCompany` que chama `await closeCompany()` e depois `navigate("/auth/company")`.

#### 2. Nova funcionalidade: deteccao de PIN no perfil
- Adicionar campo `has_pin` ao fetch de perfis usando uma query que verifica `pin IS NOT NULL`.
- Alternativamente, criar uma RPC `check_has_pin(_profile_id uuid)` que retorna boolean (SECURITY DEFINER para nao expor o campo pin).

#### 3. Migracoes SQL
- Criar funcao `check_has_pin(_profile_id uuid) RETURNS boolean` (SECURITY DEFINER) que retorna se o perfil tem PIN definido.

---

### Secao Tecnica

**Ficheiros a modificar:**
- `src/pages/auth/UserSelect.tsx` — logica de PIN e botao fechar
- Nova migracao SQL — funcao `check_has_pin`

**Fluxo actualizado:**
1. Utilizador selecciona perfil
2. Sistema verifica se tem PIN via `check_has_pin`
3. Se NAO tem PIN → mostra formulario "Definir PIN" (chama `set_user_pin` + `validate_user_pin`)
4. Se TEM PIN → mostra formulario "Inserir PIN" (comportamento actual)
5. Botao "Fechar Empresa" → `await closeCompany()` → `navigate("/auth/company")`

