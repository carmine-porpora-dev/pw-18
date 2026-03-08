import { NextResponse } from "next/server";
import { createTicket, listTickets, listTicketsByGroup } from "@/lib/server/ticket-store";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  if (user.is_super_admin === 1) {
    const tickets = await listTickets();
    return NextResponse.json(tickets);
  }
  if (typeof user.group_id !== "number") {
    return NextResponse.json({ error: "Utente senza gruppo associato" }, { status: 403 });
  }

  const tickets = await listTicketsByGroup(user.group_id);
  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  let body: { description?: unknown };
  try {
    body = (await req.json()) as { description?: unknown };
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  if (typeof body.description !== "string" || body.description.trim().length < 10) {
    return NextResponse.json({ error: "Descrizione non valida (minimo 10 caratteri)" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const ticket = await createTicket(
    body.description.trim(),
    user.id,
    user.is_super_admin === 1 ? null : user.group_id
  );
  return NextResponse.json(ticket, { status: 201 });
}
