// PAYG withholding and employer superannuation guarantee rates (AU).
// ponytail: flat rates, not a bracket table — revisit if PAYG needs to
// vary by income tier.
export const PAYG_RATE = 0.1248;
export const SUPER_RATE = 0.12;

const MS_PER_DAY = 86_400_000;

// payslipNumber assigns a sequence number for the pay period, counting
// fixed-length periods since the start of the Australian financial year
// (1 July) that contains periodStart. Formatted like "3(2026-2027)".
//
// ponytail: derived from dates, not a stored counter — assumes pay periods
// are the same length and run back-to-back from 1 July with no gaps. If
// that ever isn't true (a skipped period, a mid-year length change), this
// drifts from a "real" sequential payslip number. Upgrade path: persist an
// actual per-employee counter in the DB once that matters.
export function payslipNumber(periodStart: Date, periodEnd: Date): string {
  const fyStartYear =
    periodStart.getMonth() >= 6 ? periodStart.getFullYear() : periodStart.getFullYear() - 1;
  const fyStart = new Date(fyStartYear, 6, 1);

  const periodLengthDays =
    Math.round((periodEnd.getTime() - periodStart.getTime()) / MS_PER_DAY) + 1;
  const daysSinceFyStart = Math.round((periodStart.getTime() - fyStart.getTime()) / MS_PER_DAY);
  const number = Math.floor(daysSinceFyStart / periodLengthDays) + 1;

  return `${number}(${fyStartYear}-${fyStartYear + 1})`;
}
