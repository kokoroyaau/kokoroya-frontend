import { useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { sydneyTimeOfDay, sydneyWallTimeToUtc } from "@/lib/timezone";

const COMMIT_DELAY_MS = 500;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));


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
  const [hour, minute] = value ? sydneyTimeOfDay(value).split(":") : [null, null];
  const [pending, setPending] = useState<{ hour: string; minute: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayHour = pending?.hour ?? hour;
  const displayMinute = pending?.minute ?? minute;

  // Hour and minute are separate selects; debounce so picking both only
  // fires one onChange/save instead of one per select.
  function commit(nextHour: string | null, nextMinute: string | null) {
    if (nextHour === null || nextMinute === null) return;
    setPending({ hour: nextHour, minute: nextMinute });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(
        sydneyWallTimeToUtc(year, month, day, Number(nextHour), Number(nextMinute)).toISOString(),
      );
      setPending(null);
    }, COMMIT_DELAY_MS);
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select value={displayHour ?? undefined} onValueChange={(h) => commit(h, displayMinute ?? "00")}>
        <SelectTrigger className="h-8 w-16">
          <SelectValue placeholder={placeholder === "open" ? "--" : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={displayMinute ?? undefined} onValueChange={(m) => commit(displayHour ?? "00", m)}>
        <SelectTrigger className="h-8 w-16">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
