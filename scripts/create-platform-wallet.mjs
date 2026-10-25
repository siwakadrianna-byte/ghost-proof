// Creates the Ghost-Proof platform wallet on Stellar testnet:
// funds it with Friendbot XLM and adds a USDC trustline, then prints the keys.
import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";

const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const server = new Horizon.Server("https://horizon-testnet.stellar.org");

const kp = Keypair.random();
const res = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
if (!res.ok) throw new Error("Friendbot failed: " + (await res.text()));

const account = await server.loadAccount(kp.publicKey());
const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.changeTrust({ asset: USDC }))
  .setTimeout(60)
  .build();
tx.sign(kp);
await server.submitTransaction(tx);

console.log(`PLATFORM_PUBLIC_KEY=${kp.publicKey()}`);
console.log(`PLATFORM_SECRET_KEY=${kp.secret()}`);
