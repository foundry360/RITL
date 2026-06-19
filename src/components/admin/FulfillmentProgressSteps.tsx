import {
  formatRoastifyStatusLabel,
  getRoastifyStatusColors,
} from "@/lib/roastify/fulfillment-progress";
import { cn } from "@/lib/utils";

interface FulfillmentProgressStepsProps {
  status?: string | null;
  className?: string;
}

function StatusDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

export function FulfillmentProgressSteps({
  status,
  className,
}: FulfillmentProgressStepsProps) {
  if (!status?.trim()) {
    return <span className="text-text-muted">—</span>;
  }

  const colors = getRoastifyStatusColors(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase ring-1",
        className
      )}
      style={{
        backgroundColor: colors.badgeBg,
        color: colors.badgeText,
        boxShadow: `inset 0 0 0 1px ${colors.badgeRing}`,
      }}
    >
      <StatusDot color={colors.dot} />
      {formatRoastifyStatusLabel(status)}
    </span>
  );
}
