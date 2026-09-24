# Diretrizes de UX/UI — GovRural

Referência ao adotar qualquer padrão visual novo. O objetivo declarado do
projeto:

> Um produto de software profissional que uma empresa especializada
> desenvolveu para um órgão público moderno — não um dashboard de startup,
> não um template genérico de SaaS, não uma interface com aparência de
> "gerada por IA".

## Antes de criar uma tela nova

1. Existe uma tela semelhante já implementada? (ver os `*DetailDialog` e
   `new-*-dialog.tsx` existentes em `apps/web/src/components/` antes de
   inventar um padrão novo.)
2. Existe um componente reutilizável para isso?
3. O usuário realmente precisa de uma tela nova, ou a informação cabe no
   contexto de uma tela que já existe?
4. Quem usa isso — qual persona (ver `docs/product/PERSONAS.md`) — e o que
   ela quer ver primeiro?

## O que evitar

- Gradiente/glassmorphism/sombra exagerada "porque fica moderno".
- Transformar toda informação em card — uma lista densa de dados
  tabulares (ex: produtores) é uma tabela, não uma grade de cards.
- Ícone decorativo sem função, ou onde um texto seria mais claro.
- Animação sem propósito.
- Excesso de badges — um indicador de status nunca é só cor, é
  sempre cor + label ou ícone + label (acessibilidade e clareza).
- Modal para uma ação que poderia acontecer naturalmente na página (ex:
  toggle de status inline em Secretarias/Tipos de Serviço — não precisa de
  modal para isso).
- Menu com dezenas de itens soltos sem agrupamento — a sidebar é
  organizada em seções por função (ver `DESIGN_SYSTEM.md`).
- Nome técnico do banco/DTO exposto ao usuário final ("municipalityId",
  "PENDING") — sempre traduzir para o rótulo em português que a persona
  entende ("Pendente").

## Densidade de informação

O GovRural é um sistema administrativo — parte das telas precisa ser densa,
não decorativa. Uma lista de produtores prioriza tabela com colunas
(Nome, Localidade, Tipo, Status), não um card grande por produtor.

## Formulários

Não empilhar 40 campos numa tela só quando a complexidade não justifica.
Preferir passos lógicos (dados básicos → contato → propriedades →
documentação) só quando o volume de campos realmente exigir — a maioria
dos formulários do GovRural hoje (produtor, propriedade, máquina) cabe
numa tela só, em grid de 2 colunas.

## Conteúdo / textos (UX writing)

Linguagem clara, humana, objetiva, brasileira, institucional sem ser
burocrática:

- Evitar: *"Nenhum dado disponível para visualização neste momento."*
  Preferir: *"Ainda não há produtores cadastrados."*
- Evitar: *"Operação realizada com sucesso."*
  Preferir: *"Produtor cadastrado."*

## Consistência sem monotonia

Se existe um padrão de tabela para produtores, não criar um padrão
visualmente diferente para propriedades sem motivo — mas também não copiar
a mesma tela cegamente quando o conteúdo pede algo diferente (ex: o modal
de Programas precisa de rolagem interna porque acumula mais conteúdo que os
demais; isso é uma adaptação justificada, não inconsistência).

## Hierarquia de decisão quando há conflito

```text
Segurança e integridade dos dados
        >
Regra de negócio
        >
Arquitetura
        >
UX
        >
Performance
        >
Estética
        >
Conveniência de implementação
```

Uma solução visualmente bonita nunca deve vencer uma solução segura.
