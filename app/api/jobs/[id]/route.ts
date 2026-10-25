import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";
import { getEscrowBalance } from "@/lib/trustless-server";

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  const { id } = await ctx.params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  let balance: number | null = null;
  if (job.contractId) balance = await getEscrowBalance(job.contractId).catch(() => null);

  return NextResponse.json({ ...job, balance });
}
