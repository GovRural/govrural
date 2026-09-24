# Modelo de ameaças — GovRural

Ameaças consideradas na arquitetura atual, e a mitigação correspondente.
Não é uma análise formal STRIDE completa — é o registro pragmático do que
já foi pensado, para não ser repensado do zero a cada feature.

## Um usuário de um município acessa dados de outro município

**Vetor**: enviar um `municipalityId` diferente no body, ou adivinhar um
UUID de recurso de outro município e tentar acessar por ID direto.

**Mitigação**:
- `TenantGuard` resolve o tenant a partir do JWT/banco, nunca do body —
  o vetor "enviar municipalityId diferente" não tem efeito.
- Todo `findOne`/`findById` filtra pelo `municipalityId` resolvido antes
  de retornar — adivinhar o UUID certo não basta, a query não encontra o
  recurso se ele não pertencer ao tenant do request. Resposta é 404, não
  403 (não confirma que o recurso existe para quem não deveria vê-lo).
- Cobertura de teste: todo módulo tenant-scoped tem teste unitário
  explícito de isolamento (ver `docs/qa/TEST_PLAN.md`) e há um teste e2e
  dedicado ("um segundo município não vê os produtores do primeiro").

## SUPER_ADMIN operando fora do município pretendido

**Vetor**: SUPER_ADMIN esquece de trocar o header `x-municipality-id` (ou
o frontend envia o município errado) e acaba operando/vendo dado de um
município diferente do que pensava.

**Mitigação parcial**: o guard valida que o header é um UUID de município
que existe e está ACTIVE, mas não impede escolher o município errado —
isso é uma decisão de UX (o seletor de município fica visível no topo
quando SUPER_ADMIN acessa uma tela tenant-scoped), não um controle de
segurança. Nota: hoje o SUPER_ADMIN não vê mais as telas operacionais no
menu (ver `docs/ux/DESIGN_SYSTEM.md`), então esse vetor ficou
significativamente menor — ele só administra Municípios/Usuários, que não
usam `TenantGuard` da mesma forma.

## Token roubado (access ou refresh)

**Vetor**: access token ou refresh token capturado (XSS, log, dispositivo
comprometido).

**Mitigação**:
- Access token de vida curta (1 dia default) limita a janela de uso.
- Refresh token é hasheado no banco e rotativo — usar um refresh token já
  usado (ex: pelo atacante, depois do dono legítimo já ter rotacionado, ou
  vice-versa) falha e é detectável.
- Revalidação do usuário no banco a cada request — desativar o usuário
  comprometido corta o acesso imediatamente, mesmo com access token ainda
  válido.
- **Não mitigado hoje**: não há alerta automático nem lista de dispositivos
  ativos para o usuário revisar. Se isso se tornar necessário, é extensão
  futura, não presente no MVP.

## Força bruta de senha

**Vetor**: tentar senhas repetidamente contra `/auth/login`.

**Mitigação**: throttle específico de 5 tentativas/60s nessa rota (mais
restrito que o limite global de 100/60s), mensagem de erro genérica que não
distingue "email não existe" de "senha errada" (evita usar o endpoint para
enumerar quais e-mails têm conta).

**Não mitigado hoje**: sem bloqueio progressivo (backoff) nem CAPTCHA. Para
o volume esperado do MVP (poucos usuários por município, todos internos à
prefeitura ou produtores cadastrados manualmente) o throttle básico foi
considerado suficiente; reavaliar se o produto abrir cadastro público.

## Payload de upload anormalmente grande

**Vetor**: enviar um `avatarUrl` (data URI) enorme para `PATCH /users/me`,
tentando exaurir memória/banda.

**Mitigação**: limite de corpo do Express ampliado só o suficiente para o
caso de uso real (100kb → 2mb, ver `docs/security/SECURITY.md`) — não
removido/ilimitado. `MaxLength(500000)` no DTO como segunda camada.

**Não mitigado hoje**: sem validação de que o conteúdo do data URI é
realmente uma imagem válida no backend (a validação de tipo/tamanho hoje
acontece no client, antes do redimensionamento). Se o upload de imagem
ganhar mais superfície (ex: anexos de documento), validar magic bytes no
backend deveria entrar no threat model daquela feature.

## Vazamento de segredo via git

**Vetor**: `.env` real, senha de banco Supabase, ou credencial de
API externa commitada acidentalmente.

**Mitigação**: `.env` no `.gitignore` de cada app; `.env.example` na raiz
é o único arquivo de env versionado, com placeholders. Processo manual:
revisar `git status`/diff de qualquer arquivo `.env*` staged antes de
commitar, mesmo que pareça um edit inofensivo (já ocorreu um near-miss
neste projeto — um `.env.example` foi acidentalmente editado com
credencial real antes de qualquer commit; foi revertido a tempo).

**Se ocorrer**: tratar a credencial como comprometida e rotacionar
imediatamente, independentemente de ter chegado a ser publicada no remoto
ou não.

## Ameaças fora de escopo do MVP atual (revisar quando a feature entrar)

- Upload de documento/anexo arbitrário (módulo de Documentos, não
  implementado) — vai exigir validação de tipo de arquivo, scanning,
  limite de tamanho por arquivo e por usuário.
- Integração WhatsApp (Fase 13, não implementada) — webhook público vai
  exigir validação de assinatura do provedor.
- Qualquer camada de IA (não implementada) — se um LLM ganhar acesso a
  dados do sistema, a arquitetura deve seguir o padrão
  LLM → AI Gateway → tools autorizadas → services → banco, nunca LLM com
  acesso direto ao banco.
