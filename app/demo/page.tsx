"use client";

// Step 4 test page: the stock Trustless Work blocks, before we build Ghost-Proof's own screens.
import { Suspense } from "react";
import { WalletButton } from "@/components/tw-blocks/wallet-kit/WalletButtons";
import { InitializeEscrowDialog } from "@/components/tw-blocks/escrows/single-release/initialize-escrow/dialog/InitializeEscrow";
import { EscrowsByRoleCards } from "@/components/tw-blocks/escrows/escrows-by-role/cards/EscrowsCards";

export default function Demo() {
  return (
    <Suspense>
      <DemoContent />
    </Suspense>
  );
}

function DemoContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Ghost-Proof · escrow test</h1>
        <WalletButton />
      </header>
      <div className="flex justify-end mb-4">
        <div className="w-48">
          <InitializeEscrowDialog />
        </div>
      </div>
      <EscrowsByRoleCards />
    </div>
  );
}
