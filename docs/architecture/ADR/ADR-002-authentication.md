# ADR-002 — Autenticação JWT com refresh token rotativo, hasheado

## Contexto

O sistema precisa de sessões que expirem (access token de curta duração)
mas não exijam login constante (refresh token), com capacidade real de
revogação (logout, desativação de usuário) — algo que um JWT sozinho não
oferece, porque é válido até expirar independente do que acontece no banco.

## Decisão

- **Access token**: JWT assinado com `JWT_SECRET`, expira em
  `JWT_EXPIRES_IN` (default 1 dia). Payload: `sub`, `email`, `role`,
  `municipalityId`, `producerId`.
- **Refresh token**: JWT assinado com um secret **diferente**
  (`JWT_REFRESH_SECRET`), expira em `JWT_REFRESH_EXPIRES_IN` (default
  7 dias).
- O refresh token **nunca é persistido em claro** — só o hash SHA-256
  (`RefreshToken.tokenHash`, `@unique`), junto com `expiresAt` e
  `revokedAt?`. Isso permite revogar uma sessão específica sem esperar a
  expiração natural.
- **Rotação em todo refresh**: ao trocar um refresh token por um par novo,
  o token usado é marcado `revokedAt = now()` imediatamente — não pode ser
  reaproveitado. Isso limita o dano de um refresh token roubado: só
  funciona uma vez até ser detectado (o dono legítimo, ao tentar usar o
  token antigo depois do atacante, recebe erro e sabe que algo está
  errado).
- **Revalidação no banco a cada request autenticada**: a `JwtStrategy` não
  confia só na assinatura do access token — busca o `User` no banco
  (`deletedAt: null, status: 'ACTIVE'`) a cada request. Desativar ou
  remover um usuário tem efeito imediato, mesmo com access token ainda
  dentro da validade.

## Alternativas consideradas

- **Só access token, sem refresh** — obrigaria login frequente ou token de
  vida muito longa (pior para revogação). Rejeitado.
- **Sessão em Redis em vez de JWT** — revogação trivial, mas adiciona
  dependência de estado compartilhado para toda validação de request
  (Redis já é usado para outras coisas, mas tornar auth dependente dele
  aumenta o raio de impacto de uma falha de Redis). Mantido JWT +
  revalidação pontual no banco como meio-termo.

## Consequências

- Um usuário desativado no meio do dia perde acesso na próxima request,
  não precisa esperar o access token expirar.
- Um refresh token roubado e usado uma vez alerta o dono legítimo no
  próximo uso legítimo (falha, porque já foi rotacionado).
- Custo: uma query ao banco por request autenticada (`JwtStrategy.validate`)
  — aceitável no volume esperado do MVP; se performance exigir, um cache
  de curta duração (segundos) do resultado seria a próxima otimização, não
  antecipada agora (ver princípio de performance em `CLAUDE.md`: medir
  antes de otimizar).
