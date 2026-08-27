"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { punch, updateClockEntry } from "@/api/clock";

export async function updateClockEntryAction(
  id: number,
  data: { clock_in_at: string; clock_out_at: string | null },
) {
  return updateClockEntry(id, data);
}

export async function punchAction(pin: string) {
  try {
    const data = await punch(pin);
    return { success: true as const, data };
  } catch (err) {
    // lib/api.ts calls redirect() on a stale/expired session (401), which
    // throws a NEXT_REDIRECT signal, not a real error — let it propagate so
    // Next can actually redirect, instead of showing "NEXT_REDIRECT" as the
    // punch error on the kiosk screen.
    if (isRedirectError(err)) throw err;
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Invalid PIN",
    };
  }
}
