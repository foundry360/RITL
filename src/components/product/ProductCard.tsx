"use client";

import type { Product } from "@/lib/stripe/products";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ProductMedia } from "@/components/product/ProductMedia";
import { ButtonLink } from "@/components/ui/Button";
import { usePricing } from "@/context/PricingContext";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { getPriceLabel, isReady } = usePricing();

  return (
    <article className="group overflow-hidden rounded-[4px] border border-graphite bg-near-black transition-colors hover:border-graphite/80 hover:bg-soft-black/40">
      <ProductMedia product={product} />

      <div className="p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={cn(
                "inline-block text-[10px] tracking-[0.2em] uppercase mb-2",
                product.variant === "focus" ? "text-steel-silver" : "text-violet-gray"
              )}
            >
              {product.variant === "focus" ? "Precision" : "Calm Focus"}
            </span>
            <h3 className="text-xl font-light tracking-tight text-text-primary">
              {product.name}
            </h3>
          </div>
          <span className="text-base font-light text-text-secondary tabular-nums">
            {isReady ? getPriceLabel(product.id, "one-time") : "—"}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-text-secondary line-clamp-2">
          {product.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href={`/products/${product.id}`} variant="outline" size="sm">
            Details
          </ButtonLink>
          <AddToCartButton productId={product.id} size="sm" />
          <ButtonLink href={`/checkout/${product.id}`} variant="primary" size="sm">
            Buy Now
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
