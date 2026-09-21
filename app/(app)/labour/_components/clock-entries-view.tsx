"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLabourReportAction } from "@/lib/actions/labour";
import {
  updateClockEntryAction,
  createClockEntryAction,
  deleteClockEntryAction,
} from "@/lib/actions/clock";
import { addDays, isoDate } from "@/lib/date";
import { useDateRange } from "@/app/(app)/_components/use-date-range";
import { DateRangePicker } from "@/app/(app)/_components/date-range-picker";
import { DatePicker } from "@/app/(app)/_components/date-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeInput } from "./datetime-picker";

const ALL_EMPLOYEES = "all";

type FlatEntry = {
  id: number;
  userId: number;
  name: string;
  date: string;
  clockInAt: string;
  clockOutAt: string | null;
};

const QUARTER_HOUR_MS = 15 * 60_000;

function isValidRange(clockInAt: string, clockOutAt: string | null) {
  return !clockOutAt || new Date(clockOutAt) >= new Date(clockInAt);
}

function formatDuration(clockInAt: string, clockOutAt: string | null) {
  if (!clockOutAt) return "—";
  const rawMs =
    new Date(clockOutAt).getTime() - new Date(clockInAt).getTime();
  const roundedMs = Math.round(rawMs / QUARTER_HOUR_MS) * QUARTER_HOUR_MS;
  const hours = roundedMs / 3_600_000;
  return `${hours.toFixed(2)}h`;
}

