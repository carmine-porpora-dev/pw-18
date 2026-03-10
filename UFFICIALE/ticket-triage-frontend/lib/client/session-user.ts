"use client";

export type ClientSessionUser = {
  id: number;
  email: string;
  display_name: string;
  group_id: number | null;
  group_name: string | null;
  is_super_admin: number;
};

let cachedUser: ClientSessionUser | null = null;
let pendingUserRequest: Promise<ClientSessionUser | null> | null = null;

export async function getCachedSessionUser(forceRefresh = false) {
  if (!forceRefresh) {
    if (cachedUser) return cachedUser;

    if (pendingUserRequest) return pendingUserRequest;
  }

  pendingUserRequest = fetch("/api/auth/me", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) {
        cachedUser = null;
        return null;
      }

      const user = (await res.json()) as ClientSessionUser;
      cachedUser = user;
      return user;
    })
    .finally(() => {
      pendingUserRequest = null;
    });

  return pendingUserRequest;
}

export function clearCachedSessionUser() {
  cachedUser = null;
  pendingUserRequest = null;
}
