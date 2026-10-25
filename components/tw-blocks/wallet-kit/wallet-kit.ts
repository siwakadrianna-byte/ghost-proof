import type { ModuleInterface } from "@creit-tech/stellar-wallets-kit/types";
type SdkModule = typeof import("@creit-tech/stellar-wallets-kit/sdk");
type TypesModule = typeof import("@creit-tech/stellar-wallets-kit/types");
// Ghost-Proof: load only Freighter (the default module list pulls in a broken MetaMask adapter)
type FreighterModuleFile =
  typeof import("@creit-tech/stellar-wallets-kit/modules/freighter");
type StellarWalletsKitStatic = SdkModule["StellarWalletsKit"];
type NetworksEnum = TypesModule["Networks"];

/**
 * Stellar Wallet Kit helpers
 *
 * We only load and initialize the kit
 * on the client, and only in response to effects or user actions.
 */
let walletKitPromise: Promise<{
  StellarWalletsKit: StellarWalletsKitStatic;
  Networks: NetworksEnum;
}> | null = null;

const loadWalletKit = async () => {
  if (typeof window === "undefined") {
    throw new Error("StellarWalletsKit is only available in the browser");
  }

  if (!walletKitPromise) {
    walletKitPromise = (async () => {
      const [sdk, types, modules] = await Promise.all([
        import("@creit-tech/stellar-wallets-kit/sdk") as Promise<SdkModule>,
        import("@creit-tech/stellar-wallets-kit/types") as Promise<TypesModule>,
        import(
          "@creit-tech/stellar-wallets-kit/modules/freighter"
        ) as Promise<FreighterModuleFile>,
      ]);

      const { StellarWalletsKit } = sdk;
      const { Networks } = types;
      const { FreighterModule } = modules;

      StellarWalletsKit.init({
        network: Networks.TESTNET, // Adjust this to the network you are using
        modules: [new FreighterModule()],
      });

      return { StellarWalletsKit, Networks };
    })();
  }

  return walletKitPromise;
};

interface SignTransactionParams {
  unsignedTransaction: string;
  address: string;
}

/**
 * Open the authentication modal and request the user's address.
 */
export const openAuthModal = async (): Promise<{ address: string }> => {
  const { StellarWalletsKit } = await loadWalletKit();
  return StellarWalletsKit.authModal();
};

/**
 * Get the currently selected wallet module.
 */
export const getSelectedWallet = async (): Promise<ModuleInterface> => {
  const { StellarWalletsKit } = await loadWalletKit();
  return StellarWalletsKit.selectedModule;
};

/**
 * Disconnect the current wallet.
 */
export const disconnectWalletKit = async (): Promise<void> => {
  const { StellarWalletsKit } = await loadWalletKit();
  return StellarWalletsKit.disconnect();
};

/**
 * Helper to sign a transaction XDR with the active wallet.
 */
export const signTransaction = async ({
  unsignedTransaction,
  address,
}: SignTransactionParams): Promise<string> => {
  const { StellarWalletsKit, Networks } = await loadWalletKit();

  console.log("[Ghost-Proof] asking wallet to sign", { address });

  // Ghost-Proof: fail with a clear message instead of spinning forever
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Freighter didn't respond. Open Freighter, check it's on Test Net with the right account, and try again."
          )
        ),
      120_000
    )
  );

  const { signedTxXdr } = await Promise.race([
    StellarWalletsKit.signTransaction(unsignedTransaction, {
      address,
      networkPassphrase: Networks.TESTNET, // Adjust this to the network you are using
    }),
    timeout,
  ]);

  console.log("[Ghost-Proof] wallet signed", { signed: !!signedTxXdr });
  return signedTxXdr;
};
