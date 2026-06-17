import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-xs tracking-[0.2em] uppercase text-text-muted font-medium",
        className
      )}
    >
      {children}
    </p>
  );
}

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        "text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-text-primary leading-[1.1]",
        className
      )}
    >
      {children}
    </Tag>
  );
}
