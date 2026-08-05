/**
 * Whether the active character already belongs to the SAED
 * (officer profile or cadet/officer status).
 */
export function isSaedMember(character) {
  if (!character) {
    return false;
  }

  return Boolean(
    character.staffProfile ||
      character.status === 'INTERN' ||
      character.status === 'MEDICAL_STAFF',
  );
}

/** Civilians (and non-SAED characters) may submit academy applications. */
export function canSubmitAcademyApplication(character) {
  return Boolean(character) && !isSaedMember(character);
}

/** Cadet portal attendance actions — never staff/managers. */
export function isCadetCharacter(character) {
  if (!character) {
    return false;
  }

  if (character.status === 'INTERN') {
    return true;
  }

  const roles = character.roles ?? [];
  return roles.includes('cadet') || roles.some((role) => role === 'cadet' || role?.slug === 'cadet');
}
