import { NextResponse } from "next/server";
import { getJob, updateJob, type JobStatus } from "@/lib/jobs";

// After a wallet-signed action succeeds on-chain, the page reports it here so we can track status.
const NEXT_STATUS: Record<string, JobStatus> = {
  funded: "funded",
  delivered: "delivered",
  approved: "approved",
  released: "released",
  disputed: "disputed",
};

export async function POST(request: Request, ctx: RouteContext<"/api/jobs/[id]/event">) {
  const { id } = await ctx.params;
  const { type, txHash, note } = await request.json();
  if (!NEXT_STATUS[type]) return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  if (!(await getJob(id))) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const job = await updateJob(id, (j) => {
    const now = new Date();
    j.status = NEXT_STATUS[type];
    j.events.push({ type, at: now.toISOString(), txHash, note });
    if (type === "delivered") {
      // Start the Ghost Timer
      j.deliveredAt = now.toISOString();
      j.deadline = new Date(now.getTime() + j.reviewMinutes * 60_000).toISOString();
    }
  });
  return NextResponse.json(job);
}