export function ClockEntriesView() {
  const [employeeFilter, setEmployeeFilter] = useState(ALL_EMPLOYEES);
  const [newEntry, setNewEntry] = useState<{
    userId: string;
    date: string;
    clockInAt: string | null;
    clockOutAt: string | null;
  }>({ userId: "", date: isoDate(new Date()), clockInAt: null, clockOutAt: null });
  const queryClient = useQueryClient();
  const { from, to, startDate: weekStartDate, endDate: weekEndDate, setRange } = useDateRange();
  const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;

  function shiftRange(direction: -1 | 1) {
    setRange(addDays(from, spanDays * direction), addDays(to, spanDays * direction));
  }

  const queryKey = ["labour-report", weekStartDate, weekEndDate];
  const { data: report, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getLabourReportAction(weekStartDate, weekEndDate),
  });

  const { mutate: saveEntry } = useMutation({
    mutationFn: (vars: { id: number; clockInAt: string; clockOutAt: string | null }) =>
      updateClockEntryAction(vars.id, {
        clock_in_at: vars.clockInAt,
        clock_out_at: vars.clockOutAt,
      }),
    onError: () => toast.error("Failed to save clock entry"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate: removeEntry, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deleteClockEntryAction(id),
    onError: () => toast.error("Failed to delete clock entry"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate: addEntry, isPending: isAdding } = useMutation({
    mutationFn: () => {
      if (!isValidRange(newEntry.clockInAt!, newEntry.clockOutAt)) {
        throw new Error("Clock out must not be before clock in");
      }
      return createClockEntryAction({
        user_id: Number(newEntry.userId),
        clock_in_at: newEntry.clockInAt!,
        clock_out_at: newEntry.clockOutAt,
      });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to add clock entry"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewEntry({ userId: "", date: isoDate(new Date()), clockInAt: null, clockOutAt: null });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) {
    return (
      <p className="text-destructive">
        Failed to load clock entries: {error.message}
      </p>
    );
  }
  if (!report) return null;

  const employeeItems: Record<string, string> = {
    [ALL_EMPLOYEES]: "All employees",
    ...Object.fromEntries(report.employees.map((e) => [String(e.user_id), e.name])),
  };

  const entries: FlatEntry[] = report.employees
    .filter((employee) => employeeFilter === ALL_EMPLOYEES || String(employee.user_id) === employeeFilter)
    .flatMap((employee) =>
      Object.entries(employee.daily_shifts).flatMap(([date, shifts]) =>
        (shifts ?? []).map((shift) => ({
          id: shift.id,
          userId: employee.user_id,
          name: employee.name,
          date,
          clockInAt: shift.clock_in_at,
          clockOutAt: shift.clock_out_at,
        })),
      ),
    )
    .sort((a, b) => a.clockInAt.localeCompare(b.clockInAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="brutal" size="icon" type="button" onClick={() => shiftRange(-1)}>
            <ChevronLeft />
          </Button>
          <DateRangePicker from={from} to={to} onChange={setRange} />
          <Button variant="brutal" size="icon" type="button" onClick={() => shiftRange(1)}>
            <ChevronRight />
          </Button>
        </div>
        <Select
          items={employeeItems}
          value={employeeFilter}
          onValueChange={(v) => setEmployeeFilter(v ?? ALL_EMPLOYEES)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_EMPLOYEES}>All employees</SelectItem>
            {report.employees.map((employee) => (
              <SelectItem key={employee.user_id} value={String(employee.user_id)}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <th className="p-3 font-medium">Employee</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Clock In</th>
              <th className="p-3 font-medium">Clock Out</th>
              <th className="p-3 text-right font-medium">Duration</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground p-4 text-center">
                  No clock-in entries in this range.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{entry.name}</td>
                <td className="p-3">{entry.date}</td>
                <td className="p-3">
                  <TimeInput
                    date={entry.date}
                    value={entry.clockInAt}
                    onChange={(clockInAt) => {
                      if (clockInAt === entry.clockInAt) return;
                      if (!isValidRange(clockInAt, entry.clockOutAt)) {
                        toast.error("Clock in must not be after clock out");
                        return;
                      }
                      saveEntry({ id: entry.id, clockInAt, clockOutAt: entry.clockOutAt });
                    }}
                  />
                </td>
                <td className="p-3">
                  <TimeInput
                    date={entry.date}
                    value={entry.clockOutAt}
                    placeholder="open"
                    onChange={(clockOutAt) => {
                      if (clockOutAt === entry.clockOutAt) return;
                      if (!isValidRange(entry.clockInAt, clockOutAt)) {
                        toast.error("Clock out must not be before clock in");
                        return;
                      }
                      saveEntry({ id: entry.id, clockInAt: entry.clockInAt, clockOutAt });
                    }}
                  />
                </td>
                <td className="p-3 text-right">
                  {formatDuration(entry.clockInAt, entry.clockOutAt)}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={isDeleting}
                    onClick={() => removeEntry(entry.id)}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td className="p-3">
                <Select
                  items={employeeItems}
                  value={newEntry.userId}
                  onValueChange={(v) => setNewEntry((s) => ({ ...s, userId: v ?? "" }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {report.employees.map((employee) => (
                      <SelectItem key={employee.user_id} value={String(employee.user_id)}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-3">
                <DatePicker
                  value={new Date(`${newEntry.date}T00:00:00`)}
                  onChange={(date) =>
                    setNewEntry((s) => ({ ...s, date: isoDate(date), clockInAt: null, clockOutAt: null }))
                  }
                />
              </td>
              <td className="p-3">
                <TimeInput
                  date={newEntry.date}
                  value={newEntry.clockInAt}
                  onChange={(clockInAt) => setNewEntry((s) => ({ ...s, clockInAt }))}
                />
              </td>
              <td className="p-3">
                <TimeInput
                  date={newEntry.date}
                  value={newEntry.clockOutAt}
                  placeholder="open"
                  onChange={(clockOutAt) => setNewEntry((s) => ({ ...s, clockOutAt }))}
                />
              </td>
              <td className="p-3" />
              <td className="p-3 text-right">
                <Button
                  variant="brutal"
                  size="icon"
                  type="button"
                  disabled={isAdding || !newEntry.userId || !newEntry.clockInAt}
                  onClick={() => addEntry()}
                >
                  <Plus className="size-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
