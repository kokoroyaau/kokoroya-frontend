import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Keypad } from "./_components/keypad";
import { LiveClock } from "./_components/live-clock";

export default function ClockInPage() {
  return (
    <main className="bg-secondary-foreground relative flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <Link
        href="/"
        className="text-foreground hover:bg-muted absolute left-6 top-6 flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <LiveClock />
      <Keypad />
    </main>
  );
}
