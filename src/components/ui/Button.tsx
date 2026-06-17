import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-steel-silver/40 bg-steel-silver/10 text-text-primary hover:bg-steel-silver/20 hover:border-steel-silver/60",
  outline:
    "border border-graphite bg-transparent text-text-primary hover:border-steel-silver/40 hover:bg-graphite/50",
  ghost:
    "border border-transparent bg-transparent text-text-secondary hover:text-text-primary hover:bg-graphite/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs tracking-[0.12em] uppercase",
  md: "px-6 py-3 text-xs tracking-[0.14em] uppercase",
  lg: "px-8 py-4 text-sm tracking-[0.12em] uppercase",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[8px] font-medium transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  href,
  children,
}: {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-[8px] font-medium transition-all duration-300",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </a>
  );
}
