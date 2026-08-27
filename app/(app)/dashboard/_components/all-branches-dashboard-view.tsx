"use client";

import { useQueries } from "@tanstack/react-query";
import { getReportAction } from "@/lib/actions/foodcost";
import { getLabourReportAction } from "@/lib/actions/labour";
import { mondayOf, isoDate, addDays } from "@/lib/date";
import type { BranchData } from "@/schema/branch/branch.schema";

function money(amount: number) {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AllBranchesDashboardView({ branches }: { branches: BranchData[] }) {
  const monday = mondayOf(new Date());
  const weekStartDate = isoDate(monday);
  const weekEndDate = isoDate(addDays(monday, 6));

  const foodCostQueries = useQueries({
    queries: branches.map((branch) => ({
      queryKey: ["food-cost-report", weekStartDate, branch.id],
      queryFn: () => getReportAction(weekStartDate, weekEndDate, branch.id),
    })),
  });
  const labourQueries = useQueries({
    queries: branches.map((branch) => ({
      queryKey: ["labour-report", weekStartDate, branch.id],
      queryFn: () => getLabourReportAction(weekStartDate, weekEndDate, branch.id),
    })),
  });

  const isLoading =
    foodCostQueries.some((q) => q.isLoading) || labourQueries.some((q) => q.isLoading);
  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  const rows = branches.map((branch, i) => {
    const foodCost = foodCostQueries[i].data;
    const labour = labourQueries[i].data;
    const grossSales = foodCost?.gross_sales_total ?? 0;
    const netSales = foodCost?.net_sales ?? 0;
    const labourTotal = labour?.labour_total ?? 0;
    return {
      branch,
      grossSales,
      netSales,
      labourTotal,
      labourPct: netSales > 0 ? (labourTotal / netSales) * 100 : 0,
    };
  });

  const totalGross = rows.reduce((a, r) => a + r.grossSales, 0);
  const totalNet = rows.reduce((a, r) => a + r.netSales, 0);
  const totalLabour = rows.reduce((a, r) => a + r.labourTotal, 0);
  const totalLabourPct = totalNet > 0 ? (totalLabour / totalNet) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Gross Sales" value={`$${money(totalGross)}`} />
        <StatCard label="Net Sales" value={`$${money(totalNet)}`} />
        <StatCard label="Labour Cost" value={`$${money(totalLabour)}`} />
        <StatCard label="Labour Cost %" value={`${totalLabourPct.toFixed(2)}%`} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <th className="p-3 font-medium">Branch</th>
              <th className="p-3 text-right font-medium">Gross Sales</th>
              <th className="p-3 text-right font-medium">Net Sales</th>
              <th className="p-3 text-right font-medium">Labour Cost</th>
              <th className="p-3 text-right font-medium">Labour %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.branch.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{row.branch.name}</td>
                <td className="p-3 text-right">${money(row.grossSales)}</td>
                <td className="p-3 text-right">${money(row.netSales)}</td>
                <td className="p-3 text-right">${money(row.labourTotal)}</td>
                <td className="p-3 text-right">{row.labourPct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
