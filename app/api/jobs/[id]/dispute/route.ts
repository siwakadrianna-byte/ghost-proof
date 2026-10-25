import { NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/jobs";
import { resolveJob } from "@/lib/resolve";

/**
 * Designer answers the client's dispute proposal:
 * - "accept": Ghost-Proof settles on-chain with the client's proposed split
 * - "escalate": Ghost-Proof (the resolver) will decide
 */
export async function POST(request: Request, ctx: RouteContext<"/api/jobs/[id]/dispute">) {
  const { id } = await ctx.params;
  const { action, designerAddress } = await request.json();
  const job = await getJob(id);

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "disputed" || !job.dispute || job.ghostClaim)
    return NextResponse.json({ error: "There's no open dispute on this job." }, { status: 400 });
  if (designerAddress !== job.designerAddress)
    return NextResponse.json({ error: "Only the designer can answer the dispute." }, { status: 403 });

  if (action === "escalate") {
    const updated = await updateJob(id, (j) => {
      j.dispute!.escalated = true;
      j.events.push({ type: "escalated", at: new Date().toISOString() });
    });
    return NextResponse.json(updated);
  }

  try {
    const pct = job.dispute.proposedDesignerPercent;
    const updated = await resolveJob(job, pct, `Designer accepted: ${pct}% designer / ${100 - pct}% refund to client`);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
