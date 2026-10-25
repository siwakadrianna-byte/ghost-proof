"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WalletButton } from "@/components/tw-blocks/wallet-kit/WalletButtons";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobActions, type JobView } from "@/components/ghost/useJobActions";
import type { JobStatus } from "@/lib/jobs";

const EXPLORER = "https://stellar.expert/explorer/testnet";

const STATUS_TEXT: Record<JobStatus, { label: string; help: string }> = {
  awaiting_client: { label: "Waiting for client", help: "Send the link to your client so they can lock the payment." },
  awaiting_funding: { label: "Waiting for payment", help: "The escrow exists. The client needs to lock the money." },
  funded: { label: "Money locked 🔒", help: "The payment is safe in escrow. Time to deliver the work." },
  delivered: { label: "Delivered, in review", help: "The client can approve. If they stay silent, the Ghost Timer pays the designer." },
  approved: { label: "Approved", help: "The client approved. One more signature releases the money." },
  released: { label: "Paid ✅", help: "The money is in the designer's wallet." },
  disputed: { label: "In dispute ⚖️", help: "The Ghost Timer is paused while the split is agreed." },
  resolved: { label: "Resolved", help: "Ghost-Proof settled it on-chain." },
};

const EVENT_TEXT: Record<string, string> = {
  created: "Job created",
  escrow_created: "Escrow created on Stellar",
  funded: "Client locked the payment",
  delivered: "Designer delivered the work",
  approved: "Client approved",
  released: "Payment released to designer",
  disputed: "Dispute opened",
  escalated: "Designer asked Ghost-Proof to decide",
  ghost_claim: "👻 Ghost Timer ended, designer claimed payment",
  resolved: "Dispute resolved",
};

const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

