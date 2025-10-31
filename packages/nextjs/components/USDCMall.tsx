"use client";

import { useState } from "react";
import Image from "next/image";
import { parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { ProductDialog } from "~/components/ProductDialog";
import { Card, CardContent } from "~/components/ui/card";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

interface Product {
  id: number;
  title: string;
  brand: string;
  description: string;
  image: string;
  value: number;
  priceUSDC?: number;
  pointsCost?: number;
}

interface USDCMallContentProps {
  products: Product[];
  refetchFunc?: () => void;
}

export const USDCMall = ({ products, refetchFunc }: USDCMallContentProps) => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync: writeVoucherContract } = useScaffoldWriteContract("SimpleVoucher1155");
  const { writeContractAsync: writeUSDCContract } = useScaffoldWriteContract("mockUSDC");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 獲取 SimpleVoucher1155 合約地址（作為 spender）
  const { data: voucherContractInfo } = useDeployedContractInfo("SimpleVoucher1155");
  const { data: usdcContractInfo } = useDeployedContractInfo("mockUSDC");

  // 讀取當前的 USDC allowance
  const { data: currentAllowance } = useScaffoldReadContract({
    contractName: "mockUSDC",
    functionName: "allowance",
    args: [connectedAddress, voucherContractInfo?.address],
    query: {
      enabled: !!connectedAddress && !!voucherContractInfo?.address,
    },
  });

  // 處理商品點擊
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  // 處理購買
  const handlePurchase = async () => {
    if (!connectedAddress) {
      console.error("No connected address");
      return;
    }

    if (!selectedProduct) {
      console.error("No product selected");
      return;
    }

    if (!voucherContractInfo?.address) {
      console.error("Contract address not found");
      return;
    }

    console.log("購買商品:", selectedProduct);

    try {
      // 計算需要的 USDC 金額（USDC 有 6 位小數）
      const requiredAmount = parseUnits(selectedProduct.value.toString(), 6);

      console.log("Required amount:", requiredAmount);
      console.log("Current allowance:", currentAllowance);

      // 檢查 allowance 是否足夠
      if (!currentAllowance || currentAllowance < requiredAmount) {
        console.log("Allowance insufficient, approving...");

        // 先 approve（授權足夠的額度，這裡授權需要的金額）
        await writeUSDCContract({
          functionName: "approve",
          args: [voucherContractInfo.address, requiredAmount],
        });

        console.log("Approve transaction confirmed!");

        // approve 交易已確認，現在從鏈上重新讀取 allowance 來驗證
        if (publicClient && usdcContractInfo?.address) {
          const newAllowance = (await publicClient.readContract({
            address: usdcContractInfo.address,
            abi: usdcContractInfo.abi,
            functionName: "allowance",
            args: [connectedAddress, voucherContractInfo.address],
          })) as bigint;

          console.log("New allowance from chain:", newAllowance);

          // 驗證 allowance 是否真的足夠
          if (newAllowance < requiredAmount) {
            throw new Error("Allowance verification failed. Please try again.");
          }
        }
      }

      // 執行購買
      await writeVoucherContract({
        functionName: "mintByUSDC",
        args: [BigInt(selectedProduct.id), 1n],
      });

      console.log("Purchase successful!");
      setIsDialogOpen(false);

      // 購買成功後重新取得資料
      if (refetchFunc) {
        refetchFunc();
      }
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };
  return (
    <>
      <div className="p-4 mt-0 flex flex-col items-center space-y-6">
        {products.map(product => (
          <Card
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="w-full max-w-[60%] overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0"
            style={{ backgroundColor: "#F4F5F8" }}
          >
            <CardContent className="p-0">
              {/* Title at the top */}
              <div className="px-6 pt-6 pb-3 text-center">
                <h3 className="text-2xl font-bold text-foreground">{product.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{product.brand}</p>
              </div>

              {/* Image and Description Container with Padding */}
              <div className="px-6 pb-6">
                <div className="flex flex-row gap-4">
                  {/* Left: Image Section */}
                  <div className="relative w-2/5 min-h-[200px] rounded-lg overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  </div>

                  {/* Right: Content Section */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>

                    {/* Price Section */}
                    <div className="flex items-end justify-between mt-4 pt-4">
                      <div className="text-sm text-muted-foreground">價格</div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-foreground">{product.priceUSDC}</div>
                        <div className="text-sm text-muted-foreground">ETH</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Detail Dialog */}
      <ProductDialog
        product={selectedProduct}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPurchase={handlePurchase}
      />
    </>
  );
};
