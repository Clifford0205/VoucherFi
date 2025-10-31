"use client";

import { useState } from "react";
import Image from "next/image";
import { keccak256, parseUnits, stringToHex } from "viem";
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
  value?: number;
  quantity?: number;
  priceUSDC?: number;
  pointsCost?: number;
}

type MallType = "usdc" | "points" | "tickets";

interface ProductMallProps {
  products: Product[];
  refetchFunc?: () => void;
  type: MallType;
}

// 根據 productId 獲取分類
const getProductCategory = (productId: number): string => {
  const idString = productId.toString();
  if (idString.startsWith("1001")) return "美食";
  if (idString.startsWith("1002")) return "住宿";
  if (idString.startsWith("1003")) return "旅行";
  return "其他";
};

// 將產品按分類分組
const groupProductsByCategory = (products: Product[]) => {
  const grouped: Record<string, Product[]> = {};

  products.forEach(product => {
    const category = getProductCategory(product.id);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(product);
  });

  return grouped;
};

export const ProductMall = ({ products, refetchFunc, type }: ProductMallProps) => {
  console.log("products: ", products);
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync: writeVoucherContract } = useScaffoldWriteContract("SimpleVoucher1155");
  const { writeContractAsync: writeUSDCContract } = useScaffoldWriteContract("mockUSDC");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 將產品按分類分組
  const groupedProducts = groupProductsByCategory(products);

  // 獲取合約信息（只在 USDC 類型時需要）
  const { data: voucherContractInfo } = useDeployedContractInfo("SimpleVoucher1155");
  const { data: usdcContractInfo } = useDeployedContractInfo("mockUSDC");

  // 讀取當前的 USDC allowance（只在 USDC 類型時需要）
  const { data: currentAllowance } = useScaffoldReadContract({
    contractName: "mockUSDC",
    functionName: "allowance",
    args: [connectedAddress, voucherContractInfo?.address],
    query: {
      enabled: type === "usdc" && !!connectedAddress && !!voucherContractInfo?.address,
    },
  });

  // 處理商品點擊
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  // 統一的購買/使用處理函數
  const handleAction = async () => {
    if (!connectedAddress) {
      console.error("No connected address");
      return;
    }

    if (!selectedProduct) {
      console.error("No product selected");
      return;
    }

    console.log(`${type === "tickets" ? "使用票券" : "購買商品"}:`, selectedProduct);

    try {
      // 根據類型執行不同的邏輯
      switch (type) {
        case "usdc":
          await handleUSDCPurchase();
          break;
        case "points":
          await handlePointsPurchase();
          break;
        case "tickets":
          await handleTicketUse();
          break;
      }

      console.log("Action successful!");
      setIsDialogOpen(false);

      // 成功後重新取得資料
      if (refetchFunc) {
        refetchFunc();
      }
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  // USDC 購買邏輯
  const handleUSDCPurchase = async () => {
    if (!voucherContractInfo?.address || !selectedProduct || !connectedAddress) return;

    // 計算需要的 USDC 金額（USDC 有 6 位小數）
    const requiredAmount = parseUnits(selectedProduct.priceUSDC?.toString() || "0", 6);

    console.log("Required amount:", requiredAmount);
    console.log("Current allowance:", currentAllowance);

    // 檢查 allowance 是否足夠
    if (!currentAllowance || currentAllowance < requiredAmount) {
      console.log("Allowance insufficient, approving...");

      // 先 approve
      await writeUSDCContract(
        {
          functionName: "approve",
          args: [voucherContractInfo.address, requiredAmount],
        },
        undefined,
        "授權成功",
      );

      console.log("Approve transaction confirmed!");

      // 驗證 allowance
      if (publicClient && usdcContractInfo?.address) {
        const newAllowance = (await publicClient.readContract({
          address: usdcContractInfo.address,
          abi: usdcContractInfo.abi,
          functionName: "allowance",
          args: [connectedAddress, voucherContractInfo.address],
        })) as bigint;

        console.log("New allowance from chain:", newAllowance);

        if (newAllowance < requiredAmount) {
          throw new Error("Allowance verification failed. Please try again.");
        }
      }
    }

    // 執行購買
    await writeVoucherContract(
      {
        functionName: "mintByUSDC",
        args: [BigInt(selectedProduct.id), 1n],
      },
      undefined,
      "購買成功",
    );
  };

  // 點數購買邏輯
  const handlePointsPurchase = async () => {
    if (!selectedProduct) return;

    await writeVoucherContract(
      {
        functionName: "mintByPoints",
        args: [BigInt(selectedProduct.id), 1n],
      },
      undefined,
      "兌換成功",
    );
  };

  // 票券使用邏輯
  const handleTicketUse = async () => {
    if (!selectedProduct) return;

    const timestamp = Date.now();
    const qr = keccak256(stringToHex(`qr-demo-${timestamp}`));

    await writeVoucherContract(
      {
        functionName: "redeem",
        args: [BigInt(selectedProduct.id), 1n, qr],
      },
      undefined,
      "兌換成功",
    );
  };

  // 根據類型獲取價格標籤和值
  const getPriceInfo = (product: Product) => {
    switch (type) {
      case "usdc":
        return {
          label: "價格",
          value: product.priceUSDC !== undefined ? (product.priceUSDC / 1000000).toFixed(2) : "0",
          unit: "USDC",
        };
      case "points":
        return {
          label: "點數",
          value: product.pointsCost?.toString() || "0",
          unit: "Point",
        };
      case "tickets":
        return {
          label: "數量",
          value: product.quantity?.toString() || "0",
          unit: "張",
        };
    }
  };

  // 根據類型獲取對話框配置
  const getDialogConfig = () => {
    switch (type) {
      case "usdc":
        return { buttonLabel: "購買", type: "usdc" as const };
      case "points":
        return { buttonLabel: "使用點數兌換", type: "points" as const };
      case "tickets":
        return { buttonLabel: "使用票券", type: "use" as const };
    }
  };

  return (
    <>
      <div className="p-4 mt-0 max-w-7xl mx-auto space-y-8">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category}>
            {/* 分類標題 */}
            <h2 className="text-2xl font-bold mb-4 px-2 text-foreground border-b-2 border-foreground/20 pb-1">
              {category}
            </h2>

            {/* 該分類的產品網格 */}
            <div className="grid grid-cols-2 gap-4">
              {categoryProducts.map(product => {
                const priceInfo = getPriceInfo(product);

                return (
                  <Card
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="w-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0"
                    style={{ backgroundColor: "#F4F5F8" }}
                  >
                    <CardContent className="p-0">
                      {/* Title at the top */}
                      <div className="px-4 pt-4 pb-0 text-center">
                        <h3 className="text-xl font-bold text-foreground truncate">{product.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{product.brand}</p>
                      </div>

                      {/* Image and Description Container with Padding */}
                      <div className="px-4 pb-4">
                        <div className="flex flex-col gap-3">
                          {/* Image Section */}
                          <div className="relative w-full h-[180px] rounded-lg overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>

                          {/* Content Section */}
                          <div className="flex flex-col gap-2">
                            <div>
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-2 m-1">
                                {product.description}
                              </p>
                            </div>

                            {/* Price Section */}
                            <div className="flex items-start justify-between pt-2 border-t">
                              <div className="text-xs text-muted-foreground">{priceInfo.label}</div>
                              <div className="text-right flex items-baseline">
                                <div className="text-2xl font-bold text-foreground">{priceInfo.value}</div>
                                <div className="text-xs text-muted-foreground ml-1">{priceInfo.unit}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Dialog */}
      <ProductDialog
        product={selectedProduct}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPurchase={handleAction}
        {...getDialogConfig()}
      />
    </>
  );
};
