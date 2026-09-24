# Plano de testes — GovRural

Inventário do que já está coberto (para não duplicar) e onde estender ao
tocar em cada módulo. Todos os testes de service usam Prisma mockado; os
e2e usam banco real.

## Testes unitários (`apps/api/src/**/*.service.spec.ts`)

| Arquivo | Cobre |
|---|---|
| `auth/guards/roles.guard.spec.ts` | libera sem `@Roles()`; libera com role válido; bloqueia role inválido; bloqueia sem usuário autenticado |
| `users/users.service.spec.ts` | MUNICIPAL_ADMIN não cria SUPER_ADMIN; MUNICIPAL_ADMIN sempre cria no próprio município mesmo se o body pedir outro; `findAll` filtra por município (exceto SUPER_ADMIN); nunca retorna `passwordHash` |
| `departments/departments.service.spec.ts` | isolamento de tenant: busca filtra por município; recurso de outro município → não encontrado (404); create grava o município do tenant atual |
| `producers/producers.service.spec.ts` | isolamento de tenant (create/findOne/findAll); busca por `search` normaliza CPF/CNPJ sem máscara |
| `properties/properties.service.spec.ts` | isolamento de tenant; `linkProducer` rejeita produtor de outro município; `linkProducer` cria vínculo quando ambos são do mesmo município |
| `property-areas/property-areas.service.spec.ts` | isolamento **via propriedade-pai** (sem `municipalityId` próprio); rejeita criar área sem validar a propriedade primeiro; `findOne` escopado por `propertyId` |
| `occurrences/occurrences.service.spec.ts` | isolamento; `resolvedAt` setado ao RESOLVED e limpo ao reabrir; não altera `resolvedAt` fora dessas transições; create grava município e `reporterUserId` corretos |
| `machine-services/machine-services.service.spec.ts` | rejeita máquina de outro município; cálculo de custo (horímetro e por tempo); `IN_PROGRESS` só com início registrado; não executa serviço já `COMPLETED`; atualiza horímetro da máquina ao concluir |
| `program-beneficiaries/program-beneficiaries.service.spec.ts` | rejeita produtor de outro município; `approvalDate`/`deliveryDate` automáticos e idempotentes (não sobrescreve) |
| `service-requests/service-requests.service.spec.ts` | geração de protocolo (`GR-{ano}-{8 dígitos}`); rejeita produtor de outro município; rejeita propriedade não vinculada ao produtor; não altera solicitação `COMPLETED`; histórico registra `previousStatus`/`newStatus` |

## Testes e2e (`apps/api/test/*.e2e-spec.ts`)

| Arquivo | Cobre |
|---|---|
| `app.e2e-spec.ts` | `GET /health` responde 200 com banco up (tolerante a Redis down) |
| `integration-flow.e2e-spec.ts` | fluxo completo produtor → propriedade → solicitação → máquina, com protocolo real e custo calculado; isolamento e2e (município B não vê produtores do município A) |

## Lacunas conhecidas (ao tocar nesses módulos, considerar adicionar teste)

- `municipalities.service` — sem spec unitário dedicado ainda (só cobertos
  indiretamente pelo e2e de isolamento).
- `machines.service`, `service-types.service`, `programs.service` — CRUD
  simples, sem spec dedicado (risco baixo, mas ausente).
- `gis.service`, `dashboards.service` — sem spec dedicado; são somente
  leitura, mas agregam dado sensível ao tenant, vale cobrir isolamento.
- `portal.service` — sem spec dedicado; é o único módulo que resolve tenant
  a partir de `user.producerId` em vez de `TenantId()` direto, merece teste
  específico de que um produtor não vê dado de outro produtor do mesmo
  município.
- Frontend — nenhuma suíte de teste automatizado ainda (ver `docs/qa/QA.md`).

## Ao adicionar um módulo novo tenant-scoped

Copiar o padrão de `departments.service.spec.ts` (o mais simples) como
esqueleto: isolamento no create, no findOne, no findAll. Se o módulo tiver
recurso aninhado (sem `municipalityId` próprio), copiar o padrão de
`property-areas.service.spec.ts` em vez disso (validação via pai).
