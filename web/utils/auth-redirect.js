let pendingAuthRedirect = null;

export function setAuthRedirect(path) {
  pendingAuthRedirect = path;
}

/**
 * Consumes a redirect requested by auth guards during the current route handler.
 * Used by the router so redirects stay serial and do not race empty paints.
 */
export function takeAuthRedirect() {
  const path = pendingAuthRedirect;
  pendingAuthRedirect = null;
  return path;
}
