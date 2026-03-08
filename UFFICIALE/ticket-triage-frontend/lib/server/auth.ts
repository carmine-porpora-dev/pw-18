import { cookies } from "next/headers";
import { runDb } from "@/lib/server/db";
import { parseSessionUserId, SESSION_COOKIE } from "@/lib/server/session";

export type SessionUser = {
  id: number;
  email: string;
  display_name: string;
  group_id: number | null;
  group_name: string | null;
  is_super_admin: number;
  is_active: number;
};

export async function authenticateUser(email: string, password: string) {
  return runDb<SessionUser | null>("authenticate_user", { email, password });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  const userId = parseSessionUserId(raw);
  if (!userId) return null;
  return runDb<SessionUser | null>("get_user_by_id", { id: userId });
}
