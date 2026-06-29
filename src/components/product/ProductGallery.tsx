"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { Product, ProductGalleryItem } from "@/lib/stripe/products";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  product: Product;
  className?: string;
}

function GalleryNavButton({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick: () => void;
}) {
  const label = direction === "previous" ? "Previous image" : "Next image";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[8px] border border-graphite bg-near-black/80 text-text-primary backdrop-blur-sm transition-colors",
        direction === "previous" ? "left-3" : "right-3",
        "hover:border-steel-silver/50 hover:bg-soft-black/90"
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="h-4 w-4"
      >
        {direction === "previous" ? (
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M7.5 5L12.5 10L7.5 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
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
      key={item.viewerUrl}
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
  const thumbSrc = item.type === "image" ? item.src : item.thumbnailSrc;
  const label = item.label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.type === "image" ? item.alt : item.label || item.alt}
      aria-pressed={isActive}
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-[8px] border bg-near-black transition-colors",
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
            className={
              item.type === "viewer" ? "object-contain p-1" : "object-cover"
            }
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
  const hasMultipleImages = gallery.length > 1;

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current === 0 ? gallery.length - 1 : current - 1
    );
  }, [gallery.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((current) =>
      current === gallery.length - 1 ? 0 : current + 1
    );
  }, [gallery.length]);

  if (!activeItem) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[8px] border border-graphite bg-near-black">
        <GalleryMain item={activeItem} productName={product.name} />

        {hasMultipleImages && (
          <>
            <GalleryNavButton direction="previous" onClick={goToPrevious} />
            <GalleryNavButton direction="next" onClick={goToNext} />
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex justify-center gap-2">
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
