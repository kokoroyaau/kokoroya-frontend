import { BaseResponse } from "@/lib/api";

export interface PunchResponseData {
  action: "in" | "out";
  name: string;
  at: string;
  hours?: number;
}
export type PunchResponse = BaseResponse<PunchResponseData>;

export interface TimeEntryData {
  id: number;
  user_id: number;
  branch_id: number;
  clock_in_at: string;
  clock_out_at: string | null;
}
export type TimeEntryResponse = BaseResponse<TimeEntryData>;
