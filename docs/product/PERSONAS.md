# Personas — GovRural

Cada persona abaixo corresponde a um `UserRole` do sistema (ver
`docs/security/SECURITY.md` para a matriz completa de permissões). Ao
desenhar uma tela ou fluxo novo, pergunte explicitamente: **qual dessas
personas usa isso, e o que ela quer ver primeiro?**

## Prefeito / gestor municipal (leitor de indicadores)

Não é necessariamente um `UserRole` próprio hoje (tipicamente acessa como
MUNICIPAL_ADMIN, com foco só na tela de Indicadores). Quer:

- visão geral rápida — quantas solicitações, quantas pendentes, custo da
  patrulha mecanizada, ocorrências abertas;
- nada que exija leitura de tabela extensa;
- não decide detalhe operacional, decide prioridade e investimento.

## Secretário — `SECRETARY`

Responsável por uma secretaria (ex: Agricultura). Quer:

- ver as solicitações e ocorrências direcionadas à sua secretaria;
- aprovar, rejeitar ou pedir mais informação;
- acompanhar o que já foi encaminhado para execução.

Não gerencia usuários nem máquinas (isso é `MUNICIPAL_ADMIN`).

## Técnico — `TECHNICIAN`

Faz o trabalho de campo/cadastro. Quer:

- cadastrar produtor e propriedade rapidamente, sem formulário de 40 campos
  numa tela só (ver `docs/ux/UX_GUIDELINES.md`, seção de formulários);
- registrar uma solicitação em nome do produtor (atendimento presencial ou
  telefônico, já que nem todo produtor usa o portal);
- consultar histórico antes de decidir algo.

## Operador de máquina — `MACHINE_OPERATOR`

Está no campo, não na frente de um computador de mesa. Quer:

- saber rapidamente qual serviço executar e onde;
- registrar início/fim, horímetro e combustível com o mínimo de campos;
- reportar uma ocorrência que encontrou no caminho (é o único perfil de
  campo que também tem permissão de `POST /occurrences`, além dos perfis de
  gestão).

## Administrador municipal — `MUNICIPAL_ADMIN`

Dono da operação do município inteiro. Quer:

- estruturar o município: secretarias, tipos de serviço, máquinas,
  programas;
- criar e gerenciar os demais usuários (secretários, técnicos, operadores,
  produtores do portal);
- ver indicadores agregados de tudo.

## Produtor rural — `PRODUCER`

Só acessa `/portal`, nunca o painel administrativo. Quer:

- abrir uma solicitação sem precisar entender a estrutura interna da
  prefeitura (não escolhe "departmentId", escolhe "o que precisa");
- acompanhar o status sem ligar para saber;
- ver suas propriedades e os benefícios de programas que já recebeu.

Importante: o cadastro de `Producer` (ficha rural) é sempre feito por um
`TECHNICIAN`/admin — o produtor nunca se autocadastra. O acesso ao portal
(`User` com `role=PRODUCER`) é criado depois, vinculado a um `Producer` já
existente, por um admin. Ver `docs/architecture/DATABASE.md`.

## Super Admin GovRural — `SUPER_ADMIN`

Não é usuário de um município — é quem opera a plataforma como um todo.
Quer:

- cadastrar um novo município (tenant) quando a prefeitura contrata;
- criar o primeiro `MUNICIPAL_ADMIN` daquele município;
- **não** quer, e não deve, ver Produtores, Ocorrências, Máquinas etc de
  nenhum município específico — isso é responsabilidade do admin municipal.
  Essa distinção já está refletida no menu do painel (ver
  `docs/ux/DESIGN_SYSTEM.md`, seção de navegação).
