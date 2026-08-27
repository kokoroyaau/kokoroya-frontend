import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, canAccess } from "@/lib/user";
import { getMyBranchesAction } from "@/lib/actions/branch";
import { AllBranchesDashboardView } from "../_components/all-branches-dashboard-view";

export default async function AllBranchesDashboardPage() {
  const user = await getCurrentUser();
  if (!canAccess(user, "dashboard")) redirect("/");

  const branches = await getMyBranchesAction();
  if (branches.length <= 1) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <div>
        <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold">All Branches</h1>
        <p className="text-muted-foreground mt-1">
          This week&apos;s sales and labour combined across every branch you have access to.
        </p>
      </div>
      <AllBranchesDashboardView branches={branches} />
    </div>
  );
}
