"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getReportAction } from "@/lib/actions/foodcost";
import { getLabourReportAction } from "@/lib/actions/labour";
import { mondayOf, isoDate, addDays } from "@/lib/date";
import { useDateRange } from "@/app/(app)/_components/use-date-range";
import { DateRangePicker } from "@/app/(app)/_components/date-range-picker";
import { Button } from "@/components/ui/button";
import { PurchaseRatioChart } from "@/app/(app)/food-cost/_components/purchase-ratio-chart";
import { SalesTrendChart } from "./sales-trend-chart";
import { CostRatioChart } from "./cost-ratio-chart";

const WEEKS_BACK = 8;

function formatWeekLabel(weekStartDate: string) {
  const d = new Date(`${weekStartDate}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function money(amount: number) {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function DashboardView() {
  const { from, to, startDate, endDate, dates, setRange } = useDateRange();
  const spanDays = dates.length;

  function shiftRange(direction: -1 | 1) {
    setRange(addDays(from, spanDays * direction), addDays(to, spanDays * direction));
  }

  const thisMonday = mondayOf(new Date());
  const weekStartDates = Array.from({ length: WEEKS_BACK }, (_, i) =>
    isoDate(addDays(thisMonday, -(WEEKS_BACK - 1 - i) * 7)),
  );

  const foodCostQueries = useQueries({
    queries: weekStartDates.map((week) => ({
      queryKey: ["food-cost-report", week],
      queryFn: () => getReportAction(week, isoDate(addDays(new Date(`${week}T00:00:00`), 6))),
    })),
  });
  const labourQueries = useQueries({
    queries: weekStartDates.map((week) => ({
      queryKey: ["labour-report", week],
      queryFn: () => getLabourReportAction(week, isoDate(addDays(new Date(`${week}T00:00:00`), 6))),
    })),
  });

  const { data: selectedWeek, isLoading: selectedFoodCostLoading } = useQuery({
    queryKey: ["food-cost-report", startDate, endDate],
    queryFn: () => getReportAction(startDate, endDate),
  });
  const { data: selectedWeekLabour, isLoading: selectedLabourLoading } = useQuery({
    queryKey: ["labour-report", startDate, endDate],
    queryFn: () => getLabourReportAction(startDate, endDate),
  });

  const isLoading =
    foodCostQueries.some((q) => q.isLoading) ||
    labourQueries.some((q) => q.isLoading) ||
    selectedFoodCostLoading ||
    selectedLabourLoading;
  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  const salesData = weekStartDates.map((week, i) => ({
    week: formatWeekLabel(week),
    gross: foodCostQueries[i].data?.gross_sales_total ?? 0,
    net: foodCostQueries[i].data?.net_sales ?? 0,
  }));

  const ratioData = weekStartDates.map((week, i) => ({
    week: formatWeekLabel(week),
    purchase: foodCostQueries[i].data?.purchase_ratio_pct ?? 0,
    labour: (() => {
      const netSales = foodCostQueries[i].data?.net_sales ?? 0;
      const labourTotal = labourQueries[i].data?.labour_total ?? 0;
      return netSales > 0 ? (labourTotal / netSales) * 100 : 0;
    })(),
  }));

  const selectedWeekLabourPct =
    selectedWeek && selectedWeek.net_sales > 0 && selectedWeekLabour
      ? (selectedWeekLabour.labour_total / selectedWeek.net_sales) * 100
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="brutal" size="icon" type="button" onClick={() => shiftRange(-1)}>
          <ChevronLeft />
        </Button>
        <DateRangePicker from={from} to={to} onChange={setRange} />
        <Button variant="brutal" size="icon" type="button" onClick={() => shiftRange(1)}>
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Gross Sales" value={`$${money(selectedWeek?.gross_sales_total ?? 0)}`} />
        <StatCard label="Net Sales" value={`$${money(selectedWeek?.net_sales ?? 0)}`} />
        <StatCard label="Purchase Ratio" value={`${(selectedWeek?.purchase_ratio_pct ?? 0).toFixed(1)}%`} />
        <StatCard label="Labour Cost %" value={`${selectedWeekLabourPct.toFixed(2)}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesTrendChart data={salesData} />
        <CostRatioChart data={ratioData} />
      </div>

      {selectedWeek && (
        <div className="max-w-md">
          <PurchaseRatioChart suppliers={selectedWeek.suppliers} />
        </div>
      )}
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
