# Design System — GovRural

Base técnica: Tailwind CSS v4 + shadcn/ui (componente npm, não só CLI) sobre
`@base-ui/react` (headless — **não é Radix**, não tem prop `asChild`; para
um link estilizado como botão, usar `className={buttonVariants({...})}`
direto no `<Link>`, nunca `<Button asChild>`). Dark mode via classe `.dark`
em ancestral (`@custom-variant dark (&:is(.dark *))`).

Tokens definidos em `apps/web/src/app/globals.css`. **Nunca hardcode uma
cor** (`zinc-500`, `bg-black`, `#16a34a` direto num componente de UI) —
sempre os tokens semânticos abaixo, para que dark mode e ajuste de marca
funcionem em um lugar só.

## Identidade

Verde (tema rural/agro) como cor de marca, sobre uma base neutra levemente
quente. O sidebar é branco puro no modo claro (destaque contra o fundo do
conteúdo, que recebe um verde-cinza muito sutil).

## Paleta — modo claro (`:root`)

```css
--background: oklch(0.973 0.006 145);   /* quase branco, leve tom verde */
--foreground: oklch(0.19 0.018 150);    /* quase preto */
--card / --popover: oklch(1 0 0);       /* branco puro */
--primary: oklch(0.5 0.135 152);        /* verde de marca */
--primary-foreground: oklch(0.99 0.005 145);
--secondary: oklch(0.95 0.018 145);
--muted: oklch(0.955 0.012 145);
--accent: oklch(0.92 0.045 145);
--destructive: oklch(0.577 0.245 27.325); /* vermelho */
--border / --input: oklch(0.899 0.016 145);
--ring: oklch(0.55 0.12 150);
--radius: 0.75rem;                      /* base do raio de borda */
--sidebar: oklch(1 0 0);                /* branco puro, destacado */
```

Charts: `chart-1` = verde (igual a `--primary`), `chart-2` = ocre/amarelo,
`chart-3` = azul, `chart-4` = vermelho/laranja, `chart-5` = roxo. Usar essa
ordem fixa para séries categóricas — nunca gerar uma cor nova para uma 6ª
série (agrupar em "outros" ou usar composição visual, não um hue novo).

## Paleta — modo escuro (`.dark`)

```css
--background: oklch(0.17 0.014 150);
--foreground: oklch(0.96 0.006 145);
--card / --popover: oklch(0.215 0.016 150);
--primary: oklch(0.72 0.155 150);       /* mais claro/saturado que no
                                            light, para contraste em fundo
                                            escuro */
--destructive: oklch(0.704 0.191 22.216);
--border / --input: oklch(1 0 0 / 10%) e / 15%   /* alpha sobre branco */
```

No dark, o sidebar **não** é branco puro como no light — usa
`oklch(0.195 0.015 150)`, bem próximo do background (perde o destaque que
tem no claro; decisão deliberada para não ficar um branco cru contra fundo
escuro).

## Tipografia

Geist Sans / Geist Mono (`--font-geist-sans`, `--font-geist-mono`, via
`next/font/google`), mapeadas em `--font-sans`/`--font-mono`/
`--font-heading` (heading reaproveita a sans, sem fonte de display própria
— institucional, não editorial).

## Padrão de CRUD administrativo

Ver `docs/architecture/ADR/ADR-003-crud-em-modal.md` para a decisão
completa. Resumo:

- Lista com busca/filtro no topo, botão de ação no cabeçalho.
- Botão "Novo X" abre `New*Dialog` (`components/new-*-dialog.tsx`).
- Clicar na linha da tabela abre `*DetailDialog`
  (`components/*-detail-dialog.tsx`) com edição, mudança de status,
  sub-recursos.
- Nunca uma rota `/novo` ou `/[id]` para essas entidades.
- Exceção: Secretarias e Tipos de Serviço editam nome/status inline na
  própria linha (entidade simples o suficiente para não precisar de modal
  de edição).

## Indicador de status

Nunca só cor. Sempre um badge com **cor + label** (ex:
`components/status-badge.tsx`, `request-status-badge.tsx`,
`occurrence-status-badge.tsx` — um badge por domínio, mapeando o enum de
status daquele domínio para um rótulo em português e uma cor). As cores de
status (bom/atenção/grave/crítico) são reservadas — nunca reaproveitadas
como cor de série categórica de gráfico.

## Navegação (sidebar do painel administrativo)

Agrupada em seções por função (`components/admin-shell.tsx`), não uma
lista plana:

```text
Visão geral        Indicadores, Mapa
Atendimento         Solicitações, Ocorrências
Cadastros           Produtores, Propriedades, Secretarias, Tipos de Serviço
Patrulha Mecanizada Máquinas, Serviços de Máquina
Programas Sociais   Programas
Administração       Usuários, Municípios
```

Cada item pode restringir por `role`. Uma seção some inteira se nenhum item
dela for visível para o perfil logado — é assim que o SUPER_ADMIN só vê
"Administração" (Usuários, Municípios): ele administra a plataforma, não
a operação de um município (ver `docs/product/PERSONAS.md`).

## Componentes de referência

`apps/web/src/components/ui/*` — base do design system (button, card,
dialog, input, label, tabs). Antes de estilizar algo do zero, verifique se
um desses já resolve.
