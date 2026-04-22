# API Integration Guide — Accounting HUB

Documentação de integração frontend para as features implementadas.

---

## Configuração base

```
Base URL: http://localhost:3000
Content-Type: application/json
```

### Autenticação

Rotas protegidas exigem o token JWT no header:

```
Authorization: Bearer <token>
```

O token é obtido no login e expira em **30 minutos**.

---

### Formato padrão de resposta

**Sucesso:**
```json
{
  "success": true,
  "data": { }
}
```

**Erro:**
```json
{
  "success": false,
  "error": {
    "code": "CODIGO_DO_ERRO",
    "message": "Descrição do erro"
  }
}
```

---

## Códigos de erro globais

| Código | Status HTTP | Descrição |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Campos inválidos ou ausentes |
| `UNAUTHORIZED` | 401 | Token ausente ou inválido |
| `INVALID_TOKEN` | 401 | Token expirado |
| `FORBIDDEN` | 403 | Sem permissão |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

---

## Feature 1 — Cadastro de usuário

### `POST /users`

Cria um novo usuário no sistema. Pode ser criado com ou sem senha.

> Usuário criado **sem senha** deve usar o fluxo de Primeiro Acesso para definir sua senha antes de fazer login.

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tenantId` | `string (UUID)` | Sim | ID do escritório |
| `name` | `string (2–100)` | Sim | Nome completo |
| `identifier` | `string (3–100)` | Sim | E-mail ou identificador de login |
| `password` | `string (min 8)` | Não | Senha. Omitir para convite sem senha |
| `role` | `"admin" \| "collaborator"` | Sim | Perfil de acesso |
| `sector` | `string` | Não | Setor do colaborador |

**Exemplo de request — com senha:**
```json
{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "João Silva",
  "identifier": "joao.silva@escritorio.com",
  "password": "senha1234",
  "role": "admin"
}
```

**Exemplo de request — convite sem senha (primeiro acesso):**
```json
{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Maria Souza",
  "identifier": "maria.souza@escritorio.com",
  "role": "collaborator",
  "sector": "fiscal"
}
```

**Resposta — 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João Silva",
    "identifier": "joao.silva@escritorio.com",
    "role": "admin",
    "sector": null,
    "isActive": true,
    "createdAt": "2026-04-21T14:00:00.000Z",
    "updatedAt": "2026-04-21T14:00:00.000Z"
  }
}
```

**Erros específicos:**

| Código | Status | Quando ocorre |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Campos inválidos (UUID inválido, senha curta, role incorreta) |
| `CONFLICT` | 409 | Identifier já cadastrado no escritório |

---

### `GET /users?tenantId=`

Lista os usuários ativos de um escritório.

> Rota ainda sem autenticação obrigatória. Será protegida quando as roles forem aplicadas.

**Query params:**

| Param | Tipo | Obrigatório |
|---|---|---|
| `tenantId` | `string (UUID)` | Sim |

**Resposta — 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "João Silva",
      "identifier": "joao.silva@escritorio.com",
      "role": "admin",
      "sector": null,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## Feature 2 — Login

### `POST /auth/login`

Autentica o usuário e retorna um token JWT.

**Body:**

| Campo | Tipo | Obrigatório |
|---|---|---|
| `identifier` | `string` | Sim |
| `password` | `string` | Sim |

**Exemplo de request:**
```json
{
  "identifier": "joao.silva@escritorio.com",
  "password": "senha1234"
}
```

