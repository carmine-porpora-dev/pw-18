import { NextResponse } from "next/server";
import { getDashboardSummary, getDashboardSummaryForGroup } from "@/lib/server/ticket-store";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  if (user.is_super_admin === 1) {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary);
  }
  if (typeof user.group_id !== "number") {
    return NextResponse.json({ error: "Utente senza gruppo associato" }, { status: 403 });
  }

  const summary = await getDashboardSummaryForGroup(user.group_id);
  return NextResponse.json(summary);
}
