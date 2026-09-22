import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';

/**
 * Teste de integracao ponta-a-ponta (ver secao 69): Producer -> Property ->
 * ServiceType -> ServiceRequest -> MachineService, contra um banco real
 * (nao mockado). Cria seus proprios dados com nomes unicos e faz cleanup no
 * final para nao acumular lixo no banco compartilhado de desenvolvimento.
 *
 * Requer SEED_SUPER_ADMIN_EMAIL/PASSWORD (o seed) ja aplicados no banco
 * apontado por DATABASE_URL.
 */
describe('Fluxo de integracao: produtor -> propriedade -> solicitacao -> maquina', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let municipalityId: string;

  const suffix = Date.now();
  // Registrado assim que cada municipio e criado (antes de qualquer outra
  // chamada que possa falhar/dar timeout), para que o afterAll limpe tudo
  // mesmo se um teste for interrompido no meio.
  const createdMunicipalityIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const email = process.env.SEED_SUPER_ADMIN_EMAIL;
    const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error(
        'SEED_SUPER_ADMIN_EMAIL/PASSWORD nao definidos - rode o seed antes deste teste',
      );
    }

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    accessToken = loginRes.body.accessToken;

    const municipalityRes = await request(app.getHttpServer())
      .post('/municipalities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Municipio Teste E2E ${suffix}`, state: 'MS' })
      .expect(201);
    municipalityId = municipalityRes.body.id;
    createdMunicipalityIds.push(municipalityId);
  });

  afterAll(async () => {
    // Cleanup: apaga todos os municipios de teste criados (mesmo que algum
    // teste tenha falhado/dado timeout no meio) e tudo em cascata (FKs
    // onDelete Cascade cobrem department/producer/property/serviceType/
    // request).
    await prisma.municipality.deleteMany({
      where: { id: { in: createdMunicipalityIds } },
    });
    await app.close();
  });

  it('percorre o fluxo completo gerando protocolo e calculando custo de maquina', async () => {
    const department = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({ name: 'Secretaria de Agricultura' })
      .expect(201);

    const producer = await request(app.getHttpServer())
      .post('/producers')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({
        name: 'Produtor Teste E2E',
        cpfCnpj: '11122233344',
        producerType: 'INDIVIDUAL',
      })
      .expect(201);

    const property = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({ name: 'Fazenda Teste E2E', totalArea: 10, ownershipType: 'OWNED' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/properties/${property.body.id}/producers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({ producerId: producer.body.id, isPrimary: true })
      .expect(201);

    const serviceType = await request(app.getHttpServer())
      .post('/service-types')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({ name: 'Patrolamento', departmentId: department.body.id })
      .expect(201);

    const serviceRequest = await request(app.getHttpServer())
      .post('/service-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({
        producerId: producer.body.id,
        propertyId: property.body.id,
        departmentId: department.body.id,
        serviceTypeId: serviceType.body.id,
        description: 'Estrada intransitavel',
      })
      .expect(201);

    expect(serviceRequest.body.protocol).toMatch(/^GR-\d{4}-\d{8}$/);
    expect(serviceRequest.body.status).toBe('RECEIVED');

    const machine = await request(app.getHttpServer())
      .post('/machines')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({ name: 'Trator Teste', type: 'Trator', hourlyCost: 150 })
      .expect(201);

    const machineService = await request(app.getHttpServer())
      .post('/machine-services')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({
        machineId: machine.body.id,
        producerId: producer.body.id,
        propertyId: property.body.id,
        serviceRequestId: serviceRequest.body.id,
        serviceType: 'Patrolamento',
      })
      .expect(201);

    const executed = await request(app.getHttpServer())
      .patch(`/machine-services/${machineService.body.id}/execution`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', municipalityId)
      .send({ initialHourMeter: 10, finalHourMeter: 13 })
      .expect(200);

    // 150/h x 3h = 450 (secao 23)
    expect(executed.body.totalHours).toBe('3');
    expect(executed.body.actualCost).toBe('450');
    expect(executed.body.status).toBe('COMPLETED');
  });

  it('isola os dados: um segundo municipio nao ve os produtores do primeiro', async () => {
    const otherMunicipality = await request(app.getHttpServer())
      .post('/municipalities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Outro Municipio E2E ${suffix}`, state: 'MS' })
      .expect(201);
    createdMunicipalityIds.push(otherMunicipality.body.id);

    const producers = await request(app.getHttpServer())
      .get('/producers')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-municipality-id', otherMunicipality.body.id)
      .expect(200);

    expect(producers.body.data).toHaveLength(0);
  });
});
