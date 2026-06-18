import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";

interface LogoProps {
  className?: string;
  height?: number;
  href?: string;
}

const LOGO_ASPECT_RATIO = 977 / 255;

export function Logo({ className, height = 28, href = "/" }: LogoProps) {
  const width = Math.round(height * LOGO_ASPECT_RATIO);

  const image = (
    <Image
      src="/ritul-logo.png"
      alt={BRAND_NAME}
      width={width}
      height={height}
      priority
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-80">
      {image}
    </Link>
  );
}
