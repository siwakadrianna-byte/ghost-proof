import { useQuery } from "@tanstack/react-query";
import {
  GetEscrowFromIndexerByContractIdsParams,
  useGetEscrowFromIndexerByContractIds,
} from "@trustless-work/escrow";
import { GetEscrowsFromIndexerResponse as Escrow } from "@trustless-work/escrow/types";

/**
 * Use the query to get the escrows by contract ids
 *
 * @param params - The parameters for the query
 * @returns The query result
 */
export const useEscrowsByContractIdsQuery = ({
  contractIds,
  validateOnChain = true,
}: GetEscrowFromIndexerByContractIdsParams) => {
  // Get the escrow by contract ids
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();

  return useQuery({
    queryKey: ["escrow", contractIds, validateOnChain],
    queryFn: async (): Promise<Escrow[]> => {
      if (!contractIds) {
        throw new Error(
          "Contract IDs are required to fetch escrows by contract IDs"
        );
      }

      /**
       * Call the query to get escrows by contract ids from the Trustless Work Indexer
       *
       * @param params - The parameters for the query
       * @returns The query result
       */
      const escrows = await getEscrowByContractIds({
        contractIds,
        validateOnChain,
      });

      if (!escrows) {
        throw new Error("Failed to fetch escrows");
      }

      return escrows;
    },
    enabled: !!contractIds,
    staleTime: 1000 * 60 * 5,
  });
};
