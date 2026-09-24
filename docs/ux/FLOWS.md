# Fluxos principais — GovRural

## Solicitação de serviço

```text
Produtor solicita (portal ou técnico registra em nome dele)
        ↓
RECEIVED — protocolo gerado (GR-{ano}-{sequencial})
        ↓
UNDER_ANALYSIS — secretaria analisa
        ↓
APPROVED  ──ou──  REJECTED (final)
        ↓
SCHEDULED — agendamento (pode gerar um MachineService vinculado)
        ↓
IN_PROGRESS
        ↓
COMPLETED (final)  ──ou──  CANCELLED (final) em qualquer ponto anterior
```

Estado adicional `WAITING_DOCUMENT` pode ocorrer a partir de qualquer status
não-final, quando falta algo do produtor. Toda transição gera uma entrada
imutável em `ServiceRequestHistory` (quem mudou, de onde para onde, quando,
comentário opcional). Uma solicitação em status final não aceita nova
transição — ver `docs/architecture/DATABASE.md`.

## Ocorrência rural

```text
Reportada (qualquer um dos REPORT_ROLES, incluindo MACHINE_OPERATOR
           que está no campo)
        ↓
OPEN
        ↓
IN_PROGRESS
        ↓
RESOLVED  (resolvedAt setado automaticamente)
        ↓
CLOSED
```

Reabrir uma ocorrência RESOLVED (voltar para OPEN/IN_PROGRESS) limpa
`resolvedAt` automaticamente — o service garante isso, não é responsabilidade
do frontend.

## Serviço de máquina (patrulha mecanizada)

```text
Agendado (SCHEDULE_ROLES) — machineId, producerId, serviceType,
                              opcionalmente vinculado a uma ServiceRequest
        ↓
SCHEDULED
        ↓
Operador registra início/fim, horímetro, combustível
(PATCH /machine-services/:id/execution — EXECUTE_ROLES, inclui
 MACHINE_OPERATOR)
        ↓
IN_PROGRESS (só início registrado) → COMPLETED (fim registrado)
        ↓
Custo calculado automaticamente: horímetro final − inicial × custo/hora
da máquina (ou a partir de início/fim quando não há horímetro); o
horímetro atual da máquina é atualizado ao concluir.
```

`CANCELLED` pode ocorrer a partir de `SCHEDULED`. Um serviço já `COMPLETED`
não pode ser executado de novo.

## Benefício de programa

```text
Produtor vinculado ao programa (PROGRAM_BENEFICIARY_MANAGE_ROLES)
        ↓
PENDING
        ↓
APPROVED   (approvalDate setado automaticamente, uma vez só —
            reaprovar não sobrescreve a data original)
        ↓
DELIVERED  (deliveryDate setado automaticamente, mesma regra de
            idempotência)
```

`REJECTED`/`CANCELLED` são estados finais alternativos. Sem `DELETE` —
um beneficiário nunca é removido, só muda de status.

## Onboarding de um município novo (fluxo administrativo)

```text
SUPER_ADMIN cria o Municipality (POST /municipalities)
        ↓
SUPER_ADMIN cria o primeiro MUNICIPAL_ADMIN
(modal "Criar administrador municipal" na ficha do município,
 defaultMunicipalityId já preenchido)
        ↓
MUNICIPAL_ADMIN loga e estrutura o município:
Secretarias → Tipos de Serviço → Máquinas → Programas
        ↓
MUNICIPAL_ADMIN/TECHNICIAN cadastra Produtores e Propriedades
        ↓
(opcional) MUNICIPAL_ADMIN cria o acesso de portal do produtor
(modal "Criar acesso ao portal" na ficha do produtor,
 vincula um User role=PRODUCER a um Producer já existente)
```

O produtor nunca se autocadastra — a ficha rural (`Producer`) é sempre
criada por um humano da prefeitura antes que exista qualquer conta de
portal para aquele produtor.
