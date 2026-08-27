"use server";

import {
  getReport,
  upsertPurchaseEntry,
  upsertGrossSales,
  upsertNetSalesRate,
  getSuppliers,
  createSupplier,
  deleteSupplier,
} from "@/api/foodcost";

export async function getReportAction(startDate: string, endDate: string, branchId?: number) {
  return getReport(startDate, endDate, branchId);
}

export async function upsertPurchaseEntryAction(data: {
  supplier_id: number;
  purchase_date: string;
  amount: number;
}) {
  return upsertPurchaseEntry(data);
}

export async function upsertGrossSalesAction(data: {
  sales_date: string;
  amount: number;
}) {
  return upsertGrossSales(data);
}

export async function upsertNetSalesRateAction(data: {
  week_start_date: string;
  rate: number;
}) {
  return upsertNetSalesRate(data);
}

export async function getSuppliersAction() {
  return getSuppliers();
}

export async function createSupplierAction(name: string) {
  return createSupplier(name);
}

export async function deleteSupplierAction(id: number) {
  return deleteSupplier(id);
}
