export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  requester_email: string;
  created_at: string; // ISO
  status: TicketStatus;

  // campi triage ML (ritornati dal backend)
  predicted_category?: string;
  predicted_priority?: "low" | "medium" | "high" | "critical";
  confidence?: number; // 0..1
};

export type CreateTicketInput = {
  title: string;
  description: string;
  requester_email: string;
};

export type DashboardSummary = {
  last_30_days: {
    opened_count: number;
    open_now_count: number;
    resolved_count: number;
  };
  opened_trend: Array<{ date: string; opened: number }>;
  by_category: Array<{ category: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
};