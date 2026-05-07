# Accounting HUB — Backend

Sistema de gestão para escritórios contábeis.

## Requisitos

- Node.js >= 18
- npm >= 9
- Docker e Docker Compose (para o banco de dados PostgreSQL)

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo de exemplo de variáveis de ambiente e ajuste os valores:

```bash
cp .env.example .env
```

Edite `.env` com suas configurações locais. O campo mais importante é a `DATABASE_URL`:

```env
DATABASE_URL=postgresql://<usuario>:<senha>@localhost:5432/accounting_hub
```

## Banco de dados

O projeto usa **PostgreSQL** via Docker. Para subir o banco:

```bash
docker compose up -d
```

Na primeira execução (ou após alterações no schema), rode a migration:

```bash
npx prisma migrate dev
```

Para visualizar os dados pelo navegador:

```bash
npx prisma studio
```

> Prisma Studio abre em `http://localhost:5555`

### Fluxo completo de setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite .env com suas credenciais

# 3. Subir o banco de dados
docker compose up -d

# 4. Aplicar as migrations
npx prisma migrate dev

# 5. Iniciar o servidor
npm run dev
```

## Scripts

| Comando              | Descrição                              |
|----------------------|----------------------------------------|
| `npm run dev`        | Inicia em modo desenvolvimento (hot reload) |
| `npm run build`      | Compila TypeScript para `dist/`        |
| `npm start`          | Inicia o servidor a partir de `dist/`  |
| `npm run lint`       | Verifica problemas de lint             |
| `npm run lint:fix`   | Corrige problemas de lint              |
| `npm run format`     | Formata o código com Prettier          |
| `npm test`           | Executa os testes                      |
| `npm run test:coverage` | Executa os testes com cobertura     |

## Estrutura de pastas

```
src/
  app.ts              # Configuração do Express
  server.ts           # Entrada do servidor HTTP
  config/
    env.ts            # Variáveis de ambiente tipadas
  modules/
    auth/             # Autenticação e sessão
    users/            # Usuários e perfis
    tenants/          # Escritórios contábeis
    companies/        # Empresas atendidas
    demand-types/     # Tipos de demanda por setor
    demands/          # Demandas por competência
    receipts/         # Recibos de honorários
    payments/         # Recebimentos e baixa
    audit/            # Logs de auditoria
  shared/
    errors/           # Classes de erro
    middlewares/      # Middlewares globais
    types/            # Tipos e interfaces comuns
    utils/            # Utilitários
```

## Rotas disponíveis

| Método | Rota            | Descrição               |
|--------|-----------------|-------------------------|
| GET    | /health         | Health check            |
| POST   | /auth/login     | Login                   |
| POST   | /auth/logout    | Logout                  |
| GET    | /users          | Listar usuários         |
| GET    | /companies      | Listar empresas         |
| GET    | /demand-types   | Listar tipos de demanda |
| GET    | /demands        | Listar demandas         |
| GET    | /receipts       | Listar recibos          |
| GET    | /payments       | Listar recebimentos     |
| GET    | /audit-logs     | Listar logs de auditoria|
