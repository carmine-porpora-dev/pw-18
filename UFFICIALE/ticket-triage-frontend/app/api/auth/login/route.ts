import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/server/auth";
import { SESSION_COOKIE } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email e password obbligatorie" }, { status: 400 });
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    return new NextResponse("Credenziali non valide", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const res = NextResponse.json({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    group_id: user.group_id,
    group_name: user.group_name,
    is_super_admin: user.is_super_admin
  });
  res.cookies.set(SESSION_COOKIE, String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8
  });
  return res;
}
