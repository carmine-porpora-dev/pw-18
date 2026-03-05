import { NextResponse } from "next/server";
import { createTicket, listTickets } from "@/lib/server/ticket-store";

export const runtime = "nodejs";

export async function GET() {
  const tickets = await listTickets();
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

  const ticket = await createTicket(body.description.trim());
  return NextResponse.json(ticket, { status: 201 });
}
