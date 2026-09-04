import { WEEKDAYS, type Copa, type Order } from "../types";

const JS_DAY_TO_WEEKDAY: Record<number, (typeof WEEKDAYS)[number]> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

function floorToSlot(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const flooredMin = m < 30 ? 0 : 30;
  return `${String(h).padStart(2, "0")}:${String(flooredMin).padStart(2, "0")}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = ((h * 60 + m + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function ordersInSlot(copaId: string, date: string, slot: string, orders: Order[]): number {
  return orders.filter((o) => {
    if (o.copaId !== copaId || o.status === "Cancelado") return false;
    const [oDate, oTime] = (o.datetime ?? "").split(" ");
    return oDate === date && !!oTime && floorToSlot(oTime) === slot;
  }).length;
}

function isOperatingAt(copa: Copa, date: string, slot: string): boolean {
  if (copa.nonBusinessDays.includes(date)) return false;
  const weekday = JS_DAY_TO_WEEKDAY[new Date(date + "T00:00:00").getDay()];
  const hours = copa.operatingHours.find((h) => h.weekday === weekday);
  return !!hours && hours.enabled && slot >= hours.start && slot < hours.end;
}

export interface CopaSlotStatus {
  full: boolean;
  nextAvailable?: { date: string; time: string };
}

/** Verifica se a Copa está no limite de capacidade (capacityPer30min) no horário escolhido e,
 * se estiver, procura o próximo horário de funcionamento com vaga (até 14 dias à frente). */
export function copaSlotStatus(copa: Copa, date: string, time: string, orders: Order[]): CopaSlotStatus {
  if (!date || !time) return { full: false };
  const slot = floorToSlot(time);
  if (ordersInSlot(copa.id, date, slot, orders) < copa.capacityPer30min) return { full: false };

  let curDate = date;
  let curSlot = slot;
  for (let i = 0; i < 14 * 48; i++) {
    curSlot = addMinutes(curSlot, 30);
    if (curSlot === "00:00") curDate = addDays(curDate, 1);
    if (!isOperatingAt(copa, curDate, curSlot)) continue;
    if (ordersInSlot(copa.id, curDate, curSlot, orders) < copa.capacityPer30min) {
      return { full: true, nextAvailable: { date: curDate, time: curSlot } };
    }
  }
  return { full: true };
}
