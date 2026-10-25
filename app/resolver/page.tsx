"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Job } from "@/lib/jobs";

// Ghost-Proof's dispute desk: decide disputes the designer and client couldn't agree on.
export default function ResolverPage() {
  const [passcode, setPasscode] = useState("");
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [split, setSplit] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch(`/api/resolver?passcode=${encodeURIComponent(passcode)}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setJobs(data);
  }

  async function decide(job: Job) {
    setBusy(job.id);
    setError(null);
    const res = await fetch("/api/resolver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode, jobId: job.id, designerPercent: split[job.id] ?? job.dispute?.proposedDesignerPercent ?? 50 }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setError(data.error);
    load();
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <header>
        <Link href="/" className="text-2xl font-bold">Ghost-Proof</Link>
        <p className="text-muted-foreground">Dispute desk: Ghost-Proof decides the fair split.</p>
      </header>

      {jobs === null ? (
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <Input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Resolver passcode" />
          <Button type="submit">Open</Button>
        </form>
      ) : jobs.length === 0 ? (
        <p>No disputes waiting. 🎉 <button className="underline" onClick={load}>Refresh</button></p>
      ) : (
        jobs.map((job) => {
          const pct = split[job.id] ?? job.dispute?.proposedDesignerPercent ?? 50;
          return (
            <section key={job.id} className="rounded-xl border p-6 space-y-3">
              <div className="flex justify-between gap-2">
                <Link href={`/job/${job.id}`} className="font-semibold underline">{job.title}</Link>
                <span>{job.price} USDC</span>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm">
                Client: &ldquo;{job.dispute?.reason}&rdquo; (proposed {job.dispute?.proposedDesignerPercent}% to designer)
                {job.dispute?.escalated && <div className="mt-1">Designer disagreed and asked Ghost-Proof to decide.</div>}
              </div>
              <p>Designer gets <b>{pct}%</b>, client gets <b>{100 - pct}%</b> back</p>
              <input type="range" min={0} max={100} step={5} value={pct} className="w-full"
                onChange={(e) => setSplit({ ...split, [job.id]: Number(e.target.value) })} />
              <Button className="w-full" onClick={() => decide(job)} disabled={!!busy}>
                {busy === job.id ? "Settling on Stellar…" : "Decide & settle on-chain"}
              </Button>
            </section>
          );
        })
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
