import type {
  Character,
  CharacterRole,
  Decoration,
  Department,
  License,
  Occupation,
  StaffDecoration,
  StaffDepartment,
  StaffLicense,
  StaffProfile,
  Rank,
  Role,
} from '@prisma/client';

type CharacterWithRelations = Character & {
  rank?: Rank | null;
  roles?: Array<CharacterRole & { role: Role }>;
  occupations?: Occupation[];
  staffProfile?:
    | (StaffProfile & {
        rank?: Rank | null;
        department?: Department | null;
        decorations?: Array<StaffDecoration & { decoration: Decoration }>;
        licenses?: Array<StaffLicense & { license: License }>;
        departmentMemberships?: Array<StaffDepartment & { department: Department }>;
      })
    | null;
};

export interface ICharacterResponseDto {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  sex: string | null;
  nationality: string | null;
  phone: string | null;
  biography: string | null;
  avatarUrl: string | null;
  status: string;
  rank: { id: string; name: string; slug: string } | null;
  rankLabel: string | null;
  department: string | null;
  fivemCitizenId: string | null;
  joinedAt: string | null;
  roles: string[];
  occupations: Array<{
    id: string;
    type: string;
    organization: string;
    establishmentId: string | null;
    position: string | null;
    isPrimary: boolean;
    isActive: boolean;
  }>;
  primaryOccupation: {
    type: string;
    organization: string;
    establishmentId: string | null;
    position: string | null;
  } | null;
  staffProfile: {
    id: string;
    employeeNumber: string;
    status: string;
    callsign: string | null;
    rankId: string | null;
    departmentId: string | null;
    rankLabel: string | null;
    departmentName: string | null;
    departmentImageUrl: string | null;
    joinedAt: string | null;
    decorations: Array<{
      id: string;
      awardedAt: string | null;
      notes: string | null;
      decoration: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
      };
    }>;
    licenses: Array<{
      id: string;
      assignedAt: string | null;
      notes: string | null;
      license: {
        id: string;
        code: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
      };
    }>;
    departments: Array<{
      id: string;
      role: string;
      isPrimary: boolean;
      assignedAt: string | null;
      department: {
        id: string;
        name: string;
        slug: string;
        imageUrl: string | null;
      };
    }>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export function toCharacterResponseDto(
  character: CharacterWithRelations,
  roleSlugs?: string[],
): ICharacterResponseDto {
  const roles =
    roleSlugs ?? character.roles?.map((item) => item.role.slug) ?? [];

  const occupations = (character.occupations ?? [])
    .filter((item) => item.isActive)
    .map((item) => ({
      id: item.id,
      type: item.type,
      organization: item.organization,
      establishmentId: item.establishmentId ?? null,
      position: item.position,
      isPrimary: item.isPrimary,
      isActive: item.isActive,
    }));

  const primaryOccupation =
    occupations.find((item) => item.isPrimary) ?? occupations[0] ?? null;

  const officerRankLabel =
    character.staffProfile?.rank?.name ?? character.rank?.name ?? null;
  const departmentName = character.staffProfile?.department?.name ?? null;
  const departmentImageUrl = character.staffProfile?.department?.imageUrl ?? null;

  return {
    id: character.id,
    accountId: character.accountId,
    firstName: character.firstName,
    lastName: character.lastName,
    birthDate: toDateOnly(character.birthDate),
    sex: character.sex,
    nationality: character.nationality,
    phone: character.phone ?? null,
    biography: character.biography ?? null,
    avatarUrl: character.avatarUrl,
    status: character.status,
    rank: character.rank
      ? {
          id: character.rank.id,
          name: character.rank.name,
          slug: character.rank.slug,
        }
      : character.staffProfile?.rank
        ? {
            id: character.staffProfile.rank.id,
            name: character.staffProfile.rank.name,
            slug: character.staffProfile.rank.slug,
          }
        : null,
    rankLabel: officerRankLabel,
    department: departmentName,
    fivemCitizenId: character.fivemCitizenId,
    joinedAt: toDateOnly(character.joinedAt),
    roles,
    occupations,
    primaryOccupation: primaryOccupation
      ? {
          type: primaryOccupation.type,
          organization: primaryOccupation.organization,
          establishmentId: primaryOccupation.establishmentId,
          position: primaryOccupation.position,
        }
      : null,
    staffProfile: character.staffProfile
      ? {
          id: character.staffProfile.id,
          employeeNumber: character.staffProfile.employeeNumber,
          status: character.staffProfile.status,
          callsign: character.staffProfile.callsign,
          rankId: character.staffProfile.rankId,
          departmentId: character.staffProfile.departmentId,
          rankLabel: officerRankLabel,
          departmentName,
          departmentImageUrl,
          joinedAt: toDateOnly(character.staffProfile.joinedAt),
          decorations: (character.staffProfile.decorations ?? []).map((item) => ({
            id: item.id,
            awardedAt: toDateOnly(item.awardedAt),
            notes: item.notes,
            decoration: {
              id: item.decoration.id,
              name: item.decoration.name,
              description: item.decoration.description,
              imageUrl: item.decoration.imageUrl,
            },
          })),
          licenses: (character.staffProfile.licenses ?? []).map((item) => ({
            id: item.id,
            assignedAt: toDateOnly(item.assignedAt),
            notes: item.notes,
            license: {
              id: item.license.id,
              code: item.license.code,
              name: item.license.name,
              description: item.license.description,
              imageUrl: item.license.imageUrl,
            },
          })),
          departments: (character.staffProfile.departmentMemberships ?? []).map((item) => ({
            id: item.id,
            role: item.role,
            isPrimary: item.isPrimary,
            assignedAt: toDateOnly(item.assignedAt),
            department: {
              id: item.department.id,
              name: item.department.name,
              slug: item.department.slug,
              imageUrl: item.department.imageUrl,
            },
          })),
        }
      : null,
    createdAt: character.createdAt.toISOString(),
    updatedAt: character.updatedAt.toISOString(),
  };
}

function toDateOnly(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}
