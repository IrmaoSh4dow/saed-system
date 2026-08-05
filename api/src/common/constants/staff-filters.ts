import { DepartmentMembershipRole, Prisma } from '@prisma/client';

/** Exclude system Administrator characters from operational SAED rosters. */
export const excludeSystemAdministrator: Prisma.StaffProfileWhereInput = {
  NOT: {
    character: {
      roles: {
        some: {
          role: { slug: 'administrator' },
        },
      },
    },
  },
};

export const excludeSystemAdministratorCharacter: Prisma.CharacterWhereInput = {
  NOT: {
    roles: {
      some: {
        role: { slug: 'administrator' },
      },
    },
  },
};

export const staffDepartmentInclude = {
  department: true,
} satisfies Prisma.StaffDepartmentInclude;

export function isDepartmentManagerRole(role: DepartmentMembershipRole): boolean {
  return role === DepartmentMembershipRole.LEAD || role === DepartmentMembershipRole.SUPERVISOR;
}
