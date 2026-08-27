import { BaseResponse } from "@/lib/api";

export interface ShiftEntryInfo {
  id: number;
  clock_in_at: string;
  clock_out_at: string | null;
}

export interface PayBreakdown {
  hours: number;
  rate: number;
  total: number;
}

export interface EmployeeWeekRow {
  user_id: number;
  name: string;
  employer_name: string | null;
  employer_abn: string | null;
  daily_hours: Record<string, number>;
  daily_shifts: Record<string, ShiftEntryInfo[]>;
  weekday: PayBreakdown;
  saturday: PayBreakdown;
  sunday: PayBreakdown;
  total_hours: number;
  percentage_of_all: number;
  gross_pay: number;
}

export interface LabourDayInfo {
  staff_count: number;
  total_hours: number;
  labour_cost: number;
  is_weekend: boolean;
}

export interface LabourWeeklyReportData {
  start_date: string;
  end_date: string;
  employees: EmployeeWeekRow[];
  labour_daily: Record<string, LabourDayInfo>;
  labour_total: number;
  weekday_rate: number;
  weekend_rate: number;
}
export type LabourWeeklyReportResponse = BaseResponse<LabourWeeklyReportData>;
