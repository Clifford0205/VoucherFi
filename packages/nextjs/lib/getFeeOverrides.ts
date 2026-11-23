import type { UsePublicClientReturnType } from "wagmi";

export interface FeeOverrides {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

// maxFeePerGas 放大倍數
const FEE_BUFFER_MULTIPLIER = 2n;

/**
 * 產生帶緩衝的 EIP-1559 gas 費用參數，展開進 writeContractAsync 的 variables 使用。
 *
 * Arbitrum 的 base fee 會小幅跳動，錢包估的 maxFeePerGas 幾乎不留緩衝，
 * 送出時 base fee 一漲就會被 RPC 拒收（max fee per gas less than block base fee）。
 * maxFeePerGas 只是願付上限，實際仍依當下 base fee 收費，放大不會多花錢。
 *
 * 估算失敗時回傳空物件，交給錢包自行估算，不阻擋交易。
 */
export const getFeeOverrides = async (publicClient: UsePublicClientReturnType): Promise<FeeOverrides> => {
  if (!publicClient) return {};

  try {
    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();
    return { maxFeePerGas: maxFeePerGas * FEE_BUFFER_MULTIPLIER, maxPriorityFeePerGas };
  } catch (error) {
    console.warn("estimateFeesPerGas failed, falling back to wallet estimation:", error);
    return {};
  }
};
