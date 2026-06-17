import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  height?: number;
  href?: string;
}

export function Logo({ className, height = 28, href = "/" }: LogoProps) {
  const width = Math.round(height * (1024 / 278));

  const image = (
    <Image
      src="/ritl-logo.png"
      alt="RITL"
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
