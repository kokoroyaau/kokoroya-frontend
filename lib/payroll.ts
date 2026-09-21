


export const PAYG_RATE = 0.1248;
export const SUPER_RATE = 0.12;

const MS_PER_DAY = 86_400_000;










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
