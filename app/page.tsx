"use client";

import Link from "next/link";
import { SiteHeader, GhostMark } from "@/components/ghost/SiteHeader";
import { Reveal, useSectionProgress } from "@/components/ghost/scroll";
import { GhostTrail } from "@/components/ghost/GhostTrail";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    kicker: "01 · Create",
    title: "Set the job and the price",
    body: "Title, price in USDC and a review window. You get a link to send your client.",
    state: { label: "Waiting for client", amount: "0", tone: "muted" },
  },
  {
    kicker: "02 · Lock",
    title: "The client locks the money first",
    body: "Before you lift a pen, the payment sits in a Stellar escrow. Nobody can quietly take it back.",
    state: { label: "Money locked 🔒", amount: "250", tone: "mint" },
  },
  {
    kicker: "03 · Deliver",
    title: "Deliver with a watermark",
    body: "Upload the final file. The client sees a watermarked preview, and the clean file unlocks when you're paid.",
    state: { label: "Delivered, in review", amount: "250", tone: "gold" },
  },
  {
    kicker: "04 · Get paid",
    title: "Approve, dispute or ghost",
    body: "Approved? Paid. Disagree? A fair split. Silent? The Ghost Timer pays you anyway.",
    state: { label: "Paid ✅", amount: "250", tone: "mint" },
  },
];

export default function Landing() {
  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip">
        <Hero />
        <Problem />
        <HowItWorks />
        <GhostTimer />
        <Outcomes />
        <OnStellar />
        <FinalCta />
      </main>
    </>
  );
}

