"use client";

import { useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";

interface Product {
  id: number;
  title: string;
  brand: string;
  description: string;
  image: string;
  priceUSDC?: number;
  pointsCost?: number;
  quantity?: number;
}

interface ProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: () => void | Promise<void>;
  buttonLabel?: string;
  type?: "points" | "usdc" | "use";
}

export const ProductDialog = ({
  product,
  isOpen,
  onOpenChange,
  onPurchase,
  buttonLabel = "確定購買",
  type = "usdc",
}: ProductDialogProps) => {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  if (!product) return null;

  // 生成隨機 QR code
  const handleQRCode = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const qrData = `VOUCHER-${product.id}-${timestamp}-${randomString}`;
    setQrCodeData(qrData);
  };

  // 重置 QR code（當對話框關閉時）
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setQrCodeData(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[430px] w-[calc(100vw-20px)] max-h-[90vh] overflow-y-auto bg-white border-0 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">{product.title}</DialogTitle>
          <DialogDescription className="text-base sm:text-lg text-center">{product.brand}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:gap-6 py-3 sm:py-4">
          {/* Product Image */}
          <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="font-semibold text-base sm:text-lg mb-2">商品描述</h4>
              <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">{product.description}</p>
            </div>

            <div className="mt-4">
              {type === "points" && (
                <div className="flex items-start justify-between">
                  <span className="font-black">點數</span>
                  <div className="text-right">
                    <div className="flex items-baseline">
                      <div className="text-2xl sm:text-3xl font-bold">
                        {product.pointsCost !== undefined ? product.pointsCost : "0"}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground ml-1">Point</div>
                    </div>
                  </div>
                </div>
              )}
              {type === "usdc" && (
                <div className="flex items-start justify-between">
                  <div className="font-black">價格</div>
                  <div className="text-right">
                    <div className="flex items-baseline">
                      <div className="text-2xl sm:text-3xl font-bold">
                        {product.priceUSDC !== undefined ? (product.priceUSDC / 1000000).toFixed(2) : "0"}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground ml-1">USDC</div>
                    </div>
                  </div>
                </div>
              )}
              {type === "use" && (
                <div className="flex items-start justify-between">
                  <div className="font-black">剩餘張數</div>
                  <div className="text-right">
                    <div className="flex items-baseline">
                      <div className="text-2xl sm:text-3xl font-bold">{product.quantity}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground ml-1">張</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Display Area */}
          {qrCodeData && (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-lg border-2 border-muted">
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-center">使用票券</h4>
                <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1">請出示此 QR Code</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg">
                <QRCodeSVG value={qrCodeData} size={200} level="H" includeMargin={true} />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {type === "use" && !qrCodeData && (
            <Button onClick={handleQRCode} size="lg" className="w-full text-base sm:text-lg">
              產生 QR code
            </Button>
          )}

          <Button onClick={onPurchase} size="lg" className="w-full text-base sm:text-lg">
            {buttonLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
