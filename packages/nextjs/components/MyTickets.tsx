"use client";

import { useState } from "react";
import Image from "next/image";
import { keccak256, stringToHex } from "viem";
import { useAccount } from "wagmi";
import { ProductDialog } from "~/components/ProductDialog";
import { Card, CardContent } from "~/components/ui/card";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Product {
  id: number;
  title: string;
  brand: string;
  description: string;
  image: string;
  value: number;
  quantity: number;
}

interface MyTicketsContentProps {
  products: Product[];
}

export const MyTickets = ({ products }: MyTicketsContentProps) => {
  const { address: connectedAddress } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("SimpleVoucher1155");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 處理商品點擊
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  // 處理購買
  const handleUseTicket = async () => {
    const timestamp = Date.now();
    const qr = keccak256(stringToHex(`qr-demo-${timestamp}`));

    if (!connectedAddress) {
      console.error("No connected address");
      return;
    }

    try {
      await writeContractAsync({
        functionName: "redeem",
        args: [BigInt(selectedProduct?.id || 0), 1n, qr],
      });
      console.log("Purchase successful!");
      setIsDialogOpen(false);
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
                      <div className="text-sm text-muted-foreground">數量</div>

                      <div className="text-right">
                        {product.quantity ? (
                          <div>
                            <div className="text-3xl font-bold text-foreground">{product.quantity} 張</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl font-bold text-foreground">{product.value}</div>
                            <div className="text-sm text-muted-foreground">ETH</div>
                          </div>
                        )}
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
        onPurchase={handleUseTicket}
        buttonLabel="使用票券"
      />
    </>
  );
};
