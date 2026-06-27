import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Kuji, KujiStatus, Ticket, TicketStatus } from "@/types/takara";

type KujiRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  total_tickets: number;
  status: KujiStatus;
  image_url: string | null;
  last_one_prize_name: string | null;
  created_at: string;
};

type TicketRow = {
  id: string;
  kuji_id: string;
  ticket_no: number;
  status: TicketStatus;
  prize_id: string | null;
};

export type AdminKujiRow = KujiRow & {
  sold_count: number;
};

function toPublicKuji(row: KujiRow, soldCount = 0): Kuji {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: row.price,
    totalTickets: row.total_tickets,
    soldTickets: soldCount,
    status: row.status,
    imageUrl: row.image_url
  };
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    kujiId: row.kuji_id,
    ticketNo: row.ticket_no,
    status: row.status,
    prizeId: row.prize_id
  };
}

async function getSoldCounts(kujiIds: string[]) {
  if (!kujiIds.length) return new Map<string, number>();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("kuji_tickets")
    .select("kuji_id")
    .in("kuji_id", kujiIds)
    .eq("status", "sold");

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.kuji_id, (counts.get(row.kuji_id) ?? 0) + 1);
  }

  return counts;
}

export async function getActiveKujis() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("kujis")
    .select("id, slug, title, description, price, total_tickets, status, image_url")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const soldCounts = await getSoldCounts(data.map((row) => row.id));
  return data.map((row) => toPublicKuji(row as KujiRow, soldCounts.get(row.id) ?? 0));
}

export async function getActiveKujiBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("kujis")
    .select("id, slug, title, description, price, total_tickets, status, image_url, last_one_prize_name")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;

  const soldCounts = await getSoldCounts([data.id]);
  return {
    kuji: toPublicKuji(data as KujiRow, soldCounts.get(data.id) ?? 0),
    lastOnePrizeName: data.last_one_prize_name as string | null
  };
}

export async function getActiveKujiWithTickets(slug: string) {
  const result = await getActiveKujiBySlug(slug);
  if (!result) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("kuji_tickets")
    .select("id, kuji_id, ticket_no, status, prize_id")
    .eq("kuji_id", result.kuji.id)
    .order("ticket_no", { ascending: true });

  return {
    ...result,
    tickets: (data ?? []).map((row) => toTicket(row as TicketRow))
  };
}

export async function getAdminKujis(): Promise<AdminKujiRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("kujis")
    .select("id, slug, title, description, price, total_tickets, status, image_url, last_one_prize_name, created_at")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const kujiIds = data.map((row) => row.id);
  const { data: soldRows } = await admin
    .from("kuji_tickets")
    .select("kuji_id")
    .in("kuji_id", kujiIds)
    .eq("status", "sold");

  const soldCounts = new Map<string, number>();
  for (const row of soldRows ?? []) {
    soldCounts.set(row.kuji_id, (soldCounts.get(row.kuji_id) ?? 0) + 1);
  }

  return data.map((row) => ({
    ...(row as KujiRow),
    sold_count: soldCounts.get(row.id) ?? 0
  }));
}
