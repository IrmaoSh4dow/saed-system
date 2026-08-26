import { Injectable } from '@nestjs/common';
import { CharacterStatus } from '@prisma/client';
import { MEDICAL_ACADEMY_DEPARTMENT_SLUG } from '../../common/constants/departments';
import { PrismaService } from '../../database/prisma.service';

/** Effective academy staff permissions granted to Medical Academy supervisors. */
const MEDICAL_ACADEMY_SUPERVISOR_PERMISSIONS = [
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
    const { permissions } = await this.resolveAuthorization(characterId);
    return permissions;
  }

  async getRoleSlugsForCharacter(characterId: string): Promise<string[]> {
    const { roles } = await this.resolveAuthorization(characterId);
    return roles;
  }

  /**
   * Single-pass authorization resolution for JWT / request auth context.
   * Replaces the previous multi-query role + permission + supervisor path.
   */
  async resolveAuthorization(
    characterId: string,
    options?: {
      characterStatus?: CharacterStatus;
      staffProfileId?: string | null;
    },
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const [characterRoles, staffProfile] = await Promise.all([
      this.prismaService.characterRole.findMany({
        where: { characterId },
        include: {
          role: {
            select: {
              slug: true,
              permissions: {
                include: {
                  permission: { select: { key: true } },
                },
              },
            },
          },
        },
      }),
      options?.staffProfileId !== undefined
        ? Promise.resolve(options.staffProfileId ? { id: options.staffProfileId } : null)
        : this.prismaService.staffProfile.findUnique({
            where: { characterId },
            select: { id: true },
          }),
    ]);

    const roles = characterRoles.map((item) => item.role.slug).sort();
    const keys = new Set<string>();

    for (const characterRole of characterRoles) {
      for (const rolePermission of characterRole.role.permissions) {
        keys.add(rolePermission.permission.key);
      }
    }

    const staffProfileId = staffProfile?.id ?? null;
    const [isSupervisor, characterStatus] = await Promise.all([
      staffProfileId
        ? this.prismaService.departmentSupervisor
            .findFirst({
              where: {
                staffProfileId,
                department: { slug: MEDICAL_ACADEMY_DEPARTMENT_SLUG, isActive: true },
              },
              select: { id: true },
            })
            .then((row) => Boolean(row))
        : Promise.resolve(false),
      options?.characterStatus
        ? Promise.resolve(options.characterStatus)
        : this.prismaService.character
            .findUnique({
              where: { id: characterId },
              select: { status: true },
            })
            .then((row) => row?.status ?? null),
    ]);

    if (isSupervisor) {
      for (const key of MEDICAL_ACADEMY_SUPERVISOR_PERMISSIONS) {
        keys.add(key);
      }
    }

    const belongsToSaed =
      Boolean(staffProfileId) ||
      characterStatus === CharacterStatus.INTERN ||
      characterStatus === CharacterStatus.MEDICAL_STAFF;

    if (belongsToSaed) {
      keys.delete('academy.apply');
    }

    return {
      roles,
      permissions: [...keys].sort(),
    };
  }

  async isMedicalAcademySupervisor(characterId: string): Promise<boolean> {
    const staffProfile = await this.prismaService.staffProfile.findUnique({
      where: { characterId },
      select: { id: true },
    });
    if (!staffProfile) {
      return false;
    }

    const row = await this.prismaService.departmentSupervisor.findFirst({
      where: {
        staffProfileId: staffProfile.id,
        department: { slug: MEDICAL_ACADEMY_DEPARTMENT_SLUG, isActive: true },
      },
      select: { id: true },
    });

    return Boolean(row);
  }

  /** @deprecated Use isMedicalAcademySupervisor */
  async isRtdSupervisor(characterId: string): Promise<boolean> {
    return this.isMedicalAcademySupervisor(characterId);
  }

  async belongsToSaed(characterId: string): Promise<boolean> {
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
