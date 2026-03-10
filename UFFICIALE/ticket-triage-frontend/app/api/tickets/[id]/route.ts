import { NextResponse } from "next/server";
import { getTicketById, getTicketByIdVisibleToUser } from "@/lib/server/ticket-store";
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
