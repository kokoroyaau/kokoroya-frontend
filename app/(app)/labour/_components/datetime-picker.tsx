"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timeOf(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function combine(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return next;
}

/**
 * shadcn-style date + time picker: a Calendar popover for the date and a
 * native time input for the time, combined into a single Date on change.
 * `value: null` renders as empty/placeholder (used for an open clock-out).
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("justify-start font-normal", !value && "text-muted-foreground", className)}
          >
            <CalendarIcon />
            {value
              ? `${value.toLocaleDateString()} ${timeOf(value)}`
              : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(combine(date, value ? timeOf(value) : "00:00"));
          }}
        />
        <div className="flex items-center gap-2 border-t border-border/60 p-2.5">
          <Input
            type="time"
            className="h-8"
            value={value ? timeOf(value) : ""}
            onChange={(e) => {
              if (!e.target.value) return;
              onChange(combine(value ?? new Date(), e.target.value));
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
