import { NextResponse } from "next/server";
import { getTicketById, getTicketByIdForGroup } from "@/lib/server/ticket-store";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { id } = await context.params;
  let ticket = null;
  if (user.is_super_admin === 1) {
    ticket = await getTicketById(id);
  } else if (typeof user.group_id === "number") {
    ticket = await getTicketByIdForGroup(id, user.group_id);
  } else {
    return NextResponse.json({ error: "Utente senza gruppo associato" }, { status: 403 });
  }
  if (!ticket) {
    return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}
