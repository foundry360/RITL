import type { Product } from "@/lib/stripe/products";
import { cn } from "@/lib/utils";

interface ProductMediaProps {
  product: Product;
  className?: string;
  aspectClassName?: string;
}

function ProductPlaceholder({ variant }: { variant: "focus" | "matcha" }) {
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "h-20 w-20 rounded-full border opacity-20",
            variant === "focus" ? "border-steel-silver" : "border-violet-gray"
          )}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-near-black/60 to-transparent" />
      <div className="absolute inset-0 flex items-end p-5">
        <span className="text-[10px] tracking-[0.25em] uppercase text-text-muted">
          Image Placeholder
        </span>
      </div>
    </>
  );
}

function ProductViewer({ product }: { product: Product }) {
  return (
    <iframe
      src={product.viewerUrl}
      title={`${product.name} 3D preview`}
      className="absolute inset-0 h-full w-full border-0"
      loading="lazy"
      allow="fullscreen"
    />
  );
}

export function ProductMedia({
  product,
  className,
  aspectClassName = "aspect-[3/4]",
}: ProductMediaProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[4px] bg-near-black",
        aspectClassName,
        !product.viewerUrl &&
          (product.variant === "focus"
            ? "bg-gradient-to-br from-near-black to-soft-black"
            : "bg-gradient-to-br from-soft-black to-near-black"),
        className
      )}
    >
      {product.viewerUrl ? (
        <ProductViewer product={product} />
      ) : (
        <ProductPlaceholder variant={product.variant} />
      )}
    </div>
  );
}
