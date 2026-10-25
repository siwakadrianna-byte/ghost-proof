"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WalletButton } from "@/components/tw-blocks/wallet-kit/WalletButtons";
import { useWalletContext } from "@/components/tw-blocks/providers/WalletProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const router = useRouter();
  const { walletAddress } = useWalletContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("5");
  const [reviewMinutes, setReviewMinutes] = useState("2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        price: Number(price),
        reviewMinutes: Number(reviewMinutes),
        designerAddress: walletAddress,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error);
    router.push(`/job/${data.id}`);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold">Ghost-Proof</h1>
        <WalletButton />
      </header>

      <section className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Get paid, even if they ghost you.</h2>
        <p className="text-muted-foreground">
          Your client locks the money in a Stellar escrow before you deliver. If they approve, you
          get paid. If they go silent, the Ghost Timer pays you anyway.
        </p>
      </section>

      <form onSubmit={createJob} className="space-y-5 rounded-xl border p-6">
        <h3 className="text-lg font-semibold">Create a job</h3>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Job title</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Logo for Lisbon Coffee Co."
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Short description</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Primary logo + 2 colour variations, delivered as PNG."
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Price (USDC)</span>
            <Input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Review window (minutes)</span>
            <Input
              type="number"
              min="1"
              value={reviewMinutes}
              onChange={(e) => setReviewMinutes(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              Use 2 for the demo. In real life: 10080 (7 days).
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {walletAddress ? (
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Creating…" : "Create job & get client link"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect your wallet (top right) to create a job. Your wallet is where you&apos;ll get paid.
          </p>
        )}
      </form>
    </div>
  );
}
