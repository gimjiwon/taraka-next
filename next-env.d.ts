export type KujiStatus = "draft" | "active" | "paused" | "ended";
export type TicketStatus = "available" | "locked" | "sold";
export type RevealMode = "ready" | "one_by_one" | "all_at_once" | "done";

export type Kuji = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  status: KujiStatus;
  imageUrl?: string | null;
};

export type Prize = {
  id: string;
  kujiId: string;
  rank: string;
  name: string;
  quantity: number;
  imageUrl?: string | null;
};

export type Ticket = {
  id: string;
  kujiId: string;
  ticketNo: number;
  status: TicketStatus;
  prizeId?: string | null;
};

export type ResultItem = {
  ticketNo: number;
  rank: string;
  prizeName: string;
  imageUrl?: string | null;
};
