"use client";

import { WalletButton } from "@/components/tw-blocks/wallet-kit/WalletButtons";

export default function Home() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Ghost-Proof</h1>
        <WalletButton />
      </header>
      <p className="text-muted-foreground">
        Escrow for freelance designers. No more getting ghosted.
      </p>
    </div>
  );
}
