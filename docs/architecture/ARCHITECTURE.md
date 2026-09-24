# Arquitetura — GovRural

## Monorepo

```text
govrural/
├── apps/
│   ├── api/     NestJS 12 (ESM), porta 3001
│   └── web/     Next.js 16 App Router, porta 3000
├── docs/
├── .env.example  único arquivo de env versionado (raiz), cobre API + Web
└── pnpm-workspace.yaml
```

Gerenciado por pnpm workspaces (`pnpm@12.5.1`, `engines.node >= 20`).
Scripts na raiz orquestram via `pnpm --filter`/`pnpm -r`.

## Backend (`apps/api`)

NestJS 12, `"type": "module"` (ESM). Prisma 6.19 como ORM contra
PostgreSQL + extensão PostGIS habilitada (via Supabase). Testes com
**Vitest** (não Jest) — `vitest.config.ts` para unitários,
`vitest.config.e2e.ts` para e2e contra banco real. Lint com **oxlint**
(não ESLint).

### Módulos (`apps/api/src/*`)

Um módulo por domínio, cada um com `*.controller.ts`, `*.service.ts`,
`*.module.ts` e `dto/`:

```text
auth                  login, refresh, logout — rotas @Public()
users                 gestão de usuários + auto-serviço (/users/me/*)
municipalities        gestão de tenants (só SUPER_ADMIN, sem TenantGuard)
departments           secretarias municipais
producers             cadastro de produtor rural
properties            propriedades rurais + vínculo produtor↔propriedade
property-areas        talhões (nested em /properties/:id/areas)
service-types         catálogo de tipos de serviço solicitável
service-requests       solicitações de serviço + histórico + protocolo
occurrences           ocorrências rurais
machines              patrulha mecanizada — cadastro de máquinas
machine-services      agendamento e execução de serviço de máquina
programs              programas municipais
program-beneficiaries beneficiários (nested em /programs/:id/beneficiaries)
gis                   endpoint de mapa (camadas georreferenciadas)
dashboards            indicadores agregados
portal                API exclusiva do produtor (role PRODUCER)
common/audit          AuditService — log imutável, sem delete exposto
common/prisma         PrismaService (ciclo de vida da conexão)
common/tenant         TenantGuard + decorator @TenantId()
common/health         /health (Terminus: Postgres + Redis)
```

Guards globais (`APP_GUARD` em `app.module.ts`, nesta ordem — a ordem
importa):

1. `ThrottlerGuard` — rate limit 100 req/60s, roda até em rotas públicas.
2. `JwtAuthGuard` — popula `request.user`; libera se `@Public()`.
3. `RolesGuard` — avalia `@Roles()`; libera se não houver decorator.

`TenantGuard` **não é global** — aplicado por controller com
`@UseGuards(TenantGuard)`. Detalhe completo da cadeia de segurança em
`docs/security/SECURITY.md`.

### Bootstrap (`apps/api/src/main.ts`)

```ts
app.use(helmet());
app.use(json({ limit: '2mb' }));  // default do Express é 100kb — avatar em
                                   // base64 (PATCH /users/me) exige mais
app.enableCors({ origin: corsOrigins });  // CORS_ORIGIN, csv; default
                                           // localhost:3000 se ausente
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, transform: true, forbidNonWhitelisted: true,
}));
```

## Frontend (`apps/web`)

Next.js 16 App Router, React 19. Data-fetching com TanStack Query, estado de
sessão/tenant com Zustand (`persist` em localStorage). Design system em
`components/ui/*` (shadcn, sobre `@base-ui/react` — **não** Radix; não tem
prop `asChild`, usar `buttonVariants()` + `<Link>` para links estilizados
como botão). Mapa com MapLibre GL. Ícones com lucide-react.

### Estrutura de rotas

```text
app/
├── login/               tela de login (split-screen, ver DESIGN_SYSTEM.md)
├── portal/              área do produtor (role PRODUCER)
│   ├── propriedades/
│   └── solicitacoes/
└── dashboard/           área administrativa (todos os outros roles)
    ├── indicadores/
    ├── mapa/
    ├── produtores/  propriedades/  secretarias/  tipos-servico/
    ├── solicitacoes/  ocorrencias/
    ├── maquinas/  servicos-maquina/
    ├── programas/
    └── usuarios/  municipios/   (só SUPER_ADMIN/MUNICIPAL_ADMIN)
```

Nenhuma dessas rotas de domínio tem mais uma subrota `/novo` ou `/[id]` —
criação e detalhe/edição são sempre modais abertos a partir da listagem (ver
`docs/ux/DESIGN_SYSTEM.md`, seção "Padrão de CRUD").

### `lib/` (um arquivo de tipos por domínio + utilitários)

`api-client.ts` (`apiFetch`, injeta `Authorization` e `x-municipality-id`
automaticamente; `ApiError`), `roles.ts` (`canManage`, `canAdminister`,
`hasAnyRole` — espelha o RBAC do backend só para esconder ações na UI),
`clean-payload.ts` (remove campos vazios antes de enviar, já que DTOs com
`@IsEmail`/`@IsUUID` rejeitam string vazia em campo opcional),
`image-resize.ts` (redimensiona avatar no client antes do upload),
`jwt.ts` (decodifica payload só para exibição — nunca para validação),
mais um `*-types.ts` por entidade de domínio.

### `stores/` (Zustand + persist)

`auth-store.ts` (`accessToken`, `refreshToken`, `user` decodificado do JWT),
`tenant-store.ts` (`selectedMunicipalityId`, só relevante para SUPER_ADMIN).
Combinados pelo hook `hooks/use-tenant-id.ts` — sempre usar esse hook em vez
de ler `user.municipalityId` direto.

## Decisões arquiteturais registradas

Ver `docs/architecture/ADR/`. Toda decisão estrutural nova (schema, módulo,
padrão de navegação, escolha de biblioteca) que muda o que está descrito
aqui deve gerar um ADR novo.
