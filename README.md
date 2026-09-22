# GovRural

Plataforma de Gestao, Atendimento e Inteligencia do Meio Rural para Municipios.

SaaS multi-tenant / white-label para prefeituras e secretarias municipais.

## Status

- **Fase 01 concluida:** infraestrutura e arquitetura base do monorepo.
- **Fase 02 concluida:** banco + multi-tenancy. Modelos `Municipality`,
  `MunicipalitySettings`, `Department` e `AuditLog`.
- **Fase 03 concluida:** auth + RBAC. Modelos `User` e `RefreshToken`; login
  com JWT (access + refresh com rotacao e revogacao), guard global de
  autenticacao (`JwtAuthGuard` + `@Public()`) e de perfil (`RolesGuard` +
  `@Roles()`). `TenantGuard` agora resolve o tenant a partir do JWT (nao mais
  de header) para qualquer perfil que nao seja `SUPER_ADMIN`.
- **Fase 04 concluida:** produtores. Modelo `Producer` (cadastro do produtor
  rural, ver secao 11), com paginacao/filtro/busca em `/producers`.
- **Fase 05 concluida:** propriedades. Modelos `RuralProperty` (secao 12),
  `ProducerProperty` (vinculo produtor<->propriedade com historico, secao 13)
  e `PropertyArea` (talhoes, secao 14).
- **Fase 06 concluida:** solicitacoes de servico. Modelos `ServiceType`,
  `ServiceRequest` (protocolo `GR-{ano}-{sequencial}` por municipio) e
  `ServiceRequestHistory` (secoes 17-20).
- **Fase 07 concluida:** ocorrencias rurais. Modelo `RuralOccurrence`
  (secoes 26-27). Estradas/pontes (secoes 28-29) ficam para uma fase pos-MVP
  (roadmap macro, secao 63).
- **Fase 08 concluida:** patrulha mecanizada. Modelos `Machine` e
  `MachineService` (secoes 21-23), com calculo automatico de custo
  (`hourlyCost x totalHours`) e sincronizacao do horimetro da maquina.
- **Frontend (parcial):** `/login` e `/dashboard` funcionais no `apps/web`,
  conectados a API real (ver secao Frontend abaixo). Demais telas
  administrativas ficam para as Fases 11-12 do roadmap (Dashboards/Portal).

Ainda faltam programas, GIS e os demais modulos de dominio, conforme o
roadmap da especificacao.

## Estrutura

```text
govrural/
├── apps/
│   ├── api/     NestJS + Prisma (PostgreSQL/PostGIS)
│   └── web/     Next.js + Tailwind + shadcn/ui + React Query + Zustand
├── docker-compose.yml   Postgres (PostGIS) + Redis
├── .env.example
└── pnpm-workspace.yaml
```

## Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand
- **Backend:** NestJS, TypeScript, REST API, Prisma
- **Banco:** PostgreSQL + PostGIS
- **Infra:** Docker, Redis (fila via BullMQ nas proximas fases)

## Requisitos

- Node.js >= 20
- pnpm (`npm install -g pnpm`)
- Um Postgres com PostGIS habilitado. Duas opcoes:
  - **Docker Desktop** (`docker-compose.yml` na raiz) — Postgres/PostGIS + Redis locais.
  - **Supabase** (ou outro Postgres gerenciado) — so o Postgres e necessario;
    Redis so afeta a sub-checagem `redis` do `/health`, nenhuma feature real
    depende dele ainda (BullMQ e de fases futuras). No Supabase, habilite a
    extensao `postgis` em Database → Extensions, e use a connection string de
    **conexao direta ou "Session pooler"** (nao o "Transaction pooler" — o
    modo transaction do PgBouncer conflita com os prepared statements do
    Prisma). A conexao direta (`db.[ref].supabase.co`) e IPv6-only por
    padrao; se sua rede nao rotear IPv6, use o Session pooler
    (`aws-0-[regiao].pooler.supabase.com:5432`, usuario `postgres.[ref]`).

## Setup local

```bash
# instalar dependencias do monorepo
pnpm install

# copiar variaveis de ambiente
cp .env.example .env
cp .env.example apps/api/.env

# subir Postgres (PostGIS) + Redis
pnpm docker:up

# gerar client do Prisma e aplicar migrations
pnpm --filter @govrural/api exec prisma generate
pnpm --filter @govrural/api exec prisma migrate deploy

# criar o primeiro Super Admin (usa SEED_SUPER_ADMIN_EMAIL/PASSWORD do .env)
pnpm --filter @govrural/api exec prisma db seed

# rodar API (http://localhost:3001)
pnpm dev:api

# rodar Web (http://localhost:3000)
pnpm dev:web
```

## Health check