function Hero() {
  const { ref, progress } = useSectionProgress<HTMLElement>();
  return (
    <section ref={ref} className="relative h-[160vh]">
      <div
        className="sticky top-0 flex h-screen flex-col items-center justify-center px-4 text-center"
        style={{ opacity: 1 - progress * 1.4, transform: `scale(${1 - progress * 0.12})` }}
      >
        <div className="mb-6" style={{ transform: `translateY(${progress * -120}px)` }}>
          <GhostTrail />
        </div>
        <p className="mb-5 text-sm uppercase tracking-[0.3em] text-mint">Escrow for freelance designers</p>
        <h1 className="font-display text-6xl leading-[0.95] sm:text-8xl md:text-9xl">
          Get paid.
          <br />
          <em className="text-mint">Even if they ghost you.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Your client locks the money on Stellar before you deliver. Approve, dispute, or go silent: you still get paid.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/new">
            <Button size="lg" className="h-12 rounded-full px-8 text-base">Create a job</Button>
          </Link>
          <a href="#how">
            <Button size="lg" variant="outline" className="h-12 rounded-full bg-transparent px-8 text-base">
              How it works ↓
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const lines = ["You deliver the work.", "They go quiet.", "The invoice dies in their inbox."];
  return (
    <section className="mx-auto max-w-4xl px-4 py-32">
      {lines.map((line, i) => (
        <Reveal key={line} delay={i * 150}>
          <p className={`font-display text-5xl leading-tight sm:text-7xl ${i === 2 ? "text-gold" : ""}`}>{line}</p>
        </Reveal>
      ))}
      <Reveal delay={500}>
        <p className="mt-10 max-w-2xl text-lg text-muted-foreground">
          Small jobs aren&apos;t worth a lawyer. So freelancers chase, wait, and eventually give up. Ghost-Proof makes
          ghosting pointless: the money is locked before the work is handed over.
        </p>
      </Reveal>
    </section>
  );
}

function HowItWorks() {
  const { ref, progress } = useSectionProgress<HTMLElement>();
  const active = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
  const step = STEPS[active];

  return (
    <section id="how" ref={ref} className="relative" style={{ height: `${STEPS.length * 90}vh` }}>
      <div className="sticky top-0 flex h-screen items-center px-4">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-6 text-sm uppercase tracking-[0.3em] text-mint">How it works</p>
            <ol className="space-y-6">
              {STEPS.map((s, i) => (
                <li
                  key={s.kicker}
                  className="transition-all duration-500"
                  style={{ opacity: i === active ? 1 : 0.28, transform: `translateX(${i === active ? 0 : -8}px)` }}
                >
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.kicker}</div>
                  <div className="font-display text-3xl sm:text-4xl">{s.title}</div>
                  {i === active && <p className="mt-2 max-w-md text-muted-foreground">{s.body}</p>}
                </li>
              ))}
            </ol>
          </div>

          {/* Mock job card that changes as you scroll */}
          <div className="glass p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Job</div>
                <div className="font-display text-3xl">Brand identity for Café Lume</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold">250 USDC</div>
                <div className="text-sm text-muted-foreground">In escrow: {step.state.amount}</div>
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 p-6 text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Status</div>
              <div
                key={step.state.label}
                className={`reveal is-visible mt-1 font-display text-4xl ${
                  step.state.tone === "mint" ? "text-mint" : step.state.tone === "gold" ? "text-gold" : ""
                }`}
              >
                {step.state.label}
              </div>
            </div>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--gp-mint)] transition-all duration-500"
                style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GhostTimer() {
  const { ref, progress } = useSectionProgress<HTMLElement>();
  // Scroll drains a 7-day review window down to zero
  const total = 7 * 24 * 3600;
  const left = Math.round(total * (1 - Math.min(1, progress / 0.8)));
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const done = left === 0;

  return (
    <section ref={ref} className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-4 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gold">The Ghost Timer</p>
        <h2 className="font-display text-5xl sm:text-7xl">
          Silence <em className="text-mint">=</em> yes.
        </h2>
        <div
          className={`mt-10 font-mono text-5xl tabular-nums sm:text-8xl transition-colors duration-500 ${done ? "text-mint" : ""}`}
        >
          {d}d {pad(h)}:{pad(m)}:{pad(s)}
        </div>
        <div className="mt-8 h-16">
          {done ? (
            <div className="reveal is-visible glass inline-flex items-center gap-3 px-6 py-3 text-lg">
              <GhostMark className="h-6 w-6" /> Client went silent. 250 USDC released to the designer.
            </div>
          ) : (
            <p className="max-w-lg text-muted-foreground">
              After you deliver, the client has a review window. If it runs out without a word, you claim your payment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Outcomes() {
  const cards = [
    { emoji: "✅", title: "Approve", body: "Client signs, the escrow releases, and the clean files unlock." },
    { emoji: "⚖️", title: "Dispute", body: "Client proposes a split in one sentence. Accept it, or Ghost-Proof decides fairly." },
    { emoji: "👻", title: "Ghost", body: "No answer before the timer ends? Silence counts as yes, and you claim 100%." },
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-32">
      <Reveal>
        <h2 className="mb-12 text-center font-display text-5xl sm:text-6xl">Three endings. All of them fair.</h2>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 150}>
            <div className="glass h-full p-7">
              <div className="text-4xl">{c.emoji}</div>
              <div className="mt-4 font-display text-3xl">{c.title}</div>
              <p className="mt-2 text-muted-foreground">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function OnStellar() {
  const items = [
    ["Stellar", "Fast, near-free payments. Every step is a real transaction you can open on a block explorer."],
    ["USDC", "Priced in digital dollars, so the amount you agree is the amount you get."],
    ["Trustless Work", "Audited escrow contracts with clear roles: client approves, designer delivers, Ghost-Proof resolves."],
    ["Freighter", "No accounts or passwords. Your wallet is your identity and your signature."],
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-24">
      <Reveal>
        <p className="mb-3 text-center text-sm uppercase tracking-[0.3em] text-mint">Built on Stellar</p>
        <h2 className="mb-12 text-center font-display text-5xl sm:text-6xl">Proof, not promises.</h2>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map(([title, body], i) => (
          <Reveal key={title} delay={i * 100}>
            <div className="glass h-full p-6">
              <div className="font-display text-2xl text-mint">{title}</div>
              <p className="mt-1 text-muted-foreground">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-40 pt-16 text-center">
      <Reveal>
        <h2 className="font-display text-6xl sm:text-8xl">
          Never get <em className="text-mint">ghosted</em> again.
        </h2>
        <Link href="/new" className="mt-10 inline-block">
          <Button size="lg" className="h-14 rounded-full px-10 text-lg">Create your first job</Button>
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">Running on Stellar testnet · HackMeridian 2026</p>
      </Reveal>
    </section>
  );
}
