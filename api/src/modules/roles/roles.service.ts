import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthContextCacheService } from '../../common/auth-context/auth-context-cache.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly authContextCacheService: AuthContextCacheService,
  ) {}

  findAll() {
    return this.prismaService.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { characters: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const role = await this.prismaService.role.findUnique({
      where: { slug },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role "${slug}" was not found`);
    }

    return role;
  }

  async getCharacterRoles(characterId: string) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    const roles = await this.prismaService.characterRole.findMany({
      where: { characterId },
      include: { role: true },
      orderBy: { assignedAt: 'asc' },
    });

    return {
      character,
      roles: roles.map((item) => ({
        id: item.role.id,
        name: item.role.name,
        slug: item.role.slug,
        assignedAt: item.assignedAt,
      })),
    };
  }

  async setCharacterRoles(
    characterId: string,
    roleSlugs: string[],
    actor: { accountId: string; characterId?: string | null },
  ) {
    if (!roleSlugs.length) {
      throw new BadRequestException('At least one role is required');
    }

    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    const roles = await this.prismaService.role.findMany({
      where: { slug: { in: roleSlugs } },
    });

    if (roles.length !== roleSlugs.length) {
      throw new BadRequestException('One or more roles were not found');
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.characterRole.deleteMany({ where: { characterId } });
      await tx.characterRole.createMany({
        data: roles.map((role) => ({
          characterId,
          roleId: role.id,
        })),
      });
    });

    this.authContextCacheService.invalidateCharacter(characterId);

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'roles.assign',
      targetType: 'Character',
      targetId: characterId,
      metadata: {
        characterName: `${character.firstName} ${character.lastName}`,
        roleSlugs,
      },
    });

    return this.getCharacterRoles(characterId);
  }
}
