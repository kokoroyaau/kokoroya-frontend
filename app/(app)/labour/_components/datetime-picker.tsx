"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sydneyTimeOfDay, sydneyWallTimeToUtc } from "@/lib/timezone";

/**
 * Time-only editor for a clock entry. The calendar day is fixed to the
 * entry's `date` (the "Date" column, already resolved server-side in
 * business time) — only the time-of-day can be changed. The value typed is
 * always interpreted as Australia/Sydney wall-clock time (where the shift
 * physically happened), regardless of which timezone the person editing it
 * (e.g. an owner travelling abroad) is currently browsing from.
 * `value: null` renders empty (used for an open clock-out).
 */
export function TimeInput({
  date,
  value,
  onChange,
  placeholder = "open",
  className,
}: {
  date: string;
  value: string | null;
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [year, month, day] = date.split("-").map(Number);

  return (
    <Input
      type="time"
      placeholder={placeholder}
      className={cn("h-8 w-28", className)}
      value={value ? sydneyTimeOfDay(value) : ""}
      onChange={(e) => {
        if (!e.target.value) return;
        const [hour, minute] = e.target.value.split(":").map(Number);
        onChange(sydneyWallTimeToUtc(year, month, day, hour, minute).toISOString());
      }}
    />
  );
}
