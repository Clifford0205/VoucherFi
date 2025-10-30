"use client";

import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";

interface Product {
  id: number;
  title: string;
  brand: string;
  description: string;
  image: string;
  value: number;
}

interface TabMallContentProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export const TabMallContent = ({ products, onProductClick }: TabMallContentProps) => {
  return (
    <div className="p-4 mt-0 flex flex-col items-center space-y-6">
      {products.map(product => (
        <Card
          key={product.id}
          onClick={() => onProductClick(product)}
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
                      <div className="text-3xl font-bold text-foreground">{product.value}</div>
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
  );
};
