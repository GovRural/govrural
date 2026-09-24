# @govrural/devtools

Ferramentas de desenvolvimento — não usadas em produção, não afetam
`apps/api` nem `apps/web`. Hoje só o script de screenshot, que permite
analisar visualmente uma tela do `apps/web` em vez de só ler o código.

## Screenshot de uma tela

Pré-requisitos: o dev server do `apps/web` precisa estar de pé
(`npx next dev`, porta 3000). Se a rota exigir dado real do backend
(`--auth`), a API também precisa estar de pé (porta 3001).

```bash
cd packages/devtools
node screenshot.mjs /login
node screenshot.mjs /dashboard/indicadores --auth
node screenshot.mjs /dashboard/produtores --auth --full-page --out produtores.png
```

O resultado vai para `packages/devtools/screenshots/` (ignorado pelo git —
são artefatos de análise, não fazem parte do produto).

No Git Bash / MSYS, prefixe com `MSYS_NO_PATHCONV=1` para o shell não
tentar converter o path da rota (`/login`) num caminho de arquivo Windows:

```bash
MSYS_NO_PATHCONV=1 node screenshot.mjs /login
```

Ver todas as opções (largura/altura, credenciais, base URL) no cabeçalho
de `screenshot.mjs`.

## Por que Microsoft Edge, não Chromium

O binário do Chromium do Playwright não pode ser baixado neste ambiente
(download bloqueado pela rede/sandbox — timeout consistente mesmo com
retry e timeout maior). O script usa `channel: "msedge"`, que aponta para
o Microsoft Edge já instalado no Windows (mesmo motor Chromium) em vez de
baixar um binário novo. Se este projeto rodar num ambiente Linux/CI sem
Edge disponível, trocar para `chromium.launch()` puro e rodar
`npx playwright install chromium` normalmente.

## Cuidado ao reproduzir o padrão de login do script

O script faz login preenchendo o formulário real (não injeta o token
direto no `localStorage`) porque o formato exato que o `zustand persist`
grava lá é um detalhe de implementação que já causou um bug real (ver
`docs/architecture/ADR/ADR-004-auth-store-hydration.md`) — preencher o
formulário de verdade testa o fluxo real e não depende desse formato.

Se for replicar esse padrão em outro lugar (ex: um teste e2e futuro),
lembre-se: preencher os campos antes da hidratação do React terminar faz o
valor voltar a ficar vazio. Use `waitUntil: "networkidle"` no `goto` do
login **e** uma pequena espera adicional antes do `fill()`.