```http
GET /health
```

Verifica conectividade com o banco (Prisma) e com o Redis. Ver
`apps/api/src/common/health`.

## Endpoints

```http
POST   /auth/login                  (publico)
POST   /auth/refresh                (publico)
POST   /auth/logout                 (publico - so precisa do refresh token)

GET    /users                       (SUPER_ADMIN: todos: demais: so do proprio municipio)
POST   /users                       (SUPER_ADMIN, MUNICIPAL_ADMIN)
GET    /users/:id
PATCH  /users/:id                   (SUPER_ADMIN, MUNICIPAL_ADMIN)
PATCH  /users/me/password           (qualquer usuario autenticado, propria senha)
DELETE /users/:id                   (SUPER_ADMIN, MUNICIPAL_ADMIN; soft delete)

POST   /municipalities              (SUPER_ADMIN)
GET    /municipalities              (SUPER_ADMIN)
GET    /municipalities/:id          (SUPER_ADMIN)
PATCH  /municipalities/:id          (SUPER_ADMIN)
DELETE /municipalities/:id          (SUPER_ADMIN; soft delete)
GET    /municipalities/:id/settings (SUPER_ADMIN)
PATCH  /municipalities/:id/settings (SUPER_ADMIN)

GET    /departments                 (qualquer perfil autenticado do municipio)
GET    /departments/:id
POST   /departments                 (SUPER_ADMIN, MUNICIPAL_ADMIN)
PATCH  /departments/:id             (SUPER_ADMIN, MUNICIPAL_ADMIN)
DELETE /departments/:id             (SUPER_ADMIN, MUNICIPAL_ADMIN; soft delete)

GET    /producers                   (qualquer perfil autenticado do municipio; ?page&limit&search&status)
GET    /producers/:id
POST   /producers                   (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN)
PATCH  /producers/:id               (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN)
DELETE /producers/:id               (SUPER_ADMIN, MUNICIPAL_ADMIN; soft delete)

GET    /properties                          (qualquer perfil autenticado do municipio; ?page&limit&search&status)
GET    /properties/:id                      (inclui vinculos de produtor ativos)
POST   /properties                          (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN)
PATCH  /properties/:id                      (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN)
DELETE /properties/:id                      (SUPER_ADMIN, MUNICIPAL_ADMIN; soft delete)
GET    /properties/:id/producers            (vinculos ativos)
POST   /properties/:id/producers            (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN; vincula produtor do MESMO municipio)
DELETE /properties/:id/producers/:linkId    (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN; encerra vinculo, mantem historico)

GET    /properties/:propertyId/areas        (talhoes da propriedade)
GET    /properties/:propertyId/areas/:id
POST   /properties/:propertyId/areas        (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN)
PATCH  /properties/:propertyId/areas/:id    (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN)
DELETE /properties/:propertyId/areas/:id    (SUPER_ADMIN, MUNICIPAL_ADMIN, TECHNICIAN; soft delete)

GET    /service-types                       (qualquer perfil autenticado do municipio)
GET    /service-types/:id
POST   /service-types                        (SUPER_ADMIN, MUNICIPAL_ADMIN)
PATCH  /service-types/:id                    (SUPER_ADMIN, MUNICIPAL_ADMIN)
DELETE /service-types/:id                    (SUPER_ADMIN, MUNICIPAL_ADMIN; soft delete)

GET    /service-requests                     (qualquer perfil autenticado do municipio; ?page&limit&search&status&priority&producerId)
GET    /service-requests/:id
GET    /service-requests/:id/history         (historico completo de status, nunca apagado)
POST   /service-requests                     (SUPER_ADMIN, MUNICIPAL_ADMIN, SECRETARY, TECHNICIAN; gera protocolo automaticamente)
PATCH  /service-requests/:id                 (SUPER_ADMIN, MUNICIPAL_ADMIN, SECRETARY, TECHNICIAN; bloqueado se status final)
PATCH  /service-requests/:id/status          (SUPER_ADMIN, MUNICIPAL_ADMIN, SECRETARY, TECHNICIAN; grava historico a cada mudanca)

GET    /occurrences                          (qualquer perfil autenticado do municipio; ?page&limit&search&type&priority&status)
GET    /occurrences/:id
POST   /occurrences                          (qualquer perfil interno, incl. MACHINE_OPERATOR; qualquer servidor pode reportar)
PATCH  /occurrences/:id                      (SUPER_ADMIN, MUNICIPAL_ADMIN, SECRETARY, TECHNICIAN; RESOLVED preenche resolvedAt, reabrir limpa)

GET    /machines                             (qualquer perfil autenticado do municipio; ?page&limit&search&status)
GET    /machines/:id
POST   /machines                             (SUPER_ADMIN, MUNICIPAL_ADMIN)
PATCH  /machines/:id                         (SUPER_ADMIN, MUNICIPAL_ADMIN)
DELETE /machines/:id                         (SUPER_ADMIN, MUNICIPAL_ADMIN; soft delete)

GET    /machine-services                     (qualquer perfil autenticado do municipio; ?page&limit&status&machineId&operatorId)
GET    /machine-services/:id
POST   /machine-services                     (SUPER_ADMIN, MUNICIPAL_ADMIN, SECRETARY, TECHNICIAN; agenda o servico)
PATCH  /machine-services/:id                 (SUPER_ADMIN, MUNICIPAL_ADMIN, SECRETARY, TECHNICIAN; dados gerais, nao execucao)
PATCH  /machine-services/:id/execution       (+ MACHINE_OPERATOR; inicio/termino/horimetro/combustivel — calcula custo automaticamente)
```

