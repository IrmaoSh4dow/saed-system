/**
 * Whether the active character already belongs to the SAED
 * (staff profile or intern/medical staff status).
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

/** Intern portal attendance actions — never managers. */
export function isCadetCharacter(character) {
  return isInternCharacter(character);
}

export function isInternCharacter(character) {
  if (!character) {
    return false;
  }

  if (character.status === 'INTERN') {
    return true;
  }

  const roles = character.roles ?? [];
  return roles.some((role) => role === 'intern' || role?.slug === 'intern');
}
