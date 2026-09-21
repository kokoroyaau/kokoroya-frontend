"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { punch, updateClockEntry, createClockEntry, deleteClockEntry } from "@/api/clock";

export async function updateClockEntryAction(
  id: number,
  data: { clock_in_at: string; clock_out_at: string | null },
) {
  return updateClockEntry(id, data);
}

export async function createClockEntryAction(data: {
  user_id: number;
  clock_in_at: string;
  clock_out_at: string | null;
}) {
  return createClockEntry(data);
}

export async function deleteClockEntryAction(id: number) {
  return deleteClockEntry(id);
}

export async function punchAction(pin: string) {
  try {
    const data = await punch(pin);
    return { success: true as const, data };
  } catch (err) {
    
    
    
    
    if (isRedirectError(err)) throw err;
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Invalid PIN",
    };
  }
}
