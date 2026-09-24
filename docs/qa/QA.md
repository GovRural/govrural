# QA — GovRural

## Ferramentas

Backend: **Vitest** (não Jest) — `vitest` para unitários,
`vitest.config.e2e.ts` dedicado para e2e contra banco real (Supabase de
desenvolvimento, sem banco de teste isolado — os testes criam e limpam
seus próprios dados com nome único e IDs coletados para cleanup no
`afterAll`, ver `docs/qa/TEST_PLAN.md`). Lint: **oxlint** (não ESLint).

Frontend: `tsc --noEmit` para tipos, ESLint para lint. Sem suite de teste
automatizado ainda (nenhum arquivo `*.test.tsx`/`*.spec.tsx` no frontend
até o momento) — a verificação de UI hoje é: `curl` pra status 200
(confirma ausência de erro de build/runtime), mais **inspeção visual
real** via `packages/devtools/screenshot.mjs` (Playwright sobre o
Microsoft Edge já instalado no Windows — o binário do Chromium não pode
ser baixado neste ambiente, ver o README do pacote). Antes desse script
existir, a "verificação visual" era só leitura de código comparada aos
tokens/padrões — isso já deixou passar um bug real (ver
`docs/architecture/ADR/ADR-004-auth-store-hydration.md`, achado
justamente ao forçar um reload de página via este script). Preferir
sempre o screenshot real a inferir a aparência pela classe Tailwind.

## O que testar além do "abre"

Ao validar uma funcionalidade nova ou alterada, cobrir:

- **Funcional**: o caminho feliz funciona ponta a ponta.
- **Regressão**: algo que já funcionava quebrou? (rodar toda a suíte
  existente do módulo tocado, não só o teste novo.)
- **Permissão**: um usuário sem o `@Roles()` exigido é bloqueado?
- **Tenant**: um usuário do município A não vê/edita dado do município B?
  (ver `docs/security/SECURITY.md` — todo módulo tenant-scoped precisa
  desse teste.)
- **Dados**: cálculos derivados estão corretos? (ex: custo de serviço de
  máquina, protocolo sequencial, `resolvedAt`/`approvalDate` automáticos.)
- **Erros**: o sistema reage bem a entrada inválida/incompleta (não só ao
  caso feliz)?

## Postura adversarial

Ao revisar uma feature que toca em dados sensíveis ou multi-tenant, tente
ativamente quebrá-la, não só confirmar que funciona:

- Trocar um ID no request manualmente (produtor de outro município, etc).
- Enviar `municipalityId` diferente no body de um usuário não-SUPER_ADMIN.
- Repetir uma request (idempotência — ex: aprovar um beneficiário duas
  vezes não deveria sobrescrever a data de aprovação original).
- Tentar acessar um endpoint sem o role exigido.
- Enviar formulário incompleto / campo com tipo errado.

## Definition of Done (verificação mínima antes de considerar pronto)

```text
[ ] tsc --noEmit limpo (apps/web)
[ ] eslint limpo (apps/web) / oxlint limpo (apps/api)
[ ] Testes unitários do módulo tocado passam (apps/api)
[ ] Se mudou schema: migração aplicada + testes de isolamento de tenant
    do módulo ainda passam
[ ] Se mudou rota nova de listagem/detalhe: verificado via curl que
    retorna o status esperado
[ ] Se mudou UI: screenshot real via `packages/devtools/screenshot.mjs`
    (não so leitura de codigo), comparado contra `docs/ux/DESIGN_SYSTEM.md`
```

Ver a suíte de testes já existente, módulo por módulo, em
`docs/qa/TEST_PLAN.md`.
