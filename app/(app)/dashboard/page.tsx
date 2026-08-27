import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, canAccess } from "@/lib/user";
import { getMyBranchesAction } from "@/lib/actions/branch";
import { DashboardView } from "./_components/dashboard-view";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!canAccess(user, "dashboard")) redirect("/");

  const branches = await getMyBranchesAction();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Sales, purchase and labour at a glance.</p>
        </div>
        {branches.length > 1 && (
          <Link href="/dashboard/all" className="text-sm text-primary hover:underline">
            View all branches →
          </Link>
        )}
      </div>
      <DashboardView />
    </div>
  );
}
