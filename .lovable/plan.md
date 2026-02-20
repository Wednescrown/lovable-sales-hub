

# Plano: Sistema de Autenticacao em Dois Niveis

## Resumo

Criar um sistema de autenticacao com dois niveis:
1. **Nivel 1 - Empresa**: Login da empresa (email + password). A sessao da empresa fica guardada no dispositivo (localStorage) e so pode ser encerrada por um administrador.
2. **Nivel 2 - Utilizador/Operador**: Seleccao do perfil do utilizador dentro da empresa, com senha individual. Permite trocar de utilizador sem fechar a empresa.

---

## Fluxo do Utilizador

```text
+---------------------------+
|   Dispositivo sem sessao  |
+---------------------------+
            |
            v
+---------------------------+
|  Tela 1: Login Empresa    |
|  (email + password)       |
+---------------------------+
            |
            v
+---------------------------+
|  Tela 2: Seleccao User   |
|  Lista de utilizadores    |
|  da empresa + senha       |
+---------------------------+
            |
            v
+---------------------------+
|  App Principal (Dashboard)|
+---------------------------+
            |
   [Trocar Utilizador]
            |
            v
+---------------------------+
|  Tela 2: Seleccao User   |
|  (empresa continua aberta)|
+---------------------------+

   [Fechar Empresa - so admin]
            |
            v
+---------------------------+
|  Tela 1: Login Empresa    |
+---------------------------+
```

---

## Etapa 1: Base de Dados

### Nova tabela: `companies`

Actualmente o sistema usa `company_id` nos perfis mas nao existe tabela de empresas. Sera criada:

- `id` (uuid, PK)
- `name` (text) - Nome da empresa
- `email` (text, unique) - Email de login da empresa
- `phone` (text, nullable)
- `address` (text, nullable)
- `is_active` (boolean, default true)
- `created_at`, `updated_at`

### Adicionar coluna `pin` aos perfis

Para a autenticacao de segundo nivel (operador), cada utilizador tera um PIN/senha curta:

- `profiles.pin` (text, nullable) - PIN ou senha do operador

### Politicas RLS para `companies`

- SELECT: qualquer utilizador autenticado cuja `company_id` corresponda
- INSERT/UPDATE/DELETE: apenas admins

---

## Etapa 2: Paginas de Autenticacao

### 2.1 Pagina de Login da Empresa (`/auth/company`)

- Formulario com email e password da empresa
- Usa `supabase.auth.signInWithPassword()` com as credenciais da conta Supabase Auth associada a empresa
- Apos login bem-sucedido, guarda o `company_id` e a sessao no `localStorage`
- Redireciona para a tela de seleccao de utilizador

### 2.2 Pagina de Seleccao de Utilizador (`/auth/user-select`)

- Lista todos os perfis activos da empresa (com avatar, nome e cargo)
- Ao clicar num perfil, pede o PIN/senha do operador
- Valida o PIN e define o utilizador activo no contexto da app
- Guarda o `active_user_id` no estado da aplicacao (React Context)

### 2.3 Botao "Trocar Utilizador"

- Disponivel no sidebar/header
- Volta para a tela de seleccao de utilizador
- **Nao** encerra a sessao da empresa

### 2.4 Botao "Fechar Empresa"

- Visivel apenas para utilizadores com role `admin`
- Faz logout completo (`supabase.auth.signOut()`)
- Limpa o `localStorage` (sessao da empresa)
- Redireciona para login da empresa

---

## Etapa 3: Contexto de Autenticacao

### AuthProvider (`src/contexts/AuthContext.tsx`)

Novo contexto React que gere:

- `companySession`: sessao Supabase da empresa (persistida)
- `activeUser`: perfil do utilizador/operador activo
- `isCompanyAuthenticated`: boolean
- `isUserSelected`: boolean
- `switchUser()`: volta a tela de seleccao
- `closeCompany()`: logout total (so admin)
- `login()` / `selectUser()`

### ProtectedRoute (`src/components/ProtectedRoute.tsx`)

Componente que verifica:
1. Se ha sessao de empresa activa - se nao, redireciona para `/auth/company`
2. Se ha utilizador seleccionado - se nao, redireciona para `/auth/user-select`
3. Se ambos existem, renderiza a pagina

---

## Etapa 4: Integracao com Rotas

### Actualizacao do `App.tsx`

- Envolver toda a app com `AuthProvider`
- Rotas publicas: `/auth/company`, `/auth/user-select`
- Todas as outras rotas protegidas por `ProtectedRoute`
- Rota `/` redireciona conforme o estado de autenticacao

---

## Etapa 5: Actualizacao do Sidebar e Header

- Mostrar nome do utilizador activo e da empresa no sidebar
- Botao "Trocar Utilizador" no footer do sidebar
- Botao "Fechar Empresa" visivel apenas para admins
- Indicador visual do utilizador activo

---

## Detalhes Tecnicos

### Persistencia no Dispositivo

A sessao da empresa e gerida pelo Supabase Auth (`persistSession: true` ja configurado). O `company_id` e guardado em `localStorage` como backup. Ao reabrir a app:
1. Verifica se ha sessao Supabase activa
2. Se sim, vai directo para seleccao de utilizador
3. Se nao, mostra login da empresa

### Seguranca do PIN

O PIN dos operadores sera armazenado como hash na base de dados. A validacao sera feita via uma funcao `SECURITY DEFINER` no Postgres que compara o PIN fornecido com o hash armazenado, usando `crypt()` e `gen_salt()` da extensao `pgcrypto`.

### Ficheiros a Criar/Modificar

| Ficheiro | Accao |
|---|---|
| `src/contexts/AuthContext.tsx` | Criar - contexto de autenticacao |
| `src/components/ProtectedRoute.tsx` | Criar - proteccao de rotas |
| `src/pages/auth/CompanyLogin.tsx` | Criar - login da empresa |
| `src/pages/auth/UserSelect.tsx` | Criar - seleccao de utilizador |
| `src/App.tsx` | Modificar - adicionar rotas e AuthProvider |
| `src/components/AppSidebar.tsx` | Modificar - trocar utilizador / fechar empresa |
| Migracao SQL | Criar tabela `companies`, adicionar `pin` a `profiles` |

