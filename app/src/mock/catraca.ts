import type { CatracaEffectiveStatus, CatracaRedemption } from "../types";

/** Janela de tolerância para o check-out do cliente antes de virar "perda". */
export const CATRACA_LOSS_WINDOW_MS = 60 * 60 * 1000;

/**
 * "Perda" nunca é persistida — é sempre recalculada a partir de checkInAt/checkOutAt,
 * então o status mostrado é sempre correto mesmo que ninguém tenha "passado" pra fechar o registro.
 */
export function catracaEffectiveStatus(r: CatracaRedemption): CatracaEffectiveStatus {
  if (r.status === "Check-in realizado" && r.checkInAt && !r.checkOutAt) {
    const elapsed = Date.now() - new Date(r.checkInAt).getTime();
    if (elapsed > CATRACA_LOSS_WINDOW_MS) return "Perda";
  }
  return r.status;
}

export function catracaCheckInDeadline(r: CatracaRedemption): Date | null {
  if (!r.checkInAt) return null;
  return new Date(new Date(r.checkInAt).getTime() + CATRACA_LOSS_WINDOW_MS);
}
