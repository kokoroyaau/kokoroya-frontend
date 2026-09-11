"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserData } from "@/schema/user/user.schema";
import type { BranchData } from "@/schema/branch/branch.schema";
import { EmployeeRow } from "./employee-row";

export function EmployeeList({
  employees,
  pages,
  branches,
}: {
  employees: UserData[];
  pages: string[];
  branches: BranchData[];
}) {
  // Default to the first branch ever created (branches is already ordered
  // by id — see branch.Repository.List).
  const [branchId, setBranchId] = useState(branches[0]?.id ?? null);

  const filtered = branchId
    ? employees.filter((e) => e.branch_ids?.includes(branchId))
    : employees;

  return (
    <div className="flex flex-col gap-4">
      {branches.length > 0 && (
        <Select
          value={String(branchId)}
          onValueChange={(v) => setBranchId(Number(v))}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select branch">
              {branches.find((b) => b.id === branchId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground">No employees in this branch.</p>
        )}
        {filtered.map((e) => (
          <EmployeeRow key={e.id} employee={e} pages={pages} branches={branches} />
        ))}
      </div>
    </div>
  );
}
