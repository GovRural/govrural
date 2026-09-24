# Backup e recuperação — GovRural

Estado atual: o banco é hospedado no Supabase, que já provê backup
gerenciado (point-in-time recovery, conforme o plano do projeto Supabase
em uso) — não há rotina de backup própria implementada pelo GovRural além
disso. Registrar aqui qualquer decisão adicional quando o volume de dados
ou o número de municípios justificar uma estratégia própria.

## O que está coberto hoje

- Backup do banco: responsabilidade do Supabase (verificar o plano
  contratado para a janela de retenção real antes de assumir uma
  garantia específica).
- Nenhum backup próprio de arquivo/objeto — não há object storage em uso
  ainda (avatares são salvos como base64 direto no banco, ver
  `docs/security/SECURITY.md`; se um módulo de documentos/anexos for
  implementado, ele vai precisar de uma estratégia de backup própria para
  o object storage escolhido).

## Recuperação de dado excluído (soft-delete)

Vários models usam soft-delete (`deletedAt`, ver
`docs/architecture/DATABASE.md`) — um registro "excluído" pela UI ainda
existe no banco e pode ser restaurado manualmente (via query direta) até
que uma rotina de purga definitiva seja implementada (não existe ainda).
Isso não substitui backup — protege contra exclusão acidental via UI, não
contra perda de dado no nível de infraestrutura.

## O que fazer antes de uma migração de schema arriscada

Não existe rotina automatizada de snapshot pré-migração hoje. Antes de uma
migração que altera ou remove dado (não apenas adiciona coluna nullable),
considerar um backup manual (export via `pg_dump` ou snapshot do Supabase)
como precaução — especialmente em produção, quando esse ambiente existir.

## Pendências (não implementadas, avaliar quando justificado)

- Rotina de export/backup própria independente do Supabase.
- Job de purga definitiva de registros soft-deleted antigos.
- Runbook de restauração testado (hoje não há um procedimento documentado
  de "como restaurar de um backup" além do painel do Supabase).
