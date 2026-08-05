import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SAED_ORGANIZATION, isSaedOrganization } from '../../common/constants/workplaces';
import { PrismaService } from '../../database/prisma.service';
import { CreateOccupationDto } from './dto/create-occupation.dto';
import { UpdateOccupationDto } from './dto/update-occupation.dto';

@Injectable()
export class OccupationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listForCharacter(characterId: string) {
    await this.assertCharacterExists(characterId);

    return this.prismaService.occupation.findMany({
      where: { characterId },
      orderBy: [{ isPrimary: 'desc' }, { isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createForCharacter(characterId: string, dto: CreateOccupationDto) {
    await this.assertCharacterExists(characterId);
    this.assertNotManualLspd(dto.organization);

    return this.prismaService.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.occupation.updateMany({
          where: { characterId },
          data: { isPrimary: false },
        });
      }

      return tx.occupation.create({
        data: {
          characterId,
          type: dto.type,
          organization: dto.organization.trim(),
          position: dto.position?.trim() || null,
          isPrimary: dto.isPrimary ?? false,
          startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        },
      });
    });
  }

  async update(occupationId: string, dto: UpdateOccupationDto) {
    const existing = await this.prismaService.occupation.findUnique({
      where: { id: occupationId },
    });

    if (!existing) {
      throw new NotFoundException('Occupation was not found');
    }

    if (dto.organization !== undefined) {
      this.assertNotManualLspd(dto.organization);
    }

    return this.prismaService.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.occupation.updateMany({
          where: { characterId: existing.characterId },
          data: { isPrimary: false },
        });
      }

      return tx.occupation.update({
        where: { id: occupationId },
        data: {
          type: dto.type,
          organization: dto.organization?.trim(),
          position: dto.position === undefined ? undefined : dto.position?.trim() || null,
          isPrimary: dto.isPrimary,
          isActive: dto.isActive,
          startedAt:
            dto.startedAt === undefined
              ? undefined
              : dto.startedAt
                ? new Date(dto.startedAt)
                : null,
          endedAt:
            dto.endedAt === undefined ? undefined : dto.endedAt ? new Date(dto.endedAt) : null,
        },
      });
    });
  }

  async remove(occupationId: string) {
    const existing = await this.prismaService.occupation.findUnique({
      where: { id: occupationId },
    });

    if (!existing) {
      throw new NotFoundException('Occupation was not found');
    }

    await this.prismaService.occupation.delete({ where: { id: occupationId } });
    return { deleted: true, id: occupationId };
  }

  private assertNotManualLspd(organization: string) {
    if (isSaedOrganization(organization)) {
      throw new BadRequestException(
        `${SAED_ORGANIZATION} can only be assigned through officer promotion.`,
      );
    }
  }

  private async assertCharacterExists(characterId: string) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      select: { id: true },
    });

    if (!character) {
      throw new NotFoundException('Character was not found');
    }
  }
}
