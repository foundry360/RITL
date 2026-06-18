import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";

interface BrandNameProps {
  className?: string;
  suffix?: string;
}

export function BrandName({ className, suffix }: BrandNameProps) {
  return (
    <span className={cn("inline", className)}>
      {BRAND_NAME}
      {suffix}
    </span>
  );
}
