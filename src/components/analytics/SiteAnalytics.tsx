"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { getGoogleAnalyticsId } from "@/lib/analytics/config";

const EXCLUDED_PATH_PREFIXES = ["/admin"] as const;

function shouldTrackPath(pathname: string): boolean {
  return !EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const gaId = getGoogleAnalyticsId();

  if (!gaId || !shouldTrackPath(pathname)) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
