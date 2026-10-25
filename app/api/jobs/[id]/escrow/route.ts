import { NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { getJob, updateJob } from "@/lib/jobs";
import { deployEscrow } from "@/lib/trustless-server";

// Client opened the link and connected their wallet: the platform deploys the escrow.
export async function POST(request: Request, ctx: RouteContext<"/api/jobs/[id]/escrow">) {
  const { id } = await ctx.params;
  const { clientAddress } = await request.json();
  const job = await getJob(id);

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.contractId) return NextResponse.json(job); // already deployed
  if (!StrKey.isValidEd25519PublicKey(clientAddress))
    return NextResponse.json({ error: "Connect your wallet first." }, { status: 400 });
  if (clientAddress === job.designerAddress)
    return NextResponse.json(
      { error: "That's the designer's wallet. Switch to the client's wallet in Freighter." },
      { status: 400 }
    );

  try {
    const result = await deployEscrow({ ...job, clientAddress });
    const updated = await updateJob(id, (j) => {
      j.clientAddress = clientAddress;
      j.contractId = result.contractId;
      j.status = "awaiting_funding";
      j.events.push({ type: "escrow_created", at: new Date().toISOString(), txHash: result.txHash });
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
