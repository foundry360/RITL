"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product, ProductGalleryItem } from "@/lib/stripe/products";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  product: Product;
  className?: string;
}

function GalleryMain({
  item,
  productName,
}: {
  item: ProductGalleryItem;
  productName: string;
}) {
  if (item.type === "image") {
    return (
      <Image
        src={item.src}
        alt={item.alt}
        fill
        priority
        className={item.fit === "cover" ? "object-cover" : "object-contain"}
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    );
  }

  return (
    <iframe
      src={item.viewerUrl}
      title={item.alt || `${productName} interactive preview`}
      className="absolute inset-0 h-full w-full border-0"
      loading="lazy"
      allow="fullscreen"
    />
  );
}

function GalleryThumbnail({
  item,
  isActive,
  onClick,
}: {
  item: ProductGalleryItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const thumbSrc =
    item.type === "image" ? item.src : item.thumbnailSrc;
  const label = item.label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.type === "image" ? item.alt : item.label || item.alt}
      aria-pressed={isActive}
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-[4px] border bg-near-black transition-colors",
        isActive
          ? "border-steel-silver/60"
          : "border-graphite hover:border-steel-silver/30"
      )}
    >
      {thumbSrc ? (
        <>
          <Image
            src={thumbSrc}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
          />
          {item.type === "viewer" && label && (
            <span className="absolute inset-x-0 bottom-0 bg-near-black/80 py-1 text-[9px] tracking-[0.12em] uppercase text-steel-silver">
              {label}
            </span>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-soft-black">
          <span className="text-[10px] tracking-[0.14em] uppercase text-steel-silver">
            {label || "View"}
          </span>
        </div>
      )}
    </button>
  );
}

export function ProductGallery({ product, className }: ProductGalleryProps) {
  const gallery = product.gallery ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = gallery[activeIndex];

  if (!activeItem) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[4px] border border-graphite bg-near-black">
        <GalleryMain item={activeItem} productName={product.name} />
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2">
          {gallery.map((item, index) => (
            <div key={item.id} className="w-16 shrink-0 sm:w-20">
              <GalleryThumbnail
                item={item}
                isActive={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