function useCountdown(deadline?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!deadline) return null;
  const ms = Math.max(0, new Date(deadline).getTime() - now);
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { ms, text: d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}` };
}

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { walletAddress } = useWalletContext();
  const [job, setJob] = useState<JobView>();
  const [notFound, setNotFound] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [proposal, setProposal] = useState(50);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.status === 404) return setNotFound(true);
    setJob(await res.json());
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const actions = useJobActions(job, walletAddress, load);
  const countdown = useCountdown(job?.deadline);

  if (notFound) return <Shell><p>This job doesn&apos;t exist. Check the link.</p></Shell>;
  if (!job) return <Shell><p className="text-muted-foreground">Loading job…</p></Shell>;

  const isDesigner = walletAddress === job.designerAddress;
  const isClient = !!walletAddress && !isDesigner && (!job.clientAddress || walletAddress === job.clientAddress);
  const role = isDesigner ? "Designer" : isClient ? "Client" : walletAddress ? "Viewer" : null;
  const status = STATUS_TEXT[job.status];
  const timerDone = countdown && countdown.ms === 0;

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Shell>
      <div className="space-y-6">
        {/* Job summary */}
        <section className="rounded-xl border p-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{job.title}</h2>
              {job.description && <p className="text-muted-foreground mt-1">{job.description}</p>}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{job.price} USDC</div>
              {job.balance !== null && (
                <div className="text-sm text-muted-foreground">In escrow: {job.balance} USDC</div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>Designer: <span className="font-mono">{short(job.designerAddress)}</span></span>
            <span>Client: <span className="font-mono">{short(job.clientAddress)}</span></span>
            <span>Review window: {job.reviewMinutes} min</span>
            {role && <span>You are: <b className="text-foreground">{role}</b></span>}
          </div>
        </section>

        {/* Status + Ghost Timer */}
        <section className="rounded-xl border p-6 text-center space-y-2">
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Status</div>
          <div className="text-2xl font-bold">{status.label}</div>
          <p className="text-muted-foreground">{status.help}</p>
          {job.status === "delivered" && countdown && (
            <div className="pt-4">
              <div className="text-sm uppercase tracking-wide text-muted-foreground">Ghost Timer</div>
              <div className="text-6xl font-mono font-bold tabular-nums">{countdown.text}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {timerDone
                  ? "Time's up. The client stayed silent, so the designer can claim the payment."
                  : "If the client doesn't respond before this hits zero, silence counts as approval."}
              </p>
            </div>
          )}
        </section>

        {/* Delivered work */}
        {job.file && (
          <section className="rounded-xl border p-6 space-y-3">
            <h3 className="font-semibold">Delivered work</h3>
            {job.unlocked ? (
              <>
                <p className="text-sm text-muted-foreground">Paid, so the full-resolution file is unlocked. 🔓</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/jobs/${job.id}/download?inline=1`} alt="Delivered work" className="w-full rounded-lg border" />
                <a href={`/api/jobs/${job.id}/download`} className="block">
                  <Button className="w-full">Download full-resolution file</Button>
                </a>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Watermarked preview. The clean, full-resolution file unlocks when the designer is paid. 🔒
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/jobs/${job.id}/preview?v=${job.events.length}`} alt="Watermarked preview" className="w-full rounded-lg border" />
              </>
            )}
          </section>
        )}

        {/* Actions */}
        <section className="rounded-xl border p-6 space-y-4">
          {!walletAddress && <p>Connect your wallet (top right) to continue.</p>}

          {/* Designer: share the link */}
          {isDesigner && (job.status === "awaiting_client" || job.status === "awaiting_funding") && (
            <div className="space-y-2">
              <p className="font-medium">Send this link to your client:</p>
              <div className="flex gap-2">
                <Input readOnly value={typeof window !== "undefined" ? window.location.href : ""} />
                <Button variant="outline" onClick={copyLink}>{copied ? "Copied!" : "Copy"}</Button>
              </div>
            </div>
          )}

          {/* Client: lock the money */}
          {isClient && (job.status === "awaiting_client" || job.status === "awaiting_funding") && (
            <div className="space-y-2">
              <p>Lock the payment in escrow. The designer only gets it when you approve, or if you don&apos;t respond in time.</p>
              <Button className="w-full" onClick={actions.lockPayment} disabled={!!actions.busy}>
                {actions.busy === "lock" ? "Locking… check Freighter" : `Lock ${job.price} USDC in escrow`}
              </Button>
            </div>
          )}

          {/* Designer: deliver */}
          {isDesigner && job.status === "funded" && (
            <div className="space-y-2">
              <p className="font-medium">Deliver your work</p>
              <p className="text-sm">
                Final file (PNG, JPG or WebP). The client only sees a watermarked preview until you&apos;re paid.
              </p>
              {/* Drop zone: drag an image from Finder, or click to open the file picker */}
              <label
                htmlFor="delivery-file"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) setFile(dropped);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
                  dragging ? "border-primary bg-accent" : "hover:bg-accent"
                }`}
              >
                {file ? (
                  <span className="font-medium">✓ {file.name}</span>
                ) : (
                  <span className="font-medium">Drag your image here</span>
                )}
                <span className="text-muted-foreground">
                  {file ? "Drop another file to replace it" : "or click to choose a file"}
                </span>
              </label>
              <input
                id="delivery-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Input
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="A note for the client (e.g. Final logo, v3)"
              />
              <Button className="w-full" onClick={() => actions.deliver(evidence || "Delivered", file)} disabled={!!actions.busy || !file}>
                {actions.busy === "deliver" ? "Delivering… check Freighter" : "Mark as delivered & start Ghost Timer"}
              </Button>
            </div>
          )}

          {/* Client: approve & pay */}
          {isClient && (job.status === "delivered" || job.status === "approved") && (
            <div className="space-y-2">
              <p>Happy with the work? Approve to pay the designer. You&apos;ll sign twice: approve, then release.</p>
              <Button className="w-full" onClick={actions.approveAndPay} disabled={!!actions.busy}>
                {actions.busy === "approve" ? "Paying… check Freighter" : `Approve & pay ${job.price} USDC`}
              </Button>
            </div>
          )}

          {/* Client: raise a dispute (only while the Ghost Timer is running) */}
          {isClient && job.status === "delivered" && !timerDone && (
            <div className="space-y-3 border-t pt-4">
              {!disputeOpen ? (
                <Button variant="outline" className="w-full" onClick={() => setDisputeOpen(true)}>
                  Not happy? Raise a dispute
                </Button>
              ) : (
                <>
                  <p className="font-medium">What went wrong? (one sentence)</p>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Only 1 of the 3 logo variations was delivered."
                  />
                  <p className="font-medium">
                    Fair split: designer gets <b>{proposal}%</b> ({((job.price * proposal) / 100).toFixed(2)} USDC), you get{" "}
                    <b>{100 - proposal}%</b> back
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={proposal}
                    onChange={(e) => setProposal(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setDisputeOpen(false)}>Cancel</Button>
                    <Button
                      className="flex-1"
                      onClick={() => actions.dispute(reason, proposal)}
                      disabled={!reason.trim() || !!actions.busy}
                    >
                      {actions.busy === "dispute" ? "Opening dispute… check Freighter" : "Open dispute & pause the timer"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dispute in progress */}
          {job.status === "disputed" && job.dispute && !job.ghostClaim && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-4 space-y-1">
                <p className="text-sm text-muted-foreground">Client says:</p>
                <p className="font-medium">&ldquo;{job.dispute.reason}&rdquo;</p>
                <p className="text-sm">
                  Proposed split: designer <b>{job.dispute.proposedDesignerPercent}%</b> · client refund{" "}
                  <b>{100 - job.dispute.proposedDesignerPercent}%</b>
                </p>
              </div>
              {job.dispute.escalated ? (
                <p>The designer didn&apos;t agree, so Ghost-Proof is reviewing the work and will decide the fair split.</p>
              ) : isDesigner ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1" onClick={() => actions.answerDispute("accept")} disabled={!!actions.busy}>
                    {actions.busy === "accept" ? "Settling…" : `Accept ${job.dispute.proposedDesignerPercent}%`}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => actions.answerDispute("escalate")} disabled={!!actions.busy}>
                    Disagree, let Ghost-Proof decide
                  </Button>
                </div>
              ) : (
                <p>Waiting for the designer to accept your proposal.</p>
              )}
            </div>
          )}

          {job.status === "resolved" && !job.ghostClaim && job.resolution && (
            <p className="text-lg font-semibold">
              Settled: designer received {job.resolution.designerPercent}%, client refunded {100 - job.resolution.designerPercent}%.
            </p>
          )}

          {/* Designer: Ghost Timer claim */}
          {isDesigner && (job.status === "delivered" || (job.status === "disputed" && job.ghostClaim)) && (
            <div className="space-y-2">
              {timerDone ? (
                <p>The client went silent. Silence = yes, so you can claim your payment now.</p>
              ) : (
                <p>Waiting for the client to review. If they ghost you, you can claim when the timer hits zero.</p>
              )}
              <Button className="w-full" onClick={actions.claimPayment} disabled={!timerDone || !!actions.busy}>
                {actions.busy === "claim"
                  ? "Claiming… check Freighter"
                  : timerDone
                    ? `👻 Claim ${job.price} USDC`
                    : "Claim payment unlocks when the Ghost Timer ends"}
              </Button>
            </div>
          )}

          {/* Waiting states */}
          {isClient && job.status === "funded" && <p>Your payment is locked. Waiting for the designer to deliver.</p>}
          {job.status === "released" && <p className="text-lg font-semibold">All done. The designer has been paid. 🎉</p>}
          {job.status === "resolved" && job.ghostClaim && (
            <p className="text-lg font-semibold">The client ghosted, but the designer got paid anyway. 👻💸</p>
          )}

          {actions.error && <p className="text-sm text-destructive">{actions.error}</p>}
        </section>

        {/* On-chain proof */}
        <section className="rounded-xl border p-6 space-y-3">
          <h3 className="font-semibold">On-chain proof</h3>
          {job.contractId && (
            <a className="text-sm underline" href={`${EXPLORER}/contract/${job.contractId}`} target="_blank" rel="noreferrer">
              View the escrow contract on Stellar Expert ↗
            </a>
          )}
          <ul className="space-y-2 text-sm">
            {job.events.map((e, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2">
                <span>{EVENT_TEXT[e.type] ?? e.type}{e.note ? `: "${e.note}"` : ""}</span>
                <span className="text-muted-foreground">
                  {new Date(e.at).toLocaleTimeString()}
                  {e.txHash && (
                    <>
                      {" · "}
                      <a className="underline" href={`${EXPLORER}/tx/${e.txHash}`} target="_blank" rel="noreferrer">
                        transaction ↗
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="text-2xl font-bold">Ghost-Proof</Link>
        <WalletButton />
      </header>
      {children}
    </div>
  );
}
