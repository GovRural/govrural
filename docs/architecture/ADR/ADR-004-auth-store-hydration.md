# ADR-004 — Flag `hasHydrated` no auth-store para evitar redirect precoce

## Contexto

`useAuthStore` (Zustand com `persist` em `localStorage`) é a fonte de
verdade de sessão no frontend. Várias telas (`AdminShell`, `/portal`,
`/portal/propriedades`, `/portal/solicitacoes`) fazem, no mount:

```ts
useEffect(() => {
  if (!user) router.replace("/login");
}, [user, router]);
```

Isso parecia correto, mas tinha um bug real: **recarregar a página (F5) num
usuário já autenticado às vezes jogava de volta para o login**, mesmo com
o token válido salvo no `localStorage`. Descoberto ao construir a
ferramenta de screenshot (`packages/devtools/`) — o script precisava
navegar (`page.goto`) para uma rota do dashboard depois do login, o que
força um reload completo de página, e o bug apareceu de forma consistente
nesse cenário.

## Causa raiz

O middleware `persist` do Zustand reidrata o estado do `localStorage` de
forma que **não é síncrona com o primeiro render** — em várias execuções,
o componente monta com `user === null` (valor inicial do store) antes da
reidratação terminar. O `useEffect` acima roda nesse primeiro render, vê
`user === null`, e já dispara `router.replace("/login")` — mesmo que a
reidratação, um instante depois, traga o `user` real.

Em navegação client-side isso quase nunca se manifesta (o estado já está
em memória). Em reload de página completo (F5, ou qualquer `window.location`/
navegação de servidor), a race é consistente.

## Decisão

Adicionar um campo `hasHydrated: boolean` (inicial `false`) ao
`AuthState`, setado para `true` pelo callback `onRehydrateStorage` do
`persist`:

```ts
onRehydrateStorage: () => (state) => {
  if (state) state.hasHydrated = true;
},
```

Toda tela que decide redirecionar por falta de sessão espera esse flag
antes de decidir:

```ts
useEffect(() => {
  if (!hasHydrated) return;
  if (!user) router.replace("/login");
}, [hasHydrated, user, router]);

if (!hasHydrated || !user) return null;
```

## Armadilha encontrada ao implementar

A primeira tentativa foi:

```ts
onRehydrateStorage: () => () => {
  useAuthStore.setState({ hasHydrated: true });  // ERRADO
},
```

Isso lança `ReferenceError: Cannot access 'useAuthStore' before
initialization` em alguns carregamentos: o `persist` pode invocar esse
callback **de forma sincrona durante a própria expressão de criação do
store** — antes de `const useAuthStore = create(...)` terminar de ser
atribuído. Referenciar a constante do lado de fora, dentro do próprio
callback de criação, é uma referência circular que só falha
intermitentemente (dependendo de o `localStorage` já ter dado ou não no
momento da criação) — por isso não apareceu em todo teste manual, só
consistentemente na ferramenta de screenshot com reload forçado.

A forma correta é **mutar o `state` recebido como argumento** do callback
(é a mesma referência que o `persist` usa internamente para aplicar o
resultado), nunca chamar `useAuthStore.setState` de dentro da própria
inicialização do store.

## Consequências

- F5 numa tela autenticada não desloga mais o usuário incorretamente.
- Qualquer tela nova que precise decidir algo com base em `user` estando
  presente ou não deve seguir o mesmo padrão (`hasHydrated` antes de
  decidir) — não copiar o padrão antigo (`if (!user) router.replace(...)`
  sem esperar a hidratação).
- Isso não foi pego antes porque nenhum teste automatizado do frontend
  existia (ver `docs/qa/QA.md`) e a race é rara o suficiente em uso manual
  (o app normalmente já está com o estado em memória, sem reload) para não
  ter sido notada. A ferramenta de screenshot (`packages/devtools/`), que
  força reload real ao navegar para uma rota após login, expôs o bug de
  forma consistente — um bom exemplo de por que vale ter uma forma de
  testar/observar o app "de fora", não só ler o código.
