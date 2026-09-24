# CLAUDE.md — GovRural

Porta de entrada para trabalhar neste repositório. Leia isto antes de qualquer
tarefa não-trivial. Os detalhes completos de cada área ficam em `docs/`; este
arquivo é o resumo operacional.

## O que é o GovRural

Plataforma B2G/GovTech multi-tenant de gestão, atendimento e inteligência do
meio rural para prefeituras brasileiras. Cada município é um tenant isolado.
Produtores rurais acompanham suas solicitações e benefícios por um portal
próprio; secretarias, técnicos e operadores de máquina operam o dia a dia
pelo painel administrativo; o Super Admin GovRural administra a plataforma
(municípios e usuários), sem acessar dados operacionais de nenhum município.

Visão de produto e personas completas: `docs/product/PRODUCT.md`,
`docs/product/PERSONAS.md`. Roadmap de fases: `docs/product/ROADMAP.md`.

## Stack e estrutura

Monorepo pnpm workspaces:

```text
apps/api   NestJS 12 (ESM), Prisma 6.19 + PostgreSQL/PostGIS (Supabase),
           Vitest para testes, oxlint para lint
apps/web   Next.js 16 (App Router) + React 19, TanStack Query, Zustand,
           Tailwind v4, shadcn/ui sobre @base-ui/react, MapLibre GL
```

Detalhes de arquitetura, módulos e convenções: `docs/architecture/ARCHITECTURE.md`.
Schema de dados completo: `docs/architecture/DATABASE.md`.
Convenções de API e rotas: `docs/architecture/API.md`.
Decisões arquiteturais registradas: `docs/architecture/ADR/`.

## Regra de ouro: multi-tenancy e segurança

Isso é o requisito não-negociável do produto — leia `docs/security/SECURITY.md`
antes de tocar em qualquer endpoint ou query.

- O `municipalityId` de um usuário autenticado **nunca** vem de um header ou
  campo do body enviado pelo cliente — vem do JWT/banco (`TenantGuard`).
  Exceção única: SUPER_ADMIN, que não pertence a nenhum município e por isso
  informa o município via header `x-municipality-id` (validado como UUID e
  contra o banco antes de ser aceito).
- Toda rota que opera dentro de um município usa `@UseGuards(TenantGuard)` e
  lê o tenant via `@TenantId()`, nunca via `req.body.municipalityId`.
- Um recurso de outro município deve responder **404**, nunca 403 — não
  confirmar a existência do recurso para quem não tem acesso a ele.
- Autorização por perfil é sempre revalidada no backend (`@Roles()` +
  `RolesGuard`); o frontend (`lib/roles.ts`) só esconde ações na UI, nunca é
  a fonte de verdade.

## Como trabalhar aqui

Não é necessário simular formalmente cada "especialista" da metodologia do
projeto para toda mudança — isso seria desperdício de esforço em tarefas
pequenas. O que importa é **a sequência de perguntas**, proporcional ao
tamanho da tarefa:

1. **Entender**: quem usa isso, que problema resolve, o que já existe
   parecido (não duplicar tela/componente/endpoint).
2. **Domínio e regra de negócio**: como o processo funciona na prefeitura/
   no campo hoje; qual estado e transição isso implica.
3. **Impacto**: isso toca em schema, RBAC, tenant isolation ou design system
   existente? Se sim, pare e avalie antes de codar.
4. **Implementar**: seguindo os padrões já estabelecidos (ver seções abaixo).
5. **Verificar**: `tsc --noEmit` e lint em ambos os apps antes de considerar
   pronto; para mudanças de schema, checar migração aplicada e testes de
   isolamento de tenant existentes ainda passam; para mudança de UI, tirar
   um screenshot real (`packages/devtools/screenshot.mjs` — ver README do
   pacote) em vez de só inferir a aparência pela classe Tailwind. Um bug
   real de autenticação (`docs/architecture/ADR/ADR-004-auth-store-hydration.md`)
   só apareceu porque essa ferramenta força um reload de página; leitura de
   código sozinha não teria pego.

Para uma mudança de uma linha ("corrija o texto deste botão"), só os passos
1 e 4 importam. Para um módulo novo, os cinco importam — e vale abrir um ADR
em `docs/architecture/ADR/` se a decisão for estrutural.

