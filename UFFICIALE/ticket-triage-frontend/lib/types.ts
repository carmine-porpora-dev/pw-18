export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type Ticket = {
  id: string;
  description: string;
  created_at: string; // ISO
  status: TicketStatus;
  created_by_user_id?: number;
  assigned_group_id?: number | null;

  // campi triage ML
  category?: string;
  priority?: "low" | "medium" | "high" | "critical";
  AzioniFatteInPassato?: string;
  Top5?: string[];
};

export type CreateTicketInput = {
  description: string;
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
