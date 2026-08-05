import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';

@Injectable()
export class RanksService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAllActive() {
    return this.prismaService.rank.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
      },
    });
  }

  findAll() {
    return this.prismaService.rank.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            characters: true,
            staffProfiles: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const rank = await this.prismaService.rank.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            characters: true,
            staffProfiles: true,
          },
        },
      },
    });

    if (!rank) {
      throw new NotFoundException('Rank was not found');
    }

    return rank;
  }

  findBySlug(slug: string) {
    return this.prismaService.rank.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        isActive: true,
      },
    });
  }

  async create(
    dto: CreateRankDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const slug = (dto.slug ?? slugify(dto.name)).toLowerCase();
    const existing = await this.prismaService.rank.findFirst({
      where: { OR: [{ slug }, { name: dto.name.trim() }] },
    });
    if (existing) {
      throw new ConflictException('Rank name or slug already exists');
    }

    const rank = await this.prismaService.rank.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'ranks.create',
      targetType: 'Rank',
      targetId: rank.id,
      metadata: { name: rank.name, slug: rank.slug, sortOrder: rank.sortOrder },
    });

    return rank;
  }

  async update(
    id: string,
    dto: UpdateRankDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    await this.findById(id);

    const rank = await this.prismaService.rank.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description:
          dto.description === undefined ? undefined : dto.description.trim() || null,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'ranks.update',
      targetType: 'Rank',
      targetId: rank.id,
      metadata: { ...dto },
    });

    return rank;
  }

  async remove(
    id: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const rank = await this.findById(id);
    const usage = rank._count.characters + rank._count.staffProfiles;

    if (usage > 0) {
      throw new BadRequestException('Rank is in use and cannot be deleted');
    }

    await this.prismaService.rank.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'ranks.delete',
      targetType: 'Rank',
      targetId: id,
      metadata: { name: rank.name, slug: rank.slug },
    });

    return { deleted: true, id };
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
