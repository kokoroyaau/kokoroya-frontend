import { redirect } from "next/navigation";
import { getCurrentUser, canAccess } from "@/lib/user";
import { getMyBranches } from "@/api/branch";
import { getSelectedBranch } from "@/lib/auth";
import { PayslipView } from "./_components/payslip-view";

export default async function PayslipPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const user = await getCurrentUser();
  if (!canAccess(user, "salary")) redirect("/");

  const { userId } = await params;
  const { start, end } = await searchParams;
  if (!start || !end) redirect("/salary");

  const [branches, selectedBranchId] = await Promise.all([getMyBranches(), getSelectedBranch()]);
  const branchName = branches.find((b) => String(b.id) === selectedBranchId)?.name ?? "";

  return (
    <PayslipView userId={Number(userId)} startDate={start} endDate={end} branchName={branchName} />
  );
}
