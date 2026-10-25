"use client";

import Link from "next/link";
import { WalletButton } from "@/components/tw-blocks/wallet-kit/WalletButtons";

export function GhostMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 3C9.9 3 5 7.9 5 14v14l3.7-2.6L12.3 28l3.7-2.6 3.7 2.6 3.6-2.6L27 28V14C27 7.9 22.1 3 16 3Z"
        fill="var(--gp-mint)"
      />
      <circle cx="12.2" cy="14" r="2" fill="#0c1613" />
      <circle cx="19.8" cy="14" r="2" fill="#0c1613" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4">
      <div className="glass mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <GhostMark />
          <span className="font-display text-2xl">Ghost-Proof</span>
        </Link>
        <WalletButton />
      </div>
    </header>
  );
}