Todas as rotas exigem `Authorization: Bearer <accessToken>`, exceto as
marcadas como publicas. Para rotas de tenant (`/departments`), o
`municipality_id` vem do JWT do usuario; um `SUPER_ADMIN` (que nao pertence a
nenhum municipio) precisa informar qual municipio via header
`x-municipality-id`.

Nao existe ainda um endpoint publico de branding para a tela de login (antes
do usuario se autenticar) — isso fica para quando o frontend de login/
white-label for implementado.

`RuralProperty` guarda apenas um ponto de referencia (`latitude`/`longitude`)
por enquanto — o poligono completo da propriedade (`geometry`, PostGIS) fica
para a Fase GIS dedicada. `propertyType` (secao 12) e texto livre, ja que a
especificacao nao lista valores fixos para esse campo (diferente de
`ownershipType`, que tem enum com os valores listados na secao 12).

`ServiceRequest.status` nunca e alterado por um PATCH generico — sempre via
`PATCH /service-requests/:id/status`, que grava `ServiceRequestHistory` e
bloqueia qualquer alteracao (incluindo os dados gerais em `PATCH
/service-requests/:id`) quando o status ja e final (`COMPLETED`, `REJECTED`
ou `CANCELLED`). Nao ha `DELETE` de solicitacao — cancelamento e feito via
status `CANCELLED`, mantendo o historico intacto (secao 20: "nunca apagar
historico").

## Frontend

`apps/web` tem hoje `/login` (formulario de e-mail/senha, chama
`POST /auth/login` direto) e `/dashboard` (mostra e-mail/perfil/municipio do
usuario logado, decodificados do JWT no client apenas para exibicao — a
validacao real e sempre no backend). Tokens ficam em `localStorage` via
Zustand (`src/stores/auth-store.ts`) com persistencia. Isso e aceitavel para
testes locais, mas nao e o ideal de seguranca para producao (`localStorage`
fica exposto a XSS); mover para cookies `httpOnly` fica para uma fase de
hardening. Nao ha ainda renovacao automatica via refresh token — o access
token expirado exige novo login. As demais telas administrativas (CRUD de
municipios/produtores/propriedades/etc.) nao existem ainda — so a API REST.

## Auth

- Senhas: hash com `bcryptjs` (12 rounds).
- Access token: JWT curto (`JWT_EXPIRES_IN`, padrao 1 dia).
- Refresh token: JWT (`JWT_REFRESH_EXPIRES_IN`, padrao 7 dias) persistido no
  banco como hash SHA-256 (`refresh_tokens`), com rotacao a cada uso e
  revogacao real no logout — o refresh token em si nunca fica no banco em
  claro.
- Perfis (`UserRole`, ver secao 8 da especificacao): `SUPER_ADMIN` (nao
  pertence a municipio), `MUNICIPAL_ADMIN`, `SECRETARY`, `TECHNICIAN`,
  `MACHINE_OPERATOR`, `PRODUCER` (portal do produtor). O `User` com role
  `PRODUCER` ainda nao esta vinculado a um registro de `Producer` — esse
  vinculo (login do proprio produtor) fica para o Portal do Produtor.

## Convencoes

- Nunca commitar `.env` (apenas `.env.example`).
- Toda alteracao de schema do banco deve ter migration do Prisma
  (`apps/api/prisma/migrations/`).
- Isolamento de tenant (`municipality_id`) e obrigatorio em toda entidade de
  dominio, a partir da Fase 02 — toda query de leitura/escrita de um recurso
  de tenant deve filtrar por `municipalityId` na propria clausula `where`,
  nunca apenas validar depois de buscar por `id`.
- Registros de tenant (`Municipality`, `Department`, futuras entidades de
  dominio) usam soft delete (`deletedAt`), nunca DELETE fisico.