**Resposta — 200 OK:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "30m",
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "role": "admin",
      "sector": null,
      "tenantId": "uuid"
    }
  }
}
```

**Erros específicos:**

| Código | Status | Quando ocorre | Mensagem ao usuário |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Campos ausentes | Exibir erros de campo |
| `FIRST_ACCESS_REQUIRED` | 401 | Usuário sem senha definida | Redirecionar para fluxo de primeiro acesso |
| `INVALID_CREDENTIALS` | 401 | Senha errada ou usuário inexistente | "Credenciais inválidas" (nunca detalhar qual) |
| `ACCESS_DENIED` | 403 | Usuário inativo | "Acesso negado" |
| `TOO_MANY_ATTEMPTS` | 429 | 5 tentativas falhas seguidas | "Muitas tentativas. Tente novamente mais tarde." |

> **Importante:** os erros `INVALID_CREDENTIALS` e `FIRST_ACCESS_REQUIRED` devem exibir mensagens genéricas no frontend. Nunca informe se o usuário existe ou não.

---

### `POST /auth/logout`

Encerra a sessão do usuário. Requer autenticação.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta — 200 OK:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Feature 3 — Recuperação de senha / Primeiro acesso

Fluxo unificado para dois cenários:

- **Recuperação:** usuário já tem senha mas esqueceu
- **Primeiro acesso:** usuário foi convidado pelo admin sem senha

O backend detecta automaticamente o cenário e o frontend adapta a mensagem com base no campo `isFirstAccess`.

### Fluxo completo

```
1. Usuário informa e-mail  →  POST /auth/forgot-password
2. Recebe link por e-mail  →  GET  /auth/reset-password/validate/:token
3. Define nova senha       →  POST /auth/reset-password
4. Redirecionar para login
```

---

### `POST /auth/forgot-password`

Solicita o envio do link de definição/redefinição de senha.

**Body:**

| Campo | Tipo | Obrigatório |
|---|---|---|
| `email` | `string` | Sim |

**Exemplo de request:**
```json
{
  "email": "joao.silva@escritorio.com"
}
```

**Resposta — 200 OK (sempre, independente do e-mail existir):**
```json
{
  "success": true,
  "message": "If your email is registered, you will receive a link shortly."
}
```

> **Importante:** a resposta é sempre a mesma, mesmo para e-mails não cadastrados. Nunca confirme nem negue a existência do e-mail.

---

### `GET /auth/reset-password/validate/:token`

Valida o token do link recebido por e-mail e informa se é primeiro acesso ou recuperação.

**Parâmetro de rota:**

| Param | Descrição |
|---|---|
| `token` | Token recebido no link do e-mail |

**Resposta — 200 OK:**
```json
{
  "success": true,
  "data": {
    "isFirstAccess": true
  }
}
```

**Lógica de UI com base em `isFirstAccess`:**

| Valor | Mensagem sugerida na tela |
|---|---|
| `true` | "Bem-vindo! Defina sua senha para o primeiro acesso." |
| `false` | "Redefina sua senha." |

**Erros específicos:**

| Código | Status | Quando ocorre |
|---|---|---|
| `INVALID_RESET_TOKEN` | 400 | Token inválido, expirado (24h) ou já utilizado |

> Ao receber este erro, redirecione o usuário para a tela de recuperação com a mensagem: "Este link é inválido ou já expirou. Solicite um novo."

---

### `POST /auth/reset-password`

Define ou redefine a senha usando o token do link.

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `token` | `string` | Sim | Token recebido no link |
| `newPassword` | `string (min 8)` | Sim | Nova senha |

**Exemplo de request:**
```json
{
  "token": "61873f4af5d3069ecace9e59...",
  "newPassword": "novaSenha123"
}
```

**Resposta — 200 OK:**
```json
{
  "success": true,
  "message": "Password updated successfully. Please log in."
}
```

**Após sucesso:** redirecionar o usuário para a tela de login.

**Erros específicos:**

| Código | Status | Quando ocorre |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Senha menor que 8 caracteres ou token ausente |
| `INVALID_RESET_TOKEN` | 400 | Token inválido, expirado ou já utilizado (uso único) |

---

## Regras de negócio relevantes para o frontend

| Regra | Impacto na UI |
|---|---|
| Token de reset expira em **24 horas** | Exibir prazo na tela de "verifique seu e-mail" |
| Token é de **uso único** | Após redefinir, qualquer nova tentativa com o mesmo link retorna 400 |
| Após **5 tentativas falhas** de login, conta bloqueada por **15 minutos** | Exibir countdown ou mensagem de espera |
| Usuário **inativo** não consegue logar | Mensagem genérica, sem detalhar o motivo |
| Usuário **sem senha** não consegue logar pelo fluxo normal | Detectar `FIRST_ACCESS_REQUIRED` e redirecionar |

---

## Health check

### `GET /health`

Verifica se o servidor está operacional.

**Resposta — 200 OK:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "app": "Accounting HUB",
    "environment": "development",
    "timestamp": "2026-04-21T14:00:00.000Z"
  }
}
```
