import { NextResponse } from "next/server";
import { getTicketById } from "@/lib/server/ticket-store";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ticket = await getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}
