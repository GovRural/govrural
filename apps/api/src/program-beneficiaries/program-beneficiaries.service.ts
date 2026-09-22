import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, ProgramBeneficiaryStatus } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ProgramsService } from '../programs/programs.service.js';
import { CreateProgramBeneficiaryDto } from './dto/create-program-beneficiary.dto.js';
import { UpdateProgramBeneficiaryDto } from './dto/update-program-beneficiary.dto.js';

@Injectable()
export class ProgramBeneficiariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly programsService: ProgramsService,
  ) {}

  async create(
    municipalityId: string,
    programId: string,
    dto: CreateProgramBeneficiaryDto,
  ) {
    await this.programsService.findOne(municipalityId, programId);

    const producer = await this.prisma.producer.findFirst({
      where: { id: dto.producerId, municipalityId, deletedAt: null },
    });
    if (!producer) {
      throw new BadRequestException('Produtor invalido para este municipio');
    }

    if (dto.propertyId) {
      await this.assertPropertyBelongsToProducer(
        municipalityId,
        dto.propertyId,
        dto.producerId,
      );
    }

    const beneficiary = await this.prisma.programBeneficiary.create({
      data: { ...dto, programId },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.CREATE,
      entity: 'ProgramBeneficiary',
      entityId: beneficiary.id,
      newData: beneficiary,
    });

    return beneficiary;
  }

  async findAll(municipalityId: string, programId: string) {
    await this.programsService.findOne(municipalityId, programId);

    return this.prisma.programBeneficiary.findMany({
      where: { programId },
      include: { producer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(municipalityId: string, programId: string, id: string) {
    await this.programsService.findOne(municipalityId, programId);

    const beneficiary = await this.prisma.programBeneficiary.findFirst({
      where: { id, programId },
      include: { producer: true, property: true },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiario nao encontrado');
    }

    return beneficiary;
  }

  async update(
    municipalityId: string,
    programId: string,
    id: string,
    dto: UpdateProgramBeneficiaryDto,
  ) {
    const existing = await this.findOne(municipalityId, programId, id);

    if (dto.propertyId) {
      await this.assertPropertyBelongsToProducer(
        municipalityId,
        dto.propertyId,
        existing.producerId,
      );
    }

    let approvalDate = existing.approvalDate;
    if (dto.status === ProgramBeneficiaryStatus.APPROVED && !approvalDate) {
      approvalDate = new Date();
    }

    let deliveryDate = existing.deliveryDate;
    if (dto.status === ProgramBeneficiaryStatus.DELIVERED && !deliveryDate) {
      deliveryDate = new Date();
    }

    const beneficiary = await this.prisma.programBeneficiary.update({
      where: { id: existing.id },
      data: {
        propertyId: dto.propertyId,
        benefitType: dto.benefitType,
        quantity: dto.quantity,
        unit: dto.unit,
        value: dto.value,
        status: dto.status,
        approvalDate,
        deliveryDate,
      },
    });

    await this.audit.log({
      municipalityId,
      action: AuditAction.UPDATE,
      entity: 'ProgramBeneficiary',
      entityId: beneficiary.id,
      oldData: existing,
      newData: beneficiary,
    });

    return beneficiary;
  }

  private async assertPropertyBelongsToProducer(
    municipalityId: string,
    propertyId: string,
    producerId: string,
  ) {
    const property = await this.prisma.ruralProperty.findFirst({
      where: { id: propertyId, municipalityId, deletedAt: null },
    });
    if (!property) {
      throw new BadRequestException('Propriedade invalida para este municipio');
    }

    const link = await this.prisma.producerProperty.findFirst({
      where: { propertyId, producerId, endDate: null },
    });
    if (!link) {
      throw new BadRequestException(
        'Esta propriedade nao esta vinculada ao produtor informado',
      );
    }
  }
}
