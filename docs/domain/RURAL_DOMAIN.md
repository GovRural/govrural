# Domínio rural/municipal — GovRural

Conceitos do mundo real que o schema modela. Ler antes de propor um campo
ou regra nova, para não inventar algo que não corresponde à realidade do
campo/da prefeitura.

## Produtor e propriedade não são a mesma coisa

Um `Producer` (produtor rural, pessoa física/jurídica) pode ter mais de uma
`RuralProperty` (propriedade), e uma propriedade pode ter mais de um
produtor responsável (sócios, herdeiros, arrendatário e proprietário ao
mesmo tempo). Por isso o vínculo é uma tabela própria
(`ProducerProperty`) com `isPrimary` (quem é o responsável principal) e
`startDate`/`endDate` — o mesmo par produtor+propriedade pode ter mais de
um vínculo ao longo do tempo (ex: um arrendamento termina, outro começa).
Não modele isso como uma FK direta simples de propriedade para produtor.

## Talhão (`PropertyArea`)

Uma propriedade rural é dividida em talhões — áreas com uso diferente
(pastagem, lavoura, reserva). Cada talhão tem sua própria área em hectares,
cultura, tipo de solo, se é irrigado. A soma dos talhões não precisa
necessariamente bater com `totalArea` da propriedade no schema atual (não
há constraint disso) — é uma simplificação aceita para o MVP.

## Tipo de posse da propriedade

`OwnershipType`: própria, arrendada, comodato, parceria, posse, outra —
importante para elegibilidade em alguns programas municipais (um programa
de crédito, por exemplo, pode exigir posse própria; essa regra hoje fica
em `Program.eligibilityRules`, texto livre, não validada pelo sistema).

## Solicitação de serviço — o que a prefeitura efetivamente faz

Exemplos reais de `ServiceType`: patrolamento de estrada, cascalhamento,
distribuição de calcário, distribuição de sementes/mudas, vacinação de
rebanho. Cada tipo pertence a uma `Department` (secretaria) responsável —
normalmente Agricultura, mas pode ser Obras (estradas) ou Saúde
(vacinação/zoonoses).

## Patrulha mecanizada

"Máquina" aqui não é só trator — inclui patrol (motoniveladora), caminhão,
retroescavadeira. `Machine.type`/`fuelType` são texto livre porque a lista
real varia muito por município e não há benefício em fechar um enum. O
custo do serviço é sempre calculado a partir do horímetro (horas de uso do
equipamento, não distância) × custo por hora cadastrado na máquina — é
assim que a prefeitura já calcula isso hoje na prática (não é uma invenção
do sistema).

## Ocorrência rural vs. solicitação de serviço

Uma **solicitação** é um pedido do produtor por algo que ele precisa
(proativo, ele inicia). Uma **ocorrência** é um problema reportado (uma
ponte quebrada, um foco de incêndio, um animal solto na estrada) — pode ser
reportada pelo próprio produtor, por um técnico, ou por um operador de
máquina que encontrou o problema no caminho. Não são a mesma entidade e não
devem ser fundidas: uma ocorrência não gera protocolo sequencial nem tem o
mesmo ciclo de aprovação de uma solicitação.

## Programa municipal e beneficiário

Um `Program` (ex: "Programa de Calcário 2026") tem um orçamento e um
período de vigência. Um `ProgramBeneficiary` é o registro de que um
produtor específico recebeu (ou está pendente de receber) um benefício
daquele programa — com quantidade, unidade e valor. Isso é diferente de uma
`ServiceRequest`: o produtor não necessariamente "solicitou" o benefício,
pode ter sido incluído por critério de elegibilidade definido pela
secretaria (por isso `ProgramBeneficiary` não tem protocolo nem histórico
de status detalhado como `ServiceRequest`).

## Sazonalidade (considerar ao desenhar indicadores/relatórios)

Volume de solicitações e ocorrências varia fortemente por época do ano
(período de chuva → mais solicitação de patrolamento e mais ocorrência de
estrada danificada; período de plantio → mais solicitação de insumo). Um
indicador que compara "este mês vs. mês passado" sem considerar isso pode
levar a conclusão errada — preferir comparação com o mesmo período do ano
anterior quando o volume de dado permitir.

## Realidade de conectividade e letramento digital

Nem todo produtor rural tem acesso confiável à internet ou familiaridade
com formulários digitais — por isso o cadastro (`Producer`) é sempre feito
por um técnico da prefeitura, não por autocadastro, e o portal do produtor
prioriza poucos campos e linguagem direta em vez de terminologia
administrativa interna (ver `docs/ux/UX_GUIDELINES.md`).
