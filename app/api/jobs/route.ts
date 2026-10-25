import { NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { createJob } from "@/lib/jobs";

// Designer creates a job
export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const price = Number(body.price);
  const reviewMinutes = Number(body.reviewMinutes);
  const designerAddress = String(body.designerAddress || "");

  if (!title) return NextResponse.json({ error: "Give the job a title." }, { status: 400 });
  if (!(price > 0)) return NextResponse.json({ error: "Price must be more than 0 USDC." }, { status: 400 });
  if (!(reviewMinutes > 0)) return NextResponse.json({ error: "Review window must be at least 1 minute." }, { status: 400 });
  if (!StrKey.isValidEd25519PublicKey(designerAddress))
    return NextResponse.json({ error: "Connect your wallet first." }, { status: 400 });

  const job = await createJob({ title, description, price, reviewMinutes, designerAddress });
  return NextResponse.json(job);
}
