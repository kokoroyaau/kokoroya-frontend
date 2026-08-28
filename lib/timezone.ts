// The business (and every clock-in kiosk) operates in Sydney/Melbourne time,
// but this app can be viewed from any browser timezone (managers checking
// reports remotely) and the backend stores everything in UTC. These helpers
// are the single place that bridges the two: always compute/display in
// BUSINESS_TZ regardless of the viewer's machine, never the browser default.
export const BUSINESS_TZ = "Australia/Sydney";

function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - utcMs;
}

// Converts a wall-clock time expressed in BUSINESS_TZ into the real UTC
// instant it corresponds to.
export function sydneyWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMs = timeZoneOffsetMs(guessUtcMs, BUSINESS_TZ);
  return new Date(guessUtcMs - offsetMs);
}

export function formatSydneyTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    timeZone: BUSINESS_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "HH:MM" (24h) for a native <input type="time">, always read in BUSINESS_TZ.
export function sydneyTimeOfDay(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}
