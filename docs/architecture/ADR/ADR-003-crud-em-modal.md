# ADR-003 — CRUD administrativo em modal, não em página dedicada

## Contexto

As primeiras telas administrativas (Produtores, Propriedades, Solicitações
etc.) foram construídas com o padrão convencional de páginas separadas:
lista em `/dashboard/x`, criação em `/dashboard/x/novo`, detalhe/edição em
`/dashboard/x/[id]`. Na prática, isso gerou navegação fragmentada — abrir um
registro trocava toda a tela por uma página nova, e o usuário perdia o
contexto da lista (filtro aplicado, posição de scroll).

## Decisão

Toda criação e todo detalhe/edição de entidade acontece em um **modal**
aberto a partir da tela de listagem:

- Botão de ação no cabeçalho da lista ("Novo produtor", "Nova propriedade"
  etc.) abre um `New*Dialog`.
- Clicar em qualquer parte da linha da tabela abre um `*DetailDialog` com
  os dados daquele registro (edição, mudança de status, sub-recursos como
  histórico ou beneficiários).
- Ao criar um registro com sucesso, o dialog de criação fecha e — quando
  fizer sentido — abre automaticamente o dialog de detalhe do registro
  recém-criado (via callback `onCreated`), em vez de navegar para uma URL.
- Rotas `/novo` e `/[id]` foram removidas para todas as entidades
  administrativas (Produtores, Propriedades, Solicitações, Ocorrências,
  Máquinas, Serviços de Máquina, Programas, Usuários, Municípios).

Exceção: Secretarias e Tipos de Serviço já usavam edição inline na própria
linha da lista (nome, status) — mantido como está, só a criação virou modal
(o padrão de edição inline continua válido para campos simples de entidade
simples).

## Padrão de implementação

Componente de dialog de detalhe segue sempre a mesma forma, para evitar o
erro de lint "setState em efeito" (que ocorre ao popular um formulário a
partir de dados carregados via `useEffect`):

```tsx
export function XDetailDialog({ id, onOpenChange }) {
  return (
    <Dialog open={id !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {id && <XDetailContent id={id} />}   {/* só monta quando há id */}
      </DialogContent>
    </Dialog>
  );
}

function XDetailContent({ id }) {
  const query = useQuery(...);               // busca os dados
  return query.data && <XForm initial={query.data} />;  // só monta com dados
}

function XForm({ initial }) {
  const [field, setField] = useState(initial.field);  // lazy init, sem efeito
  // ...
}
```

Como o componente inteiro só é montado quando os dados já existem, o
`useState` inicializa direto a partir da prop — sem `useEffect` +
`setState`.

## Consequências

- Navegação mais rápida e sem perda de contexto de lista/filtro/scroll.
- Todo dialog de criação que tinha `router.push` para a página de detalhe
  recém-criada precisou ser trocado por um callback `onCreated?(id)` que o
  componente pai usa para abrir o dialog de detalhe correspondente — não
  existe mais página para navegar.
- Telas com muito conteúdo (ex: Programas, que tem formulário de
  beneficiário + lista de beneficiários dentro do mesmo modal) precisam de
  `max-h-[85vh] overflow-y-auto` no `DialogContent` para não cortar
  conteúdo na tela.
- Deep-linking direto para um registro específico via URL não é mais
  possível (não era um requisito de produto até este ADR; se se tornar
  necessário, seria uma extensão — não uma reversão — usando query params
  para abrir o dialog certo ao carregar a lista).
