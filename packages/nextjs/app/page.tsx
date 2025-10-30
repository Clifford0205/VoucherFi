"use client";

import { useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { TabMallContent } from "~/components/TabMallContent";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent } from "~/components/ui/tabs";
import { mockProducts } from "~/lib/mockProducts";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState("mall");

  // 檢查會員狀態：讀取合約中的 NFT 餘額
  const { data: memberBalance } = useScaffoldReadContract({
    contractName: "VoucherFiToken",
    functionName: "balanceOf",
    args: [connectedAddress, 100n],
    query: {
      enabled: !!connectedAddress,
    },
  });

  // 判斷是否為會員：餘額大於 0
  const isMember = memberBalance !== undefined && memberBalance > 0n;

  // 模擬用戶數據
  const userStats = {
    points: 32,
    gifts: 2,
    vouchers: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-neutral-900 to-neutral-800 text-white pb-6 overflow-hidden">
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
                <AvatarImage src="/api/placeholder/100/100" />
                <AvatarFallback className="bg-neutral-600 text-2xl">
                  {connectedAddress.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* User Name & Address */}
              <div className="mt-3 text-center">
                <h2 className="text-xl font-bold mb-1">會員</h2>
                <div className="bg-black/30 rounded-full px-3 py-1 text-xs">
                  <Address address={connectedAddress} />
                </div>
              </div>

              {/* Member Badge */}
              <Badge variant="secondary" className="mt-2 bg-white/20 hover:bg-white/30 text-white border-0">
                一般會員
              </Badge>
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
          <div className="relative z-10 grid grid-cols-4 gap-3 px-4 mt-6">
            <button
              onClick={() => setActiveTab("points")}
              className={`bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 text-center transition-all hover:bg-white/20 ${
                activeTab === "points" ? "ring-2 ring-white/50 bg-white/20" : ""
              }`}
            >
              <div className="text-3xl font-bold text-white">{userStats.points}</div>
              <div className="text-xs mt-1 text-white/80">點數</div>
            </button>
            <button
              onClick={() => setActiveTab("gifts")}
              className={`bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 text-center transition-all hover:bg-white/20 ${
                activeTab === "gifts" ? "ring-2 ring-white/50 bg-white/20" : ""
              }`}
            >
              <div className="text-3xl font-bold text-white">{userStats.gifts}</div>
              <div className="text-xs mt-1 text-white/80">禮物券</div>
            </button>
            <button
              onClick={() => setActiveTab("vouchers")}
              className={`bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 text-center transition-all hover:bg-white/20 ${
                activeTab === "vouchers" ? "ring-2 ring-white/50 bg-white/20" : ""
              }`}
            >
              <div className="text-3xl font-bold text-white">{userStats.vouchers}</div>
              <div className="text-xs mt-1 text-white/80">商品券</div>
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
            <div className="text-center py-12 text-muted-foreground">
              <p>點數功能開發中...</p>
            </div>
          </TabsContent>

          <TabsContent value="gifts" className="p-4 mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>您目前有 {userStats.gifts} 張禮物券</p>
            </div>
          </TabsContent>

          <TabsContent value="vouchers" className="p-4 mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>商品券功能開發中...</p>
            </div>
          </TabsContent>

          <TabsContent value="mall" className="mt-0">
            <TabMallContent products={mockProducts} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Home;
