import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { sydneyTimeOfDay, sydneyWallTimeToUtc } from "@/lib/timezone";

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

  function commit(nextHour: string | null, nextMinute: string | null) {
    if (nextHour === null || nextMinute === null) return;
    onChange(
      sydneyWallTimeToUtc(year, month, day, Number(nextHour), Number(nextMinute)).toISOString(),
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select value={hour ?? undefined} onValueChange={(h) => commit(h, minute ?? "00")}>
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
      <Select value={minute ?? undefined} onValueChange={(m) => commit(hour ?? "00", m)}>
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
