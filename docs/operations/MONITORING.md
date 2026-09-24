# Monitoramento e observabilidade — GovRural

Estado atual: básico, adequado ao MVP. Não há APM/tracing/alerting
configurado ainda — registrar aqui a decisão quando isso entrar.

## Health check

`GET /health` (`@Public()`, Terminus) com dois indicadores:

- **Postgres** — `PrismaHealthIndicator.pingCheck('database', ...)`.
- **Redis** — indicador customizado lendo `REDIS_URL`.

O endpoint responde tolerando Redis fora do ar (Redis hoje não é crítico
para nenhum fluxo síncrono da API — está reservado para BullMQ, sem uso
ativo ainda); um teste e2e cobre esse caso (`app.e2e-spec.ts`).

## Auditoria (`AuditLog`)

Não é "monitoramento" de infraestrutura, mas é o registro de auditoria de
negócio — toda ação sensível (login, logout, create/update/delete de
recurso relevante) grava uma entrada com `action`, `entity`, `entityId`,
`oldData`/`newData` (JSON), `municipalityId`, `userId`, IP, user-agent.
Nunca é apagado por um usuário comum — nenhum service expõe método de
delete para `AuditLog`. Ao adicionar uma ação sensível nova, verificar se
ela deveria gerar uma entrada de auditoria (ver `AuditService.log()`).

## Logs de aplicação

Hoje são os logs padrão do NestJS (console) — sem agregação centralizada
configurada. Nenhuma senha, hash ou token deve aparecer em log (ver
`docs/security/SECURITY.md`).

## O que não existe ainda (avaliar quando o volume justificar)

- Dashboard de erro/latência (ex: Sentry, Datadog).
- Alerting automático (ex: taxa de erro 5xx acima de um limiar).
- Trace distribuído entre frontend e backend.

Não adicionar essas ferramentas preventivamente sem necessidade concreta —
ver princípio de performance/economia em `CLAUDE.md`: medir antes de
instrumentar.
