import Image from "next/image";
import type { Product } from "@/lib/stripe/products";

interface OrderLineItemThumbnailProps {
  product: Product;
}

export function OrderLineItemThumbnail({ product }: OrderLineItemThumbnailProps) {
  if (!product.thumbnailSrc) {
    return (
      <div
        className="h-20 w-16 shrink-0 rounded-[4px] border border-graphite bg-elevated"
        aria-hidden
      />
    );
  }

  return (
    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[4px] border border-graphite bg-near-black">
      <Image
        src={product.thumbnailSrc}
        alt={product.name}
        fill
        className="object-cover object-center"
        sizes="64px"
      />
    </div>
  );
}
