import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { DeadlineTimer } from "@/components/DeadlineTimer";
import { TicketGrid } from "@/components/TicketGrid";
import { getActiveKujiWithTickets } from "@/lib/kujis";

export default async function NumberSelectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getActiveKujiWithTickets(id);
  if (!data) notFound();

  const { kuji, tickets } = data;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container">
          <div className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <span className="badge">TICKET SELECT</span>
              <h2>{kuji.title}</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted">남은 선택 시간</div>
              <div style={{ fontSize: 32 }}><DeadlineTimer seconds={180} /></div>
            </div>
          </div>
          <TicketGrid tickets={tickets} kujiSlug={kuji.slug} />
        </div>
      </main>
    </>
  );
}
