# API — GovRural

API REST, prefixo implícito na raiz (sem `/api` global). Todas as respostas
em JSON. Autenticação Bearer JWT, exceto rotas marcadas `@Public()`.

## Convenções

- **Tenant**: rotas que operam dentro de um município usam
  `@UseGuards(TenantGuard)` + `@TenantId()` no handler — nunca leem
  `municipalityId` do body para decidir o tenant do usuário autenticado (a
  única exceção é SUPER_ADMIN informando via header `x-municipality-id`,
  ver `docs/security/SECURITY.md`).
- **Paginação**: listagens paginadas devolvem
  `{ data: T[], total: number, page: number, limit: number }`
  (`PaginatedResponse<T>` no frontend). Nem toda listagem é paginada — ver
  módulo por módulo abaixo.
- **Erros**: `ValidationPipe` global (`whitelist`, `transform`,
  `forbidNonWhitelisted`) rejeita campo desconhecido no body. Recurso de
  outro tenant → 404, nunca 403 (ver `docs/architecture/DATABASE.md`).
- **Recursos aninhados**: `property-areas` vive em
  `/properties/:propertyId/areas`; `program-beneficiaries` vive em
  `/programs/:programId/beneficiaries`. Sem paginação (retornam array
  direto) — o volume esperado por propriedade/programa é pequeno.

## Auth (`/auth`, todas `@Public()`)

```text
POST /auth/login     { email, password } → { accessToken, refreshToken }
                      throttle: 5 tentativas / 60s (mais restrito que o
                      limite global de 100/60s)
POST /auth/refresh   { refreshToken } → novo par (rotação — o token usado
                      é revogado e não pode ser reaproveitado)
POST /auth/logout    { refreshToken } → 204, idempotente
```

## Users (`/users`)

Não usa `TenantGuard` — a resolução de tenant é feita manualmente dentro do
`UsersService`, recebendo o `currentUser` completo.

```text
POST   /users               @Roles(SUPER_ADMIN, MUNICIPAL_ADMIN)
GET    /users                sem @Roles (filtro por tenant dentro do service)
GET    /users/:id            idem
PATCH  /users/me             sem @Roles — auto-serviço (nome, telefone, avatarUrl)
PATCH  /users/me/password    sem @Roles — troca de senha (exige senha atual)
PATCH  /users/me/email       sem @Roles — troca de e-mail (exige senha atual)
PATCH  /users/:id            @Roles(SUPER_ADMIN, MUNICIPAL_ADMIN)
DELETE /users/:id            @Roles(SUPER_ADMIN, MUNICIPAL_ADMIN) — soft delete
```

SUPER_ADMIN cria usuário com `municipalityId` explícito no body;
MUNICIPAL_ADMIN sempre cria dentro do próprio município mesmo que o body
peça outro (validado por teste). `role: PRODUCER` exige `producerId` no
body, validado contra o mesmo município.

## Municipalities (`/municipalities`)

Toda a classe é `@Roles(SUPER_ADMIN)`. Sem `TenantGuard` — é o recurso de
gestão da plataforma, não de um tenant.

```text
POST   /municipalities
GET    /municipalities
GET    /municipalities/:id
PATCH  /municipalities/:id
DELETE /municipalities/:id            -- soft delete + status INACTIVE
GET    /municipalities/:id/settings   -- white-label
PATCH  /municipalities/:id/settings
```

## Módulos com `TenantGuard` — padrão comum

Todos abaixo seguem: `GET` sem restrição de role (qualquer autenticado do
tenant), mutações restritas por `@Roles()` conforme a tabela de permissões
em `docs/security/SECURITY.md`.

```text
departments          /departments
producers            /producers                  (MANAGE: +TECHNICIAN)
properties           /properties
                      /properties/:id/producers        (vincular produtor)
                      /properties/:id/producers/:linkId (desvincular)
property-areas        /properties/:propertyId/areas
service-types         /service-types
service-requests       /service-requests
                      /service-requests/:id/status  (mudar status)
                      /service-requests/:id/history  (histórico, GET)
occurrences           /occurrences                 (POST também para MACHINE_OPERATOR)
machines              /machines                    (MANAGE: só admins)
machine-services      /machine-services
                      /machine-services/:id/execution (registrar execução —
                       inclui MACHINE_OPERATOR, diferente de agendar)
programs              /programs                    (MANAGE: só admins)
program-beneficiaries /programs/:programId/beneficiaries
                      (sem DELETE — beneficiário nunca é removido, só muda status)
gis                   /gis/map?layers=...
                      /gis/properties/:id
dashboards            /dashboard/summary
                      /dashboard/service-requests
                      /dashboard/machines
                      /dashboard/programs
                      /dashboard/occurrences
```

## Portal (`/portal`)

Toda a classe é `@Roles(PRODUCER)` — só o próprio produtor acessa, e o
service resolve os dados a partir de `user.producerId` (via
`@CurrentUser()`, não `@TenantId()` direto).

```text
GET  /portal/me
GET  /portal/properties
GET  /portal/service-requests
POST /portal/service-requests
GET  /portal/programs
```

## Health (`/health`, `@Public()`)

`GET /health` — Terminus com dois indicadores: Postgres (`PrismaService`)
e Redis (`REDIS_URL`). Tolerante a Redis indisponível na checagem do
frontend (ver `docs/operations/MONITORING.md`).
