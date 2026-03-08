import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    group_id: user.group_id
  });
}
