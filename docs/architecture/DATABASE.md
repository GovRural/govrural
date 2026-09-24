# Banco de dados — GovRural

PostgreSQL com extensão PostGIS habilitada no datasource
(`extensions = [postgis]`), acessado via Prisma 6.19. Hospedado no Supabase
(conexão via Session Pooler — a conexão direta é IPv6-only e a Transaction
Pooler quebra prepared statements do Prisma).

**Nota importante**: a extensão PostGIS está habilitada, mas nenhuma coluna
usa o tipo `geometry` ainda — todas as coordenadas hoje são pares
`Float? latitude/longitude` simples. É uma decisão deliberada (comentada no
próprio schema): o polígono completo de uma propriedade fica para uma fase
GIS dedicada, ainda não iniciada. Não assuma que existe geometria real ao
planejar uma feature de mapa.

## Isolamento multi-tenant no schema

Todo model "de primeiro nível" tem `municipalityId` como coluna própria:
`Department`, `User` (nullable — só SUPER_ADMIN é `null`), `Producer`,
`RuralProperty`, `ServiceType`, `ProtocolSequence`, `ServiceRequest`,
`RuralOccurrence`, `Machine`, `MachineService`, `Program`, `AuditLog`
(nullable).

Models "filhos" de um recurso pai **não têm** `municipalityId` próprio — o
isolamento é herdado, e o service precisa validar explicitamente que o pai
pertence ao tenant atual antes de tocar no filho (todos têm teste unitário
cobrindo exatamente isso, ver `docs/qa/TEST_PLAN.md`):

| Model filho | Herda de | Chave de vínculo |
|---|---|---|
| `ProducerProperty` | `Producer` **e** `RuralProperty` | `producerId` + `propertyId` |
| `PropertyArea` | `RuralProperty` | `propertyId` |
| `ServiceRequestHistory` | `ServiceRequest` | `serviceRequestId` |
| `ProgramBeneficiary` | `Program` | `programId` |

Ao criar uma feature nova aninhada num recurso existente, siga esse mesmo
padrão em vez de duplicar `municipalityId` na tabela nova.

## Soft-delete vs. status/histórico

`deletedAt` existe em: `Municipality`, `Department`, `User`, `Producer`,
`RuralProperty`, `PropertyArea`, `ServiceType`, `Machine`, `Program`.

**Não existe** em: `MunicipalitySettings`, `RefreshToken`, `AuditLog`,
`ProducerProperty`, `ProtocolSequence`, `ServiceRequest`,
`ServiceRequestHistory`, `RuralOccurrence`, `MachineService`,
`ProgramBeneficiary`. Nestes, o padrão é "nunca apagar, só mudar status" —
por exemplo, uma `ServiceRequest` cancelada continua existindo com
`status: CANCELLED`, nunca é removida. Ao adicionar delete a um desses
models, pare e considere se soft-delete/histórico não é o padrão certo em
vez de um `DELETE` real.

## Unique constraints compostas (tenant-scoped, não globais)

```text
Department       @@unique([municipalityId, name])
Producer          @@unique([municipalityId, cpfCnpj])
ServiceType       @@unique([municipalityId, name])
ServiceRequest    @@unique([municipalityId, protocol])
Program           @@unique([municipalityId, name])
ProtocolSequence  @@id([municipalityId, year])   -- PK composta
```

`User.email` e `RefreshToken.tokenHash` são **globais** (não compostos) —
um e-mail só pode existir em um município no sistema inteiro. Ao adicionar
uma constraint `unique` nova num model tenant-scoped, ela quase certamente
deve ser composta com `municipalityId`, não global — o bug corrigido na
Fase 14 foi exatamente isso (`ServiceRequest.protocol` era único
globalmente, causando colisão entre municípios).

## Models — resumo por domínio

**Plataforma**: `Municipality` (tenant raiz; `status`
ACTIVE/INACTIVE/SUSPENDED), `MunicipalitySettings` (white-label, 1:1),
`Department`, `AuditLog` (log imutável, sem método de delete exposto no
service).

**Identidade**: `User` (`role`: SUPER_ADMIN/MUNICIPAL_ADMIN/SECRETARY/
TECHNICIAN/MACHINE_OPERATOR/PRODUCER; `producerId` só preenchido para
PRODUCER, e mais de um `User` pode apontar para o mesmo `Producer`),
`RefreshToken` (token em claro nunca persistido — só o hash SHA-256, ver
`docs/security/SECURITY.md`).

**Cadastro rural**: `Producer` (ficha do produtor — CPF/CNPJ único por
município, não globalmente), `RuralProperty` (propriedade; um ponto
lat/lng, não polígono), `ProducerProperty` (vínculo N:N com histórico —
`startDate`/`endDate`, sem unique composta porque o mesmo par pode ter mais
de um vínculo ao longo do tempo), `PropertyArea` (talhão dentro de uma
propriedade).

**Atendimento**: `ServiceType` (catálogo configurável por município),
`ProtocolSequence` (contador atômico por município+ano — incremento via
upsert numa transação, o `UPDATE` trava a linha e serializa concorrência no
Postgres), `ServiceRequest` (protocolo `GR-{ano}-{sequencial 8 dígitos}`,
nunca deletada), `ServiceRequestHistory` (transições de status, imutável).

**Ocorrências**: `RuralOccurrence` (13 tipos: ROAD, BRIDGE, FIRE, WATER,
ENERGY, ILLEGAL_DUMPING, ANIMALS, MACHINERY, AGRICULTURE, HEALTH, SECURITY,
ENVIRONMENT, OTHER; `resolvedAt` é setado/limpo automaticamente pelo service
ao mudar o status para/de RESOLVED).

**Patrulha mecanizada**: `Machine` (`type`/`fuelType` são texto livre, sem
enum fechado), `MachineService` (**atenção**: `serviceType` aqui é string
livre, não FK para `ServiceType` — não confundir com
`ServiceRequest.serviceTypeId`, que é FK real; custo calculado
automaticamente — `custo_hora × horas` — na execução).

**Programas**: `Program` (`eligibilityRules` é texto livre, sem formato
estruturado), `ProgramBeneficiary` (sem `municipalityId` próprio — herda de
`Program`; `approvalDate`/`deliveryDate` setados automaticamente ao mudar
status, idempotente — não sobrescreve se já preenchido).

## Padrão de erro para vazamento de tenant

Confirmado pelos testes: buscar um recurso que existe mas pertence a outro
município retorna **404 (NotFound)**, nunca 403. Isso evita que a resposta
por si só confirme a existência do recurso para quem não deveria vê-lo.
Siga esse padrão em qualquer service novo.
