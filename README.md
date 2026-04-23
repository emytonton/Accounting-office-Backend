# Accounting HUB — Backend

Sistema de gestão para escritórios contábeis.

## Requisitos

- Node.js >= 18
- npm >= 9
- PostgreSQL (para execução completa; não necessário para iniciar o projeto)

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo de exemplo de variáveis de ambiente e ajuste os valores:

```bash
cp .env.example .env
```

Edite `.env` com suas configurações locais antes de iniciar.

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
