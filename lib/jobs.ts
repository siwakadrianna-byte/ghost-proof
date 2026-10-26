// Server-only job store: one JSON document (data/jobs.json locally, Redis when deployed).
import crypto from "crypto";
import { readText, writeText } from "./store";

export type JobStatus =
  | "awaiting_client" // created by designer, no escrow yet
  | "awaiting_funding" // escrow deployed, client hasn't funded
  | "funded" // money locked, designer working
  | "delivered" // designer delivered, review window (Ghost Timer) running
  | "approved" // client approved, waiting for release
  | "released" // designer paid
  | "disputed"
  | "resolved";

export type JobEvent = {
  type: string;
  at: string;
  txHash?: string;
  note?: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  price: number; // USDC
  reviewMinutes: number; // Ghost Timer length after delivery
  designerAddress: string;
  clientAddress?: string;
  contractId?: string;
  status: JobStatus;
  deliveredAt?: string;
  deadline?: string; // ISO time when silence counts as approval
  ghostClaim?: boolean; // dispute was opened by the Ghost Timer, not by a disagreement
  resolution?: { designerPercent: number };
  dispute?: {
    reason: string;
    proposedDesignerPercent: number; // client's proposal
    escalated?: boolean; // designer rejected the proposal, Ghost-Proof decides
  };
  file?: { fileName: string; ext: string }; // delivered file (original + watermarked preview in data/uploads)
  events: JobEvent[];
  createdAt: string;
};

const KEY = "jobs.json";

async function readAll(): Promise<Record<string, Job>> {
  try {
    return JSON.parse((await readText(KEY)) || "{}");
  } catch {
    return {};
  }
}

async function writeAll(jobs: Record<string, Job>) {
  await writeText(KEY, JSON.stringify(jobs, null, 2));
}

export async function getJob(id: string) {
  return (await readAll())[id];
}

export async function createJob(
  input: Pick<Job, "title" | "description" | "price" | "reviewMinutes" | "designerAddress">
) {
  const jobs = await readAll();
  const job: Job = {
    ...input,
    id: crypto.randomBytes(5).toString("hex"),
    status: "awaiting_client",
    events: [{ type: "created", at: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  };
  jobs[job.id] = job;
  await writeAll(jobs);
  return job;
}

export async function updateJob(id: string, fn: (job: Job) => void) {
  const jobs = await readAll();
  const job = jobs[id];
  if (!job) return undefined;
  fn(job);
  await writeAll(jobs);
  return job;
}

export async function listJobs() {
  return Object.values(await readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
