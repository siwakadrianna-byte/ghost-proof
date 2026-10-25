"use client";

import { useState } from "react";
import { Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  useApproveMilestone,
  useChangeMilestoneStatus,
  useFundEscrow,
  useReleaseFunds,
  useSendTransaction,
  useStartDispute,
} from "@trustless-work/escrow";
import { signTransaction } from "@/components/tw-blocks/wallet-kit/wallet-kit";
import { handleError, ErrorResponse } from "@/components/tw-blocks/handle-errors/handle";
import type { Job } from "@/lib/jobs";

export type JobView = Job & { balance: number | null };

/**
 * Every Ghost-Proof action follows the same pattern:
 * Trustless Work builds an unsigned transaction → Freighter signs it →
 * we submit it → we tell our server what happened (with the tx hash).
 */
export function useJobActions(job: JobView | undefined, wallet: string | null, onDone: () => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { fundEscrow } = useFundEscrow();
  const { changeMilestoneStatus } = useChangeMilestoneStatus();
  const { approveMilestone } = useApproveMilestone();
  const { releaseFunds } = useReleaseFunds();
  const { startDispute } = useStartDispute();
  const { sendTransaction } = useSendTransaction();

  async function signAndSend(unsignedTransaction?: string) {
    if (!unsignedTransaction) throw new Error("Trustless Work didn't return a transaction.");
    const signed = await signTransaction({ unsignedTransaction, address: wallet! });
    const res = await sendTransaction(signed);
    if (res.status !== "SUCCESS") throw new Error(res.message);
    const hash = TransactionBuilder.fromXDR(signed, Networks.TESTNET).hash();
    return Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function report(type: string, txHash?: string, note?: string) {
    await fetch(`/api/jobs/${job!.id}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, txHash, note }),
    });
  }

  async function run(label: string, fn: () => Promise<void>) {
    if (!job || !wallet) return;
    setBusy(label);
    setError(null);
    try {
      await fn();
      onDone();
    } catch (e) {
      setError(handleError(e as ErrorResponse).message || "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const contractId = job?.contractId ?? "";

  return {
    busy,
    error,

    /** Client: create the escrow (server, platform signs) then lock the money (client signs). */
    lockPayment: () =>
      run("lock", async () => {
        if (!job!.contractId) {
          const res = await fetch(`/api/jobs/${job!.id}/escrow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientAddress: wallet }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          job!.contractId = data.contractId;
        }
        const { unsignedTransaction } = await fundEscrow(
          { contractId: job!.contractId!, signer: wallet!, amount: job!.price },
          "single-release"
        );
        await report("funded", await signAndSend(unsignedTransaction));
      }),

    /** Designer: mark the work as delivered — this starts the Ghost Timer. */
    deliver: (evidence: string) =>
      run("deliver", async () => {
        const { unsignedTransaction } = await changeMilestoneStatus(
          {
            contractId,
            milestoneIndex: "0",
            newStatus: "Delivered",
            newEvidence: evidence,
            serviceProvider: wallet!,
          },
          "single-release"
        );
        await report("delivered", await signAndSend(unsignedTransaction));
      }),

    /** Client: approve the work and release the money to the designer (two signatures). */
    approveAndPay: () =>
      run("approve", async () => {
        if (job!.status !== "approved") {
          const { unsignedTransaction } = await approveMilestone(
            { contractId, milestoneIndex: "0", approver: wallet! },
            "single-release"
          );
          await report("approved", await signAndSend(unsignedTransaction));
        }
        const { unsignedTransaction } = await releaseFunds(
          { contractId, releaseSigner: wallet! },
          "single-release"
        );
        await report("released", await signAndSend(unsignedTransaction));
      }),

    /** Client or designer: open a dispute. */
    dispute: (note: string) =>
      run("dispute", async () => {
        const { unsignedTransaction } = await startDispute(
          { contractId, signer: wallet! },
          "single-release"
        );
        await report("disputed", await signAndSend(unsignedTransaction), note);
      }),
  };
}
