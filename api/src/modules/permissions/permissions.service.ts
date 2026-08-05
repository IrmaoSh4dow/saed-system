import { Injectable } from '@nestjs/common';
import { CharacterStatus } from '@prisma/client';
import { MEDICAL_ACADEMY_DEPARTMENT_SLUG } from '../../common/constants/departments';
import { PrismaService } from '../../database/prisma.service';

/** Effective academy staff permissions granted to RTD supervisors. */
const RTD_ACADEMY_PERMISSIONS = [
  'academy.read',
  'academy.manage',
  'academy.applications',
] as const;

@Injectable()
export class PermissionsService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll() {
    return this.prismaService.permission.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async getPermissionKeysForCharacter(characterId: string): Promise<string[]> {
    const characterRoles = await this.prismaService.characterRole.findMany({
      where: { characterId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const keys = new Set<string>();

    for (const characterRole of characterRoles) {
      for (const rolePermission of characterRole.role.permissions) {
        keys.add(rolePermission.permission.key);
      }
    }

    if (await this.isRtdSupervisor(characterId)) {
      for (const key of RTD_ACADEMY_PERMISSIONS) {
        keys.add(key);
      }
    }

    if (await this.belongsToLspd(characterId)) {
      keys.delete('academy.apply');
    }

    return [...keys].sort();
  }

  async getRoleSlugsForCharacter(characterId: string): Promise<string[]> {
    const characterRoles = await this.prismaService.characterRole.findMany({
      where: { characterId },
      include: { role: true },
    });

    return characterRoles.map((item) => item.role.slug).sort();
  }

  async isRtdSupervisor(characterId: string): Promise<boolean> {
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { characterId },
      select: { id: true },
    });
    if (!officer) {
      return false;
    }

    const row = await this.prismaService.departmentSupervisor.findFirst({
      where: {
        staffProfileId: officer.id,
        department: { slug: MEDICAL_ACADEMY_DEPARTMENT_SLUG, isActive: true },
      },
      select: { id: true },
    });

    return Boolean(row);
  }

  async belongsToLspd(characterId: string): Promise<boolean> {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      select: {
        status: true,
        staffProfile: { select: { id: true } },
      },
    });

    if (!character) {
      return false;
    }

    return (
      Boolean(character.staffProfile) ||
      character.status === CharacterStatus.INTERN ||
      character.status === CharacterStatus.MEDICAL_STAFF
    );
  }
}
