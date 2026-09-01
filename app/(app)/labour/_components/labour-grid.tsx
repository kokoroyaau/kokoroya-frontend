"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { upsertHourEntryAction, upsertPaySplitAction } from "@/lib/actions/labour";
import { shortDayLabel, mondayOf, isoDate } from "@/lib/date";
import { NumericInput } from "@/app/(app)/_components/numeric-input";
import type { LabourWeeklyReportData } from "@/schema/labour/labour.schema";
import { HourInput } from "./hour-input";
import { ShiftEntriesTooltip } from "./shift-entries-tooltip";

export function LabourGrid({
  dates,
  report,
  queryKey,
  refetch,
}: {
  dates: string[];
  report: LabourWeeklyReportData;
  queryKey: QueryKey;
  refetch: () => void;
}) {
  const queryClient = useQueryClient();

  const { mutate: saveEntry } = useMutation({
    mutationFn: upsertHourEntryAction,
    onMutate: (variables) => {
      queryClient.setQueryData<LabourWeeklyReportData | undefined>(
        queryKey,
        (old) => {
          if (!old) return old;
          const employees = old.employees.map((e) => {
            if (e.user_id !== variables.user_id) return e;
            const daily = {
              ...e.daily_hours,
              [variables.entry_date]: variables.total_hours,
            };
            const total = Object.values(daily).reduce((a, b) => a + b, 0);
            return { ...e, daily_hours: daily, total_hours: total };
          });
          const weekTotal = employees.reduce((a, e) => a + e.total_hours, 0);
          const withPct = employees.map((e) => ({
            ...e,
            percentage_of_all: weekTotal > 0 ? (e.total_hours / weekTotal) * 100 : 0,
          }));
          return { ...old, employees: withPct };
        },
      );
    },
    onError: () => {
      toast.error("Failed to save hours");
      refetch();
    },
    // Labour cost depends on a per-employee/weekly rate resolution chain
    // that lives server-side — refetch instead of duplicating that logic
    // in an optimistic recompute, so labour_daily/labour_total stay correct.
    onSuccess: () => {
      refetch();
    },
  });

  const { mutate: saveSplit } = useMutation({
    mutationFn: upsertPaySplitAction,
    onError: () => toast.error("Failed to save pay split"),
    onSuccess: () => refetch(),
  });

  const weekStartDate = isoDate(mondayOf(new Date(`${report.start_date}T00:00:00`)));

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left">
            <th className="p-3 font-medium">Employee</th>
            {dates.map((date) => (
              <th key={date} className="p-3 text-right font-medium">
                {shortDayLabel(date)}
              </th>
            ))}
            <th className="p-3 text-right font-medium">Total</th>
            <th className="p-3 text-right font-medium">%</th>
            <th className="p-3 text-right font-medium">Weekday (paid)</th>
            <th className="p-3 text-right font-medium">Weekend (paid)</th>
            <th className="p-3 text-right font-medium">Cash</th>
            <th className="p-3 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {report.employees.length === 0 && (
            <tr>
              <td colSpan={dates.length + 6} className="text-muted-foreground p-4 text-center">
                No employees in this branch.
              </td>
            </tr>
          )}
          {report.employees.map((employee) => (
            <tr key={employee.user_id} className="border-b border-border/60">
              <td className="p-3 font-medium">{employee.name}</td>
              {dates.map((date) => (
                <td key={date} className="p-3 text-right">
                  <ShiftEntriesTooltip shifts={employee.daily_shifts[date] || []}>
                    <HourInput
                      value={employee.daily_hours[date] || 0}
                      onSave={(hours) =>
                        saveEntry({
                          user_id: employee.user_id,
                          entry_date: date,
                          total_hours: hours,
                        })
                      }
                    />
                  </ShiftEntriesTooltip>
                </td>
              ))}
              <td className="p-3 text-right font-medium">
                {employee.total_hours.toFixed(2)}h
              </td>
              <td className="p-3 text-right">
                {employee.percentage_of_all.toFixed(1)}%
              </td>
              <td className="p-3 text-right">
                <NumericInput
                  value={
                    employee.pay_split_weekday ?? employee.hour_cap_weekday ?? employee.weekday.hours
                  }
                  onSave={(weekday_hours) =>
                    saveSplit({
                      user_id: employee.user_id,
                      week_start_date: weekStartDate,
                      weekday_hours,
                      weekend_hours:
                        employee.pay_split_weekend ??
                        employee.hour_cap_weekend ??
                        employee.saturday.hours + employee.sunday.hours,
                    })
                  }
                  className="w-20 text-right"
                />
              </td>
              <td className="p-3 text-right">
                <NumericInput
                  value={
                    employee.pay_split_weekend ??
                    employee.hour_cap_weekend ??
                    employee.saturday.hours + employee.sunday.hours
                  }
                  onSave={(weekend_hours) =>
                    saveSplit({
                      user_id: employee.user_id,
                      week_start_date: weekStartDate,
                      weekday_hours:
                        employee.pay_split_weekday ?? employee.hour_cap_weekday ?? employee.weekday.hours,
                      weekend_hours,
                    })
                  }
                  className="w-20 text-right"
                />
              </td>
              <td className="p-3 text-right text-muted-foreground">
                {employee.cash_hours > 0 ? (
                  <>
                    {employee.cash_hours.toFixed(2)}h · $
                    {employee.cash_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3 text-right font-medium">
                {employee.gross_pay.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
