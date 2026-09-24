# Segurança — GovRural

Segurança é requisito de arquitetura, não uma revisão de última hora.
Qualquer mudança em autenticação, autorização, isolamento de tenant,
upload, ou exposição de dado pessoal (CPF/CNPJ, telefone, endereço) deve
ser lida contra este documento antes de ser considerada concluída.

## Cadeia de guards (ordem de execução)

```text
1. ThrottlerGuard   global — 100 req/60s (roda até em rotas @Public())
2. JwtAuthGuard      global — popula request.user; libera se @Public()
3. RolesGuard        global — avalia @Roles(); libera se ausente
4. TenantGuard       por controller — resolve request.municipalityId
```

`TenantGuard` roda depois dos globais (Nest aplica guards de
controller/handler após os globais). Nem todo controller usa
`TenantGuard` — `users` e `municipalities` são as exceções deliberadas
(gerenciam entidades cross-tenant ou fazem a lógica de tenant manualmente
dentro do service com o `currentUser` completo).

## Resolução de tenant — a regra que não pode quebrar

```ts
// Para qualquer role != SUPER_ADMIN:
municipalityId = request.user.municipalityId;  // do JWT/banco, sempre

// Só para SUPER_ADMIN (não pertence a nenhum município):
municipalityId = header('x-municipality-id');  // validado como UUID e
                                                  // contra o banco antes
                                                  // de ser aceito
```

**Nunca** aceitar `municipalityId` do body ou de um header para um usuário
que já tem município no próprio token. Isso seria a forma mais direta de
um usuário acessar dados de outro município.

Depois de resolvido, o guard confirma que o município existe
(`deletedAt: null`) e está `ACTIVE` — município `INACTIVE`/`SUSPENDED`
bloqueia toda operação com `BadRequestException`.

## RBAC — matriz de permissões por módulo

| Módulo | Leitura (GET) | Escrita | Observação |
|---|---|---|---|
| `municipalities` | SUPER_ADMIN | SUPER_ADMIN | classe inteira restrita |
| `users` | qualquer autenticado* | SUPER_ADMIN, MUNICIPAL_ADMIN | *filtro por tenant no service |
| `departments` | qualquer do tenant | SUPER_ADMIN, MUNICIPAL_ADMIN | |
| `producers` | qualquer do tenant | +TECHNICIAN (delete só admins) | |
| `properties` | qualquer do tenant | +TECHNICIAN (delete só admins) | |
| `service-types` | qualquer do tenant | SUPER_ADMIN, MUNICIPAL_ADMIN | |
| `service-requests` | qualquer do tenant | +SECRETARY, TECHNICIAN | |
| `occurrences` | qualquer do tenant | criação: +MACHINE_OPERATOR; edição: +SECRETARY, TECHNICIAN | operador reporta, não gerencia |
| `machines` | qualquer do tenant | só SUPER_ADMIN, MUNICIPAL_ADMIN | mais restrito — só admins cadastram |
| `machine-services` | qualquer do tenant | agendar: +SECRETARY, TECHNICIAN; executar (`/execution`): +MACHINE_OPERATOR | agendar ≠ executar |
| `programs` | qualquer do tenant | só SUPER_ADMIN, MUNICIPAL_ADMIN | |
| `program-beneficiaries` | qualquer do tenant | +SECRETARY, TECHNICIAN | sem delete |
| `gis`, `dashboards` | qualquer do tenant | — (só leitura) | |
| `portal` | só PRODUCER, escopado a `user.producerId` | só PRODUCER (criar solicitação) | nunca vê dado de outro produtor |

Toda autorização é revalidada no backend via `@Roles()` +
`RolesGuard`. `apps/web/src/lib/roles.ts` (`canManage`, `canAdminister`,
`hasAnyRole`) só esconde ações na UI — nunca é a fonte de verdade, e não
deve ser tratado como controle de acesso real.

## Autenticação (detalhe completo em `docs/architecture/ADR/ADR-002-authentication.md`)

- Senha: `bcryptjs`, nunca comparação direta.
- Falha de login não distingue "email não existe" de "senha errada"
  (mesma `UnauthorizedException`, evita enumeração de usuários).
- Refresh token: nunca persistido em claro (hash SHA-256), rotativo (uso
  único), revalidação do usuário no banco a cada request.
- `JWT_SECRET` e `JWT_REFRESH_SECRET` são segredos **diferentes** — um
  access token comprometido não permite forjar refresh token e vice-versa.

## Dados pessoais e segredos

- CPF/CNPJ é único por município (`Producer`), não globalmente — dois
  municípios podem ter produtores com o mesmo documento sem colisão nem
  vazamento de correlação entre eles.
- `.env` real nunca é commitado; `.env.example` na raiz é o único arquivo
  de env versionado e deve conter **só placeholders**. Antes de commitar,
  sempre revisar o diff de qualquer arquivo `.env*` staged, mesmo que
  pareça inofensivo.
- Senha do banco de dados e credenciais de projeto Supabase nunca devem
  aparecer em log, mensagem de commit, ou arquivo versionado — se
  expostas acidentalmente (mesmo que não cheguem a ser commitadas), tratar
  como comprometidas e rotacionar.
- `AuditLog` é imutável — nenhum service expõe método de delete para ele.

## Upload / payload

- Avatar de usuário é enviado como data URI base64 via `PATCH /users/me`,
  redimensionado no client antes do envio (`lib/image-resize.ts`) para
  não gravar arquivos grandes num banco sem object storage dedicado. Body
  parser do Express foi ampliado de 100kb (default) para 2mb
  especificamente para acomodar isso (`app.use(json({ limit: '2mb' }))`
  em `main.ts`) — qualquer upload maior que isso precisa de um object
  storage real (variáveis `STORAGE_*` já reservadas em `.env.example`,
  sem implementação ainda).
- `ValidationPipe` global com `forbidNonWhitelisted: true` — um campo
  extra não declarado no DTO é rejeitado, não ignorado silenciosamente.

## Rate limiting

`ThrottlerGuard` global (100 req/60s) cobre tudo, incluindo rotas
públicas. `/auth/login` tem limite adicional mais estrito (5 tentativas/
60s) contra força bruta de senha.

## O que fazer ao adicionar uma feature sensível

Sempre passar pela lista antes de considerar concluído:

- [ ] A rota tem `TenantGuard` (se opera dado tenant-scoped)?
- [ ] O `municipalityId` usado na query vem do guard, não do body/header
  não confiável?
- [ ] `@Roles()` reflete exatamente quem deveria poder fazer isso (ver
  tabela acima)?
- [ ] Um recurso de outro tenant retorna 404, não 403 nem os dados?
- [ ] Existe teste unitário cobrindo o isolamento de tenant desse caso
  específico (ver `docs/qa/TEST_PLAN.md` para o padrão já usado em todos
  os módulos existentes)?
- [ ] Nenhum dado sensível (senha, hash, token) é retornado numa resposta
  (ver `sanitize()` em `UsersService` como referência de padrão)?
