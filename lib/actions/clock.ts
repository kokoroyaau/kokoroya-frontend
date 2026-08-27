"use server";

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
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Invalid PIN",
    };
  }
}
