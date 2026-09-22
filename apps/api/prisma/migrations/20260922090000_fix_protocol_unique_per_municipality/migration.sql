-- Corrige isolamento de tenant: o protocolo (GR-{ano}-{sequencial}) e
-- gerado por um contador POR MUNICIPIO (ProtocolSequence), entao a
-- constraint unique tinha que ser composta (municipality_id, protocol) -
-- nao global. Sem esta correcao, dois municipios diferentes colidiam ao
-- gerar o primeiro protocolo do ano (ambos GR-{ano}-00000001).

-- DropIndex
DROP INDEX "service_requests_protocol_key";

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_municipality_id_protocol_key" ON "service_requests"("municipality_id", "protocol");