Ordem de prioridade quando há conflito entre soluções: **segurança e
integridade dos dados > regra de negócio > arquitetura > UX > performance >
estética > conveniência de implementação.**

## Padrões já estabelecidos (não reinvente)

- **CRUD administrativo**: lista com busca/filtro + botão de ação no
  cabeçalho que abre um modal (criar, ver, editar) — nunca uma página
  `/[id]` dedicada nem um formulário sempre visível na própria lista.
  Clicar na linha da tabela abre o modal de detalhe. Ver qualquer
  `new-*-dialog.tsx` ou `*-detail-dialog.tsx` em `apps/web/src/components/`
  como referência antes de criar um novo.
- **Design visual**: nunca hardcode cores (`zinc-500`, `bg-black`) — sempre
  os tokens semânticos do Tailwind (`bg-card`, `text-muted-foreground`,
  `border-border`...). Ver `docs/ux/DESIGN_SYSTEM.md`. Um indicador de
  status nunca é só cor — sempre cor + label (badge) ou ícone + label.
- **Multi-tenant no frontend**: use `useTenantId()` (não leia
  `user.municipalityId` direto) — ele já resolve o caso SUPER_ADMIN.
- **Formulários com estado inicial de dados existentes**: nunca populate via
  `useEffect` + `setState` (dispara lint error e re-render em cascata) — use
  `useState(() => initial ?? default)` num componente que só monta quando os
  dados já existem (ver padrão em `producer-form.tsx`, `*-detail-dialog.tsx`).
- **Nunca** commitar `.env` real; `.env.example` na raiz do monorepo é o
  único arquivo de env versionado, e é sempre placeholder.
- Mudança de schema Prisma sem Docker disponível: gerar o SQL da migração
  manualmente, aplicar com `prisma db execute`, e registrar com
  `prisma migrate resolve --applied <nome>` — nunca `prisma migrate reset`
  num banco com dados reais sem consentimento explícito do usuário (o
  próprio Prisma exige `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` para
  isso).

## Mapa da documentação

```text
docs/
├── product/
│   ├── PRODUCT.md        visão, problema, MVP, o que fica fora de escopo
│   ├── PERSONAS.md        Prefeito, Secretário, Técnico, Operador, Produtor
│   └── ROADMAP.md         14 fases do MVP e status de cada uma
├── architecture/
│   ├── ARCHITECTURE.md    stack, módulos do backend, estrutura do frontend
│   ├── DATABASE.md        schema Prisma completo, padrão de tenant isolation
│   ├── API.md             convenções REST, auth flow, rotas por módulo
│   └── ADR/               decisões arquiteturais registradas
├── ux/
│   ├── UX_GUIDELINES.md   princípios anti-"IA genérica", regras de conteúdo
│   ├── DESIGN_SYSTEM.md   tokens OKLCH, componentes, padrões de tela
│   └── FLOWS.md           fluxos principais (solicitação, ocorrência...)
├── security/
│   ├── SECURITY.md        RBAC, tenant isolation, auth, secrets
│   └── THREAT_MODEL.md    ameaças consideradas e mitigação
├── qa/
│   ├── QA.md              estratégia de teste, o que já é coberto
│   └── TEST_PLAN.md       testes existentes por módulo
├── domain/
│   └── RURAL_DOMAIN.md    conceitos do domínio rural/municipal
└── operations/
    ├── DEPLOYMENT.md      ambientes, variáveis de ambiente, Supabase
    ├── MONITORING.md      health checks, auditoria, logs
    └── BACKUP.md          estratégia de backup e recuperação
```

## Comandos úteis

```bash
pnpm --filter @govrural/api dev      # API em modo watch (porta 3001)
pnpm --filter @govrural/web dev      # Web em modo watch (porta 3000)
pnpm --filter @govrural/api test     # testes unitários (Vitest)
pnpm --filter @govrural/api test:e2e # testes e2e (banco real)
pnpm --filter @govrural/api lint     # oxlint
pnpm --filter @govrural/web lint     # eslint
```

No Windows, o processo da API precisa ser encerrado antes de rodar
`prisma generate` (o binário do query engine trava o `.dll` enquanto o
processo está de pé).
