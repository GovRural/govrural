# GovRural — Visão de Produto

## O problema

Prefeituras de municípios com forte atividade rural gerenciam, hoje, boa
parte do relacionamento com o produtor rural por telefone, papel e planilhas
soltas: pedidos de patrolamento de estrada, calcário, sementes, vacinação de
rebanho, uso da patrulha mecanizada. Isso gera:

- fila sem visibilidade (nem para o produtor, nem para o gestor);
- retrabalho de cadastro (o mesmo produtor/propriedade digitado em vários
  lugares, com grafias diferentes);
- sem histórico auditável de quem aprovou o quê, quando;
- sem dado agregado para decidir onde investir (quantas solicitações por
  secretaria, custo real da patrulha mecanizada, cobertura de programas).

## O que o GovRural resolve

Uma plataforma única, multi-tenant (um município = um tenant isolado), que
cobre o ciclo completo:

```text
Produtor solicita (portal ou atendimento presencial)
        ↓
Secretaria recebe e analisa
        ↓
Aprovação / agendamento
        ↓
Execução (patrulha mecanizada, entrega de insumo, atendimento)
        ↓
Registro de custo/horímetro/resultado
        ↓
Histórico permanente e indicadores
```

Ver o detalhamento de cada fluxo em `docs/ux/FLOWS.md` e o modelo de dados
que sustenta isso em `docs/architecture/DATABASE.md`.

## Quem usa

Ver `docs/product/PERSONAS.md` para o detalhe de cada perfil. Resumo dos
grupos de acesso (RBAC, ver `docs/security/SECURITY.md`):

- **SUPER_ADMIN** — administra a plataforma (cadastra municípios e o
  primeiro admin de cada um). Não opera o dia a dia de nenhum município.
- **MUNICIPAL_ADMIN** — administra o município: secretarias, tipos de
  serviço, usuários, máquinas, programas.
- **SECRETARY** / **TECHNICIAN** — operam solicitações, ocorrências,
  cadastros de produtor/propriedade, agendamento de máquina.
- **MACHINE_OPERATOR** — executa serviços de máquina agendados, registra
  horímetro/combustível; pode reportar ocorrências no campo.
- **PRODUCER** — acesso só ao portal (`/portal`): abre solicitações,
  acompanha status, vê propriedades e benefícios recebidos.

## Escopo do MVP

O que está dentro (ver status de cada item em `docs/product/ROADMAP.md`):

- Cadastro de produtores e propriedades (com vínculo N:N histórico entre
  eles, e talhões dentro de uma propriedade).
- Solicitações de serviço com protocolo (`GR-{ano}-{sequencial}`), histórico
  de status imutável, e priorização.
- Ocorrências rurais (13 tipos: estrada, ponte, incêndio, energia...).
- Patrulha mecanizada: cadastro de máquinas, agendamento de serviço,
  execução com cálculo automático de custo (horímetro × custo/hora).
- Programas municipais (calcário, sementes, mudas...) com beneficiários e
  status de aprovação/entrega.
- Painel administrativo com indicadores e mapa (produtores, propriedades,
  ocorrências e serviços de máquina georreferenciados por lat/lng).
- Portal do produtor.

O que está deliberadamente **fora** do MVP atual (não implementar sem
decisão explícita, ver ADRs correspondentes quando existirem):

- Geometria PostGIS real (polígono de propriedade) — hoje é só um ponto
  lat/lng de referência; a extensão PostGIS está habilitada no banco, mas
  nenhuma coluna usa tipo `geometry` ainda.
- Módulo de documentos/anexos (upload de arquivo em solicitação/ocorrência).
- Integração com WhatsApp (variáveis de ambiente já reservadas, sem código).
- Qualquer camada de IA — só deve entrar quando houver dado suficiente, caso
  de uso concreto e avaliação de segurança, nunca "porque dá para ter".

## Princípio de escopo

Um pedido pequeno ("adicione um filtro") não deve, por si só, disparar
alteração de schema, nova arquitetura ou novos componentes globais.
Verifique primeiro o que já existe antes de propor algo novo — ver
`CLAUDE.md`.
