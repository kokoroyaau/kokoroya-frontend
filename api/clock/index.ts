import { api } from "@/lib/api";
import type { PunchResponse, TimeEntryResponse } from "@/schema/clock/clock.schema";

export async function punch(pin: string) {
  const res = await api.post<PunchResponse>("/clock/punch", { pin });
  return res.data!;
}

export async function updateClockEntry(
  id: number,
  data: { clock_in_at: string; clock_out_at: string | null },
) {
  const res = await api.put<TimeEntryResponse>(`/clock/entries/${id}`, data);
  return res.data!;
}
