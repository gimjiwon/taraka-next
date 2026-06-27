import type { Kuji, ResultItem, Ticket } from "@/types/takara";

export const demoKujis: Kuji[] = [
  {
    id: "onepiece",
    slug: "onepiece",
    title: "원피스 기어5 스페셜 쿠지",
    description: "루피 기어5 피규어와 굿즈가 포함된 TAKARA 샘플 쿠지입니다.",
    price: 12000,
    totalTickets: 100,
    soldTickets: 42,
    status: "active"
  },
  {
    id: "bluearchive",
    slug: "bluearchive",
    title: "블루 아카이브 굿즈 쿠지",
    description: "아크릴 스탠드, 키링, 카드형 굿즈가 포함된 샘플 쿠지입니다.",
    price: 10000,
    totalTickets: 80,
    soldTickets: 18,
    status: "active"
  },
  {
    id: "random",
    slug: "random",
    title: "캐릭터 랜덤 굿즈 쿠지",
    description: "소형 피규어와 문구류를 섞은 샘플 쿠지입니다.",
    price: 8000,
    totalTickets: 60,
    soldTickets: 9,
    status: "active"
  }
];

export function getDemoKuji(id: string) {
  return demoKujis.find((kuji) => kuji.id === id || kuji.slug === id) ?? demoKujis[0];
}

export function getDemoTickets(kujiId: string): Ticket[] {
  return Array.from({ length: 100 }, (_, index) => {
    const ticketNo = index + 1;
    const sold = ticketNo % 11 === 0 || ticketNo % 17 === 0;
    const locked = ticketNo % 23 === 0;
    return {
      id: `${kujiId}-${ticketNo}`,
      kujiId,
      ticketNo,
      status: sold ? "sold" : locked ? "locked" : "available"
    };
  });
}

export const demoResults: ResultItem[] = [
  { ticketNo: 12, rank: "A", prizeName: "메인 피규어" },
  { ticketNo: 27, rank: "C", prizeName: "아크릴 키링" },
  { ticketNo: 44, rank: "D", prizeName: "스티커 세트" }
];
