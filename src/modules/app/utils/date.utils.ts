export function formatEtaShort(
  input: string | Date | null | undefined
): string {
  if (!input) return "pronto";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "pronto";

  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());

  if (sameDay) return `hoy ${hour}:${minute}`;
  if (isTomorrow) return `mañana ${hour}:${minute}`;

  const msDiff = d.getTime() - now.getTime();
  const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  if (daysDiff >= 2 && daysDiff < 7) {
    const days = [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ];
    return `${days[d.getDay()]} ${hour}:${minute}`;
  }

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}/${month}/${year} ${hour}:${minute}`;
}
