"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent } from "~/components/ui/tabs";
import { mockAllProducts, mockPointProducts, mockProducts, mockUSDCProducts } from "~/lib/mockProducts";
import { ProductMall } from "~~/components/ProductMall";
import { Address } from "~~/components/scaffold-eth";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const tokenIds = mockProducts.map(product => BigInt(product.id));

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const [activeTab, setActiveTab] = useState("mall");
  const [productsWithPrices, setProductsWithPrices] = useState(mockProducts);
  console.log("productsWithPrices: ", productsWithPrices);

  // 獲取合約信息
  const { data: voucherContractInfo } = useDeployedContractInfo("SimpleVoucher1155");

  // 檢查會員狀態：讀取合約中的 NFT 餘額
  const { data: memberBalance } = useScaffoldReadContract({
    contractName: "SimpleVoucher1155",
    functionName: "balanceOf",
    args: [connectedAddress, 100n],
    query: {
      enabled: !!connectedAddress,
    },
  });

  // 判斷是否為會員：餘額大於 0
  const isMember = memberBalance !== undefined && memberBalance > 0n;

  // 創建相同長度的 accounts 數組，每個都是 connectedAddress
  const accounts = connectedAddress ? Array(tokenIds.length).fill(connectedAddress) : [];

  // 檢查USDC 餘額
  const { data: usdcBalance, refetch: refetchUSDCBalance } = useScaffoldReadContract({
    contractName: "mockUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
    query: {
      enabled: isMember && !!connectedAddress,
    },
  });

  // 檢查 points 餘額
  const { data: pointsBalance, refetch: refetchPointsBalance } = useScaffoldReadContract({
    contractName: "SimpleVoucher1155",
    functionName: "balanceOf",
    args: [connectedAddress, 100000n],
    query: {
      enabled: isMember && !!connectedAddress,
    },
  });

  // 批量查詢所有 商品券
  const { data: myProductsData, refetch: refetchMyProductsData } = useScaffoldReadContract({
    contractName: "SimpleVoucher1155",
    functionName: "balanceOfBatch",
    args: [accounts as readonly `0x${string}`[], tokenIds],
    query: {
      enabled: isMember && !!connectedAddress,
    },
  });

  // 將 myProductsData 整理成 object，key 是 tokenId，value 是餘額（轉換為 Number）
  // 並且過濾掉 value 為 0 的項目
  const productsBalanceMap = myProductsData
    ? Object.fromEntries(
        tokenIds
          .map((tokenId, index) => [tokenId.toString(), Number(myProductsData[index])] as [string, number])
          .filter(([, quantity]) => quantity > 0),
      )
    : {};

  // 從 mockAllProducts 中找到有餘額的商品，並添加 quantity 欄位
  const myProductsWithQuantity = Object.keys(productsBalanceMap)
    .map(tokenId => {
      const product = mockAllProducts.find(p => p.id.toString() === tokenId);
      if (product) {
        return {
          ...product,
          quantity: productsBalanceMap[tokenId],
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null); // 過濾掉 null 值並確保類型

  // 使用 useEffect 批量查詢 pointsCost 和 priceUSDC
  useEffect(() => {
    const fetchPrices = async () => {
      if (!publicClient || !voucherContractInfo?.address || !isMember) return;

      try {
        // 準備 multicall 合約調用
        const priceUSDCCalls = tokenIds.map(tokenId => ({
          address: voucherContractInfo.address,
          abi: voucherContractInfo.abi,
          functionName: "priceUSDC",
          args: [tokenId],
        }));

        const pointsCostCalls = tokenIds.map(tokenId => ({
          address: voucherContractInfo.address,
          abi: voucherContractInfo.abi,
          functionName: "pointsCost",
          args: [tokenId],
        }));

        // 執行批量查詢
        const priceUSDCResults = await publicClient.multicall({
          contracts: priceUSDCCalls as any,
        });

        const pointsCostResults = await publicClient.multicall({
          contracts: pointsCostCalls as any,
        });

        // 將價格數據合併到 mockProducts
        const updatedProducts = mockProducts.map((product, index) => ({
          ...product,
          priceUSDC: priceUSDCResults[index].status === "success" ? Number(priceUSDCResults[index].result) : 0,
          pointsCost: pointsCostResults[index].status === "success" ? Number(pointsCostResults[index].result) : 0,
        }));

        setProductsWithPrices(updatedProducts);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
      }
    };

    fetchPrices();
  }, [publicClient, voucherContractInfo, isMember]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="relative  text-white pb-6 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image src="/images/banner.jpg" alt="Banner Background" fill className="object-cover opacity-30" priority />
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/50 to-black/70" />

        {/* User Info Section */}
        {connectedAddress ? (
          isMember ? (
            <div className="relative z-10 flex flex-col items-center pt-10">
              {/* Avatar */}
              <Avatar className="h-24 w-24 border-4 border-white/20">
                {/* <AvatarImage src="/api/placeholder/100/100" /> */}
                {/* <AvatarFallback className="bg-neutral-600 text-2xl">
                  {connectedAddress.slice(2, 4).toUpperCase()}
                </AvatarFallback> */}
                <BlockieAvatar address={connectedAddress} size={100} />
              </Avatar>

              {/* User Name & Address */}
              <div className="mt-3 text-center">
                <div className="bg-black/30 rounded-full px-3 py-1 text-xs">
                  <Address address={connectedAddress} isBlockieShow={false} />
                </div>
              </div>
              <div>USDC: {usdcBalance}</div>
              <div>Points: {pointsBalance}</div>

              {/* Member Badge */}
              {/* <Badge variant="secondary" className="mt-2 bg-white/20 hover:bg-white/30 text-white border-0">
                一般會員
              </Badge> */}
            </div>
          ) : (
            <div className="relative z-10 text-center py-8">
              <p className="text-lg mb-4">您尚未擁有會員 NFT</p>
              <p className="text-sm text-white/70">請先取得會員資格以使用商城功能</p>
            </div>
          )
        ) : (
          <div className="relative z-10 text-center py-8">
            <p className="text-lg mb-4">請連接錢包以開始使用</p>
          </div>
        )}

        {/* Tab Navigation Cards */}
        {connectedAddress && isMember && (
          <div className="relative z-10 grid grid-cols-3 gap-3 px-4 mt-6">
            <button
              onClick={() => setActiveTab("points")}
              className={`bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 text-center transition-all hover:bg-white/20 ${
                activeTab === "points" ? "ring-2 ring-white/50 bg-white/20" : ""
              }`}
            >
              <div className="text-3xl font-bold text-white">點數商城</div>
            </button>

            <button
              onClick={() => setActiveTab("myTickets")}
              className={`bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 text-center transition-all hover:bg-white/20 ${
                activeTab === "myTickets" ? "ring-2 ring-white/50 bg-white/20" : ""
              }`}
            >
              <div className="text-3xl font-bold text-white">我的票券</div>
            </button>
            <button
              onClick={() => setActiveTab("mall")}
              className={`bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 text-center transition-all hover:bg-white/20 ${
                activeTab === "mall" ? "ring-2 ring-white/50 bg-white/20" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 mx-auto text-white"
              >
                <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
              </svg>
              <div className="text-xs mt-1 text-white/80">商城</div>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Content Section */}
      {connectedAddress && isMember && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Contents */}
          <TabsContent value="points" className="p-4 mt-0">
            <ProductMall
              type="points"
              products={productsWithPrices}
              refetchFunc={() => {
                refetchPointsBalance();
                refetchMyProductsData();
              }}
            />
          </TabsContent>

          <TabsContent value="myTickets" className="p-4 mt-0">
            <ProductMall
              type="tickets"
              products={myProductsWithQuantity}
              refetchFunc={() => {
                refetchMyProductsData();
              }}
            />
          </TabsContent>

          <TabsContent value="mall" className="mt-0">
            <ProductMall
              type="usdc"
              products={productsWithPrices}
              refetchFunc={() => {
                refetchUSDCBalance();
                refetchMyProductsData();
              }}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Home;
