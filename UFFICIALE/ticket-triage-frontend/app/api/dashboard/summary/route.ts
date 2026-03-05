import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/server/ticket-store";

export const runtime = "nodejs";

export async function GET() {
  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
