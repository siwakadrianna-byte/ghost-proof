// Server-only: talks to the Trustless Work API and signs with the Ghost-Proof platform wallet.
import { Keypair, Networks, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";

const API = "https://dev.api.trustlesswork.com";
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

function platformKeypair() {
  const secret = process.env.PLATFORM_SECRET_KEY;
  if (!secret) throw new Error("PLATFORM_SECRET_KEY is missing from .env.local");
  return Keypair.fromSecret(secret);
}

export const platformAddress = () => platformKeypair().publicKey();

async function call<T>(method: string, route: string, body?: unknown): Promise<T> {
  const res = await fetch(API + route, {
    method,
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Trustless Work error ${res.status}`);
  return data as T;
}

/** Sign an unsigned XDR with the platform wallet and submit it. Returns the tx hash. */
async function signAndSend(unsignedTransaction: string) {
  const tx = TransactionBuilder.fromXDR(unsignedTransaction, Networks.TESTNET);
  (tx as Transaction).sign(platformKeypair());
  const result = await call<{ status: string; message: string; contractId?: string }>(
    "POST",
    "/helper/send-transaction",
    { signedXdr: tx.toXDR() }
  );
  if (result.status !== "SUCCESS") throw new Error(result.message);
  return { ...result, txHash: Buffer.from(tx.hash()).toString("hex") };
}

/** Deploy a single-release escrow for a job. The platform pays the fees and signs. */
export async function deployEscrow(job: {
  id: string;
  title: string;
  description: string;
  price: number;
  designerAddress: string;
  clientAddress: string;
}) {
  const platform = platformAddress();
  const { unsignedTransaction } = await call<{ unsignedTransaction: string }>(
    "POST",
    "/deployer/single-release",
    {
      signer: platform,
      engagementId: `ghost-proof-${job.id}`,
      title: job.title,
      description: job.description || job.title,
      amount: job.price,
      platformFee: 0,
      roles: {
        approver: job.clientAddress,
        serviceProvider: job.designerAddress,
        receiver: job.designerAddress,
        releaseSigner: job.clientAddress,
        disputeResolver: platform,
        platformAddress: platform,
      },
      milestones: [{ description: "Final design files" }],
      trustline: { address: USDC_ISSUER, symbol: "USDC" },
    }
  );
  return signAndSend(unsignedTransaction);
}

/** As dispute resolver, split the escrow between designer and client. */
export async function resolveDispute(
  contractId: string,
  distributions: { address: string; amount: number }[]
) {
  const { unsignedTransaction } = await call<{ unsignedTransaction: string }>(
    "POST",
    "/escrow/single-release/resolve-dispute",
    { contractId, disputeResolver: platformAddress(), distributions }
  );
  return signAndSend(unsignedTransaction);
}

export async function getEscrowBalance(contractId: string) {
  const [row] = await call<{ balance: number }[]>(
    "GET",
    `/helper/get-multiple-escrow-balance?addresses[]=${contractId}`
  );
  return row?.balance ?? 0;
}
