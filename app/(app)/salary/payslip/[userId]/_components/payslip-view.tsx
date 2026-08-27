"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalaryReportAction } from "@/lib/actions/labour";
import { PAYG_RATE, SUPER_RATE, payslipNumber } from "@/lib/payroll";
import { Button } from "@/components/ui/button";
import type { PayBreakdown } from "@/schema/labour/labour.schema";

function money(amount: number) {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date) {
  return date
    .toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "2-digit" })
    .replace(/ /g, "-");
}

function PayLine({ label, breakdown }: { label: string; breakdown: PayBreakdown }) {
  if (breakdown.hours <= 0) return null;
  return (
    <tr>
      <td className="p-2">{label}</td>
      <td className="p-2 text-right">{breakdown.hours.toFixed(2)}</td>
      <td className="p-2 text-right">${breakdown.rate.toFixed(2)}</td>
      <td className="p-2 text-right">${money(breakdown.total)}</td>
    </tr>
  );
}

export function PayslipView({
  userId,
  startDate,
  endDate,
  branchName,
}: {
  userId: number;
  startDate: string;
  endDate: string;
  branchName: string;
}) {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ["salary-report", startDate, endDate],
    queryFn: () => getSalaryReportAction(startDate, endDate),
  });

  if (isLoading) return <p className="text-muted-foreground p-6">Loading...</p>;
  if (error) {
    return <p className="text-destructive p-6">Failed to load payslip: {error.message}</p>;
  }
  const employee = report?.employees.find((e) => e.user_id === userId);
  if (!employee) return <p className="text-muted-foreground p-6">Employee not found.</p>;

  const payg = employee.gross_pay * PAYG_RATE;
  const netPay = employee.gross_pay - payg;
  const superAmount = employee.gross_pay * SUPER_RATE;

  const periodFrom = new Date(`${startDate}T00:00:00`);
  const periodTo = new Date(`${endDate}T00:00:00`);
  const employerLine = [employee.employer_name, branchName && `(${branchName.toUpperCase()})`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex justify-end print:hidden">
        <Button onClick={() => window.print()}>Print Payslip</Button>
      </div>

      <div className="rounded-2xl border-2 border-foreground p-6 text-sm print:border-black">
        <div className="text-center">
          <h1 className="text-lg font-bold">{employerLine || "—"}</h1>
          {employee.employer_abn && (
            <p className="text-xs">ABN: {employee.employer_abn}</p>
          )}
        </div>

        <table className="mt-4 w-full border-collapse text-xs">
          <tbody>
            <tr className="border-y border-border">
              <td className="border-r border-border p-2 font-medium">Date of Payment:</td>
              <td className="p-2">{formatDate(new Date())}</td>
              <td className="border-x border-border p-2 font-medium">Payslip No.</td>
              <td className="p-2">{payslipNumber(periodFrom, periodTo)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="border-r border-border p-2 font-medium">Pay Period From:</td>
              <td className="p-2">{formatDate(periodFrom)}</td>
              <td className="border-x border-border p-2 font-medium">To:</td>
              <td className="p-2">{formatDate(periodTo)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="border-r border-border p-2 font-medium" colSpan={1}>
                Employee&apos;s Name:
              </td>
              <td className="p-2" colSpan={3}>
                {employee.name}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-2 font-medium">Entitlements</th>
              <th className="p-2 text-right font-medium">Unit (hrs)</th>
              <th className="p-2 text-right font-medium">Rate ($)</th>
              <th className="p-2 text-right font-medium">Total ($)</th>
            </tr>
          </thead>
          <tbody>
            <PayLine label="Wages for ordinary hours worked (Weekday)" breakdown={employee.weekday} />
            <PayLine label="Wages for ordinary hours worked (Sat)" breakdown={employee.saturday} />
            <PayLine label="Wages for ordinary hours worked (Sun)" breakdown={employee.sunday} />
            <tr className="border-t border-border font-semibold">
              <td className="p-2" colSpan={3}>
                Gross Payment
              </td>
              <td className="p-2 text-right">${money(employee.gross_pay)}</td>
            </tr>
            <tr>
              <td className="p-2" colSpan={3}>
                Taxation (PAYG)
              </td>
              <td className="p-2 text-right">${money(payg)}</td>
            </tr>
            <tr className="border-t border-border font-semibold">
              <td className="p-2" colSpan={3}>
                Net Payment
              </td>
              <td className="p-2 text-right">${money(netPay)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-2 flex justify-between border-t border-border p-2 text-xs">
          <span className="font-medium">Employer Superannuation Contribution</span>
          <span>${money(superAmount)}</span>
        </div>

        <div className="mt-4 border-t border-border pt-2 text-[10px] leading-snug text-muted-foreground">
          <p className="font-medium">Confidentiality Policy</p>
          <p>
            The information provided in this document is intended solely for the employee
            addressed as per payslip and contains information that is confidential or subject to
            legal privilege. If you receive this document and you are not the addressee, please
            note that any copying, distribution or use of this document is prohibited and as
            such, please disregard the contents of the document, delete / destroy the document
            and notify the sender immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
