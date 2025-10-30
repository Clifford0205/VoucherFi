"use client";

import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";

interface Product {
  id: number;
  title: string;
  brand: string;
  description: string;
  image: string;
  value: number;
}

interface ProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: () => void | Promise<void>;
}

export const ProductDialog = ({ product, isOpen, onOpenChange, onPurchase }: ProductDialogProps) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-0">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">{product.title}</DialogTitle>
          <DialogDescription className="text-lg text-center">{product.brand}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Product Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">商品描述</h4>
              <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-lg font-semibold">價格</span>
              <div className="text-right">
                <div className="text-3xl font-bold">{product.value}</div>
                <div className="text-sm text-muted-foreground">ETH</div>
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          <Button onClick={onPurchase} size="lg" className="w-full text-lg">
            確定購買
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
