export const FULFILLMENT_PROGRESS_STEPS = [
  "created",
  "picked",
  "printed",
  "packaged",
  "shipped",
] as const;

export type FulfillmentProgressStep = (typeof FULFILLMENT_PROGRESS_STEPS)[number];

/**
 * Status colors aligned with the Roastify merchant order timeline / simulator.
 */
export const ROASTIFY_STATUS_COLORS: Record<
  FulfillmentProgressStep | "canceled",
  { dot: string; badgeBg: string; badgeRing: string; badgeText: string }
> = {
  created: {
    dot: "#94A3B8",
    badgeBg: "rgba(148, 163, 184, 0.14)",
    badgeRing: "rgba(148, 163, 184, 0.38)",
    badgeText: "#CBD5E1",
  },
  picked: {
    dot: "#0EA5E9",
    badgeBg: "rgba(14, 165, 233, 0.14)",
    badgeRing: "rgba(14, 165, 233, 0.38)",
    badgeText: "#7DD3FC",
  },
  printed: {
    dot: "#8B5CF6",
    badgeBg: "rgba(139, 92, 246, 0.14)",
    badgeRing: "rgba(139, 92, 246, 0.38)",
    badgeText: "#C4B5FD",
  },
  packaged: {
    dot: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.14)",
    badgeRing: "rgba(245, 158, 11, 0.38)",
    badgeText: "#FCD34D",
  },
  shipped: {
    dot: "#22C55E",
    badgeBg: "rgba(34, 197, 94, 0.14)",
    badgeRing: "rgba(34, 197, 94, 0.38)",
    badgeText: "#86EFAC",
  },
  canceled: {
    dot: "#EF4444",
    badgeBg: "rgba(239, 68, 68, 0.14)",
    badgeRing: "rgba(239, 68, 68, 0.38)",
    badgeText: "#FCA5A5",
  },
};

const STEP_LABELS: Record<FulfillmentProgressStep, string> = {
  created: "Created",
  picked: "Picked",
  printed: "Printed",
  packaged: "Packaged",
  shipped: "Shipped",
};

export function normalizeRoastifyProgressStatus(
  status?: string | null
): FulfillmentProgressStep | "canceled" | undefined {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "canceled";
  }

  if (
    FULFILLMENT_PROGRESS_STEPS.includes(normalized as FulfillmentProgressStep)
  ) {
    return normalized as FulfillmentProgressStep;
  }

  return undefined;
}

export function getFulfillmentStepLabel(
  step: FulfillmentProgressStep
): string {
  return STEP_LABELS[step];
}

export function formatRoastifyStatusLabel(status?: string | null): string {
  const normalized = normalizeRoastifyProgressStatus(status);
  if (!normalized) {
    return status?.trim() || "—";
  }

  if (normalized === "canceled") {
    return "Canceled";
  }

  return getFulfillmentStepLabel(normalized);
}

export type FulfillmentStepState = "completed" | "current" | "upcoming";

export function getFulfillmentStepState(
  step: FulfillmentProgressStep,
  currentStatus?: string | null
): FulfillmentStepState {
  const normalized = normalizeRoastifyProgressStatus(currentStatus);
  if (!normalized || normalized === "canceled") {
    return "upcoming";
  }

  const currentIndex = FULFILLMENT_PROGRESS_STEPS.indexOf(normalized);
  const stepIndex = FULFILLMENT_PROGRESS_STEPS.indexOf(step);

  if (stepIndex < currentIndex) {
    return "completed";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

export function getRoastifyStatusColors(status?: string | null) {
  const normalized = normalizeRoastifyProgressStatus(status);
  if (!normalized) {
    return ROASTIFY_STATUS_COLORS.created;
  }

  return ROASTIFY_STATUS_COLORS[normalized];
}
