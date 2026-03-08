export const SESSION_COOKIE = "helpdesk_session";

export function parseSessionUserId(raw: string | undefined) {
  if (!raw) return null;
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
