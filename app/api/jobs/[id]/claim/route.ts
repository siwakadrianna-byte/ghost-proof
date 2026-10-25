import { NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/jobs";
import { getEscrowBalance, resolveDispute } from "@/lib/trustless-server";

/**
 * Ghost Timer: the review window ended and the client stayed silent.
 * The designer has already opened a dispute on-chain (signed with their wallet).
 * Ghost-Proof, as dispute resolver, now sends 100% of the escrow to the designer.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/jobs/[id]/claim">) {
  const { id } = await ctx.params;
  const { disputeTxHash } = await request.json().catch(() => ({}));
  const job = await getJob(id);

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.contractId || !job.deadline)
    return NextResponse.json({ error: "This job hasn't been delivered yet." }, { status: 400 });
  if (Date.now() < new Date(job.deadline).getTime())
    return NextResponse.json({ error: "The Ghost Timer hasn't finished yet." }, { status: 400 });
  if (job.status !== "delivered" && !(job.status === "disputed" && job.ghostClaim))
    return NextResponse.json({ error: "This job can't be claimed right now." }, { status: 400 });

  // Record the on-chain dispute the designer just opened
  if (job.status === "delivered") {
    await updateJob(id, (j) => {
      j.status = "disputed";
      j.ghostClaim = true;
      j.events.push({
        type: "ghost_claim",
        at: new Date().toISOString(),
        txHash: disputeTxHash,
        note: "Client didn't respond before the Ghost Timer ended",
      });
    });
  }

  try {
    const balance = await getEscrowBalance(job.contractId);
    const result = await resolveDispute(job.contractId, [
      { address: job.designerAddress, amount: balance },
    ]);
    const updated = await updateJob(id, (j) => {
      j.status = "resolved";
      j.resolution = { designerPercent: 100 };
      j.events.push({
        type: "resolved",
        at: new Date().toISOString(),
        txHash: result.txHash,
        note: "Silence = yes. 100% paid to the designer",
      });
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
