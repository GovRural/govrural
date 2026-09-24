# ADR-001 — Multi-tenancy por `municipalityId` (schema compartilhado)

## Contexto

O GovRural atende múltiplos municípios. Cada município precisa de
isolamento completo de dados — um município nunca deve ver dados de outro.

## Alternativas consideradas

1. **Banco separado por município** — isolamento mais forte, mas
   inviável operacionalmente no MVP: uma migração de schema exigiria
   rodar contra N bancos, e o custo de infraestrutura cresce linearmente
   com o número de municípios (a maioria pequenos, baixo volume de dados).
2. **Schema separado por município (mesmo banco)** — meio-termo, mas
   Prisma não tem suporte de primeira classe para schema dinâmico por
   tenant sem tooling extra.
3. **Schema compartilhado com coluna `municipalityId`** — um banco, uma
   tabela por entidade, isolamento garantido no nível de aplicação
   (guard) e reforçado por índice/constraint no banco.

## Decisão

Schema compartilhado com `municipalityId` como coluna em todo model de
primeiro nível (ver `docs/architecture/DATABASE.md`). O isolamento é
garantido em duas camadas:

1. **Guard** (`TenantGuard`) resolve o `municipalityId` do usuário
   autenticado a partir do JWT/banco — nunca de um header ou body enviado
   pelo cliente (exceto SUPER_ADMIN, que não pertence a nenhum município e
   por isso usa o header `x-municipality-id`, validado contra o banco).
2. **Service** sempre filtra a query por esse `municipalityId` resolvido —
   nunca confia em filtro implícito de índice/constraint sozinho.

Models "filhos" de um recurso pai (`ProducerProperty`, `PropertyArea`,
`ServiceRequestHistory`, `ProgramBeneficiary`) não duplicam
`municipalityId` — o isolamento é validado checando que o pai pertence ao
tenant antes de tocar no filho.

## Consequências

- Toda migração de schema roda uma vez, contra um banco só — simples de
  operar e de dar suporte.
- Todo endpoint novo precisa lembrar de aplicar `TenantGuard` e usar
  `@TenantId()` — é responsabilidade de convenção de código, não é
  impossível esquecer. Mitigação: teste unitário de isolamento de tenant é
  obrigatório para todo service novo que opera dado tenant-scoped (ver
  `docs/qa/TEST_PLAN.md`, que já cobre isso para todos os módulos
  existentes).
- Um bug de isolamento nesse modelo é "silencioso" até ser explorado ou
  testado — por isso o padrão de erro é sempre 404 (nunca 403) para recurso
  de outro tenant, para não revelar via resposta que o recurso existe.
- Se o volume de um município específico crescer desproporcionalmente,
  index em `municipalityId` (já presente em todos os models relevantes)
  segura a query; sharding manual seria uma migração futura, não
  antecipada agora.
