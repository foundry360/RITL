"use client";

import { GoogleAnalytics, sendGAEvent } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { getGoogleAnalyticsId } from "@/lib/analytics/config";

const EXCLUDED_PATH_PREFIXES = ["/admin"] as const;

function shouldTrackPath(pathname: string): boolean {
  return !EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildPagePath(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gaId = getGoogleAnalyticsId();
  const previousPagePath = useRef<string | null>(null);

  useEffect(() => {
    if (!gaId || !shouldTrackPath(pathname)) {
      previousPagePath.current = null;
      return;
    }

    const pagePath = buildPagePath(pathname, searchParams);

    if (previousPagePath.current === pagePath) {
      return;
    }

    const isInitialPageView = previousPagePath.current === null;
    previousPagePath.current = pagePath;

    // GoogleAnalytics already records the first page view when the tag loads.
    if (isInitialPageView) {
      return;
    }

    sendGAEvent("config", gaId, {
      page_path: pagePath,
      page_title: document.title,
    });
  }, [pathname, searchParams, gaId]);

  if (!gaId || !shouldTrackPath(pathname)) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
