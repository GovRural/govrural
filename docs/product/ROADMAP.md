# Roadmap — GovRural

14 fases definidas para o MVP, na ordem em que foram implementadas
(corresponde à sequência de commits no histórico do repositório). Depois da
Fase 14, o trabalho passou a ser de refinamento de UI/UX sobre o que já
existia (ver "Pós-MVP" no final).

| Fase | Entrega | Status |
|---|---|---|
| 01 | Infraestrutura: monorepo pnpm, esqueleto NestJS/Next.js | ✅ Concluída |
| 02 | Banco + multi-tenancy: `Municipality`, `MunicipalitySettings`, `Department`, `AuditLog` | ✅ Concluída |
| 03 | Auth + RBAC: `User`, `RefreshToken`, guards, JWT | ✅ Concluída |
| 04 | Produtores: `Producer` | ✅ Concluída |
| 05 | Propriedades: `RuralProperty`, `ProducerProperty`, `PropertyArea` | ✅ Concluída |
| 06–07 | Solicitações de serviço (`ServiceRequest` + protocolo + histórico) e ocorrências rurais (`RuralOccurrence`) | ✅ Concluída |
| 08 | Patrulha mecanizada (`Machine`, `MachineService`) + telas de login/dashboard iniciais | ✅ Concluída |
| 09 | Programas municipais (`Program`, `ProgramBeneficiary`) | ✅ Concluída |
| 10 | GIS: endpoint de mapa (`/gis/map`), camadas por tipo de entidade | ✅ Concluída (sem geometria PostGIS real — ver `docs/product/PRODUCT.md`) |
| 11 | Dashboards / indicadores agregados (`/dashboard/*`) | ✅ Concluída |
| 12 | Portal do produtor (`/portal/*`) | ✅ Concluída |
| 13 | Integração WhatsApp | ⏸ Pendente — depende de credenciais reais do Meta/WhatsApp Business API; variáveis de ambiente já reservadas (`WHATSAPP_PROVIDER`, `WHATSAPP_TOKEN`), sem código ainda |
| 14 | Segurança, testes de integração e correção de bug de isolamento de tenant (protocolo de solicitação era único globalmente em vez de por município) | ✅ Concluída |

## Pós-MVP (refinamento de UI/UX)

Trabalho feito depois da Fase 14, sem numeração própria — consolidado num
único commit de redesign:

- Navegação do painel reorganizada em seções por função (Visão geral,
  Atendimento, Cadastros, Patrulha Mecanizada, Programas Sociais,
  Administração); Super Admin passou a ver só Municípios/Usuários.
- Telas de gestão de Municípios e Usuários (faltavam para o onboarding de
  um município novo funcionar de ponta a ponta pela UI, sem precisar de
  chamada direta à API).
- Toda criação e todo detalhe/edição de entidade migrou de página dedicada
  (`/dashboard/x/novo`, `/dashboard/x/[id]`) para modal aberto a partir da
  listagem — ver ADR correspondente em `docs/architecture/ADR/` quando for
  registrado.
- Upload de foto de perfil + endpoints que faltavam para qualquer usuário
  editar os próprios dados (`PATCH /users/me`, `/me/email`).
- Redesign visual de login, indicadores e mapa (legenda/filtro por camada).

## O que vem depois (não iniciado)

- Fase 13 (WhatsApp), quando houver credenciais.
- Módulo de documentos/anexos.
- Geometria PostGIS real para propriedades (polígono, não só ponto).
- Qualquer camada de IA — sem timeline definida, entra só com caso de uso
  concreto (ver `docs/product/PRODUCT.md`).
