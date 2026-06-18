import { BRAND_NAME } from "@/lib/brand";

/** Email design tokens — align with site CSS vars in globals.css */
export const EMAIL_COLORS = {
  pageBg: "#0e0f12",
  cardBg: "#16181d",
  cardBorder: "#2b2f36",
  textPrimary: "#edeff3",
  textBody: "#c7cbd3",
  textMuted: "#a7adb8",
  textLabel: "#6e7480",
  link: "#edeff3",
  accent: "#e85d24",
} as const;

export const EMAIL_FONTS = {
  sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
} as const;

export function getEmailAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv && !fromEnv.includes("localhost")) {
    return fromEnv.replace(/\/$/, "");
  }
  return "https://www.getritul.com";
}

export function getEmailLogoUrl(): string {
  return `${getEmailAppUrl()}/ritul-logo.png`;
}

export const EMAIL_BRAND_NAME = BRAND_NAME;
