import { NextResponse } from "next/server";
import { getTicketByIdForGroup } from "@/lib/server/ticket-store";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  if (typeof user.group_id !== "number") {
    return NextResponse.json({ error: "Utente senza gruppo associato" }, { status: 403 });
  }

  const { id } = await context.params;
  const ticket = await getTicketByIdForGroup(id, user.group_id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}
