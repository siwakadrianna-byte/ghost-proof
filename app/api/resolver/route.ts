import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";
import { resolveJob } from "@/lib/resolve";
import { listJobs } from "@/lib/jobs";

// Ghost-Proof resolver: protected by a simple passcode from .env.local (demo only)
function allowed(passcode: unknown) {
  return !!process.env.RESOLVER_PASSCODE && passcode === process.env.RESOLVER_PASSCODE;
}

// List disputes waiting for a decision
export async function GET(request: Request) {
  const passcode = new URL(request.url).searchParams.get("passcode");
  if (!allowed(passcode)) return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  const jobs = (await listJobs()).filter((j) => j.status === "disputed" && !j.ghostClaim);
  return NextResponse.json(jobs);
}

// Decide a dispute
export async function POST(request: Request) {
  const { passcode, jobId, designerPercent } = await request.json();
  if (!allowed(passcode)) return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });

  const job = await getJob(jobId);
  if (!job || job.status !== "disputed")
    return NextResponse.json({ error: "No open dispute on that job." }, { status: 400 });

  const pct = Math.min(100, Math.max(0, Number(designerPercent)));
  try {
    const updated = await resolveJob(job, pct, `Ghost-Proof decided: ${pct}% designer / ${100 - pct}% refund to client`);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
