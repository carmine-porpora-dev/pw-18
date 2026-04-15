import { NextResponse } from "next/server";
import { getTicketById, getTicketByIdVisibleToUser, resolveTicket } from "@/lib/server/ticket-store";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";

function sanitizeTicketForViewer(
  ticket: Awaited<ReturnType<typeof getTicketById>>,
  user: Awaited<ReturnType<typeof getSessionUser>>
) {
  if (!ticket || !user || user.is_super_admin === 1) {
    return ticket;
  }

  const isCreatorOnlyView =
    ticket.created_by_user_id === user.id && ticket.assigned_group_id !== user.group_id;

  if (!isCreatorOnlyView) {
    return ticket;
  }

  return {
    ...ticket,
    AzioniFatteInPassato: undefined,
    Top5: []
  };
}

function canResolveTicket(
  ticket: NonNullable<Awaited<ReturnType<typeof getTicketById>>>,
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>
) {
  if (user.is_super_admin === 1) {
    return true;
  }

  if (ticket.status === "closed") {
    return false;
  }

  if (ticket.assigned_user_id != null) {
    return ticket.assigned_user_id === user.id;
  }

  return typeof user.group_id === "number" && ticket.assigned_group_id === user.group_id;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { id } = await context.params;
  let ticket = null;
  if (user.is_super_admin === 1) {
    ticket = await getTicketById(id);
  } else {
    ticket = await getTicketByIdVisibleToUser(id, user.id, user.group_id);
  }
  if (!ticket) {
    return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });
  }

  return NextResponse.json(sanitizeTicketForViewer(ticket, user));
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  let body: { closure_reason?: unknown; actions_taken?: unknown };
  try {
    body = (await req.json()) as { closure_reason?: unknown; actions_taken?: unknown };
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  const closureReason =
    typeof body.closure_reason === "string" ? body.closure_reason.trim() : "";
  const actionsTaken =
    typeof body.actions_taken === "string" ? body.actions_taken.trim() : "";

  if (!closureReason) {
    return NextResponse.json({ error: "La causale di chiusura e obbligatoria" }, { status: 400 });
  }

  if (!actionsTaken) {
    return NextResponse.json({ error: "Il campo azioni effettuate e obbligatorio" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { id } = await context.params;
  const ticket =
    user.is_super_admin === 1
      ? await getTicketById(id)
      : await getTicketByIdVisibleToUser(id, user.id, user.group_id);

  if (!ticket) {
    return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });
  }

  if (!canResolveTicket(ticket, user)) {
    return NextResponse.json(
      { error: "Solo l'utente assegnato puo chiudere il ticket" },
      { status: 403 }
    );
  }

  const updatedTicket = await resolveTicket(id, user.id, closureReason, actionsTaken);
  return NextResponse.json(updatedTicket);
}
