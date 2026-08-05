/**
 * Resolve primary vs alternate department memberships for an officer profile.
 * Supports StaffProfile (departmentMemberships) and character DTO (departments).
 */

const ROLE_LABELS = {
  MEMBER: 'Miembro',
  LEAD: 'Encargado',
  SUPERVISOR: 'Supervisor',
};

export function getDepartmentRoleLabel(role) {
  return ROLE_LABELS[role] ?? role ?? 'Miembro';
}

export function getOfficerMemberships(officer) {
  const fromProfile = officer?.departmentMemberships;
  const fromDto = officer?.departments ?? officer?.staffProfile?.departments;
  const rows = Array.isArray(fromProfile)
    ? fromProfile
    : Array.isArray(fromDto)
      ? fromDto
      : [];

  return rows
    .filter((row) => row && row.isActive !== false)
    .map((row) => {
      const department = row.department ?? null;
      return {
        id: row.id,
        departmentId: row.departmentId ?? department?.id ?? null,
        role: row.role ?? 'MEMBER',
        isPrimary: Boolean(row.isPrimary),
        assignedAt: row.assignedAt ?? null,
        name: department?.name ?? row.departmentName ?? null,
        slug: department?.slug ?? null,
        imageUrl: department?.imageUrl ?? row.departmentImageUrl ?? null,
        department,
      };
    })
    .filter((row) => row.name);
}

/**
 * @returns {{ primary: object | null, alternates: object[], primaryName: string | null, primaryImageUrl: string | null }}
 */
export function resolveStaffDepartments(officer) {
  const memberships = getOfficerMemberships(officer);
  let primary = memberships.find((row) => row.isPrimary) ?? null;

  if (!primary && officer?.department?.name) {
    primary = {
      id: null,
      departmentId: officer.departmentId ?? officer.department?.id ?? null,
      role: 'MEMBER',
      isPrimary: true,
      name: officer.department.name,
      imageUrl: officer.department.imageUrl ?? null,
      department: officer.department,
    };
  }

  if (!primary && (officer?.departmentName || officer?.staffProfile?.departmentName)) {
    primary = {
      id: null,
      departmentId: officer.departmentId ?? officer?.staffProfile?.departmentId ?? null,
      role: 'MEMBER',
      isPrimary: true,
      name: officer.departmentName ?? officer.staffProfile.departmentName,
      imageUrl: officer.departmentImageUrl ?? officer?.staffProfile?.departmentImageUrl ?? null,
      department: null,
    };
  }

  if (!primary && memberships.length) {
    primary = memberships[0];
  }

  const alternates = memberships.filter((row) => {
    if (!primary) {
      return true;
    }
    if (row.id && primary.id) {
      return row.id !== primary.id;
    }
    return row.departmentId !== primary.departmentId;
  });

  return {
    primary,
    alternates,
    primaryName: primary?.name ?? null,
    primaryImageUrl: primary?.imageUrl ?? null,
    primaryRole: primary?.role ?? null,
  };
}
