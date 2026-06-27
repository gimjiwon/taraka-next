export function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatTicketCount(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}장`;
}
