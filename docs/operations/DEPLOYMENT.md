# Deploy e ambientes — GovRural

## Ambientes

Hoje o projeto opera com desenvolvimento local contra um banco Supabase
real (sem banco de desenvolvimento local via Docker — decisão tomada por
simplicidade de setup; Docker Compose existe no repositório mas não é o
caminho usado atualmente). Não há ainda staging/produção configurados
separadamente — ao chegar esse momento, seguir o princípio de nunca aplicar
mudança relevante direto em produção sem passar por um ambiente equivalente
primeiro.

## Banco (Supabase)

- Conectar via **Session Pooler**, não a conexão direta (IPv6-only, não
  funciona em ambientes IPv4-only) nem a Transaction Pooler (quebra
  prepared statements do Prisma).
- `DATABASE_URL` no formato
  `postgresql://postgres.<ref>:<senha>@<host>:5432/postgres`.
- Migrações: fluxo normal é `prisma migrate dev`. **Se isso pedir
  `prisma migrate reset`** (drift detectado, comum porque o Supabase já
  provisiona extensões como `pg_stat_statements`, `pgcrypto`,
  `supabase_vault`, `uuid-ossp` que não estão no histórico de migração do
  Prisma) — **não resetar um banco com dado real**. Em vez disso: gerar o
  SQL manualmente, aplicar com `prisma db execute --file <sql>`, e
  registrar com `prisma migrate resolve --applied <nome_da_migration>`.
- Windows: o processo da API precisa estar parado antes de rodar
  `prisma generate` (o binário do query engine trava o `.dll.node`
  enquanto o processo Node está de pé). Fluxo: achar o PID na porta 3001
  (`netstat -ano | grep :3001`), matar o processo, gerar, reiniciar.

## Variáveis de ambiente

Único `.env.example` versionado, na raiz do monorepo (cobre API e Web
juntos). Nunca commitar o `.env` real — cada app tem o seu, ignorado pelo
`.gitignore`.

```text
# Banco
POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB / POSTGRES_PORT
DATABASE_URL

# Redis / BullMQ
REDIS_PORT / REDIS_URL

# API
API_PORT (3001) / API_URL / NODE_ENV
CORS_ORIGIN            -- csv; sem essa var, libera só http://localhost:3000

# Auth
JWT_SECRET / JWT_EXPIRES_IN (1d)
JWT_REFRESH_SECRET / JWT_REFRESH_EXPIRES_IN (7d)   -- secret diferente do access

# Seed
SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD
                        -- cria o primeiro Super Admin se nenhum existir
                        -- (prisma/seed.ts, script prisma:seed)

# Web
NEXT_PUBLIC_API_URL / WEB_PORT (3000)

# Storage (reservado, sem código consumindo ainda)
STORAGE_PROVIDER / STORAGE_BUCKET / STORAGE_REGION
STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY / STORAGE_ENDPOINT

# WhatsApp (Fase 13, reservado, sem código ainda)
WHATSAPP_PROVIDER / WHATSAPP_TOKEN
```

## Rodando localmente

```bash
pnpm install
pnpm --filter @govrural/api dev   # porta 3001
pnpm --filter @govrural/web dev   # porta 3000
```

Seed do primeiro Super Admin roda automaticamente se
`SEED_SUPER_ADMIN_EMAIL`/`SEED_SUPER_ADMIN_PASSWORD` estiverem definidos no
`.env` e nenhum SUPER_ADMIN existir ainda no banco.

## Versões principais

Node `>= 20`, pnpm `12.5.1`. API: NestJS `12`, Prisma `6.19`, TypeScript
`6.0`, Vitest, oxlint. Web: Next.js `16.3.5`, React `19.2.8`, Tailwind `4`,
ESLint `9`.
