// Server-only: settle a disputed job on-chain as the Ghost-Proof dispute resolver.
import { updateJob, type Job } from "./jobs";
import { getEscrowBalance, resolveDispute } from "./trustless-server";

export async function resolveJob(job: Job, designerPercent: number, note: string) {
  const balance = await getEscrowBalance(job.contractId!);
  const designerAmount = Math.round(balance * designerPercent * 100000) / 10000000;
  const clientAmount = Math.round((balance - designerAmount) * 10000000) / 10000000;

  const distributions = [
    { address: job.designerAddress, amount: designerAmount },
    { address: job.clientAddress!, amount: clientAmount },
  ].filter((d) => d.amount > 0);

  const result = await resolveDispute(job.contractId!, distributions);
  return updateJob(job.id, (j) => {
    j.status = "resolved";
    j.resolution = { designerPercent };
    j.events.push({ type: "resolved", at: new Date().toISOString(), txHash: result.txHash, note });
  });
}
