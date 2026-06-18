import { escapeHtml } from "@/lib/email/escape-html";
import {
  EMAIL_BRAND_NAME,
  EMAIL_COLORS,
  EMAIL_FONTS,
  getEmailAppUrl,
  getEmailLogoUrl,
} from "@/lib/email/brand-tokens";

export interface EmailShellInput {
  headline: string;
  introHtml: string;
  bodyHtml?: string;
  footerHtml?: string;
}

export function buildEmailShell(input: EmailShellInput): string {
  const bodySection = input.bodyHtml
    ? `<div style="padding: 0 28px 28px;">${input.bodyHtml}${input.footerHtml ?? ""}</div>`
    : input.footerHtml
      ? `<div style="padding: 0 28px 28px;">${input.footerHtml}</div>`
      : "";

  return `
    <div style="margin: 0; padding: 32px 16px; background: ${EMAIL_COLORS.pageBg}; font-family: ${EMAIL_FONTS.sans}; color: ${EMAIL_COLORS.textPrimary};">
      <div style="max-width: 560px; margin: 0 auto; background: ${EMAIL_COLORS.cardBg}; border-radius: 8px; overflow: hidden;">
        <div style="padding: 28px 28px 0;">
          <img src="${escapeHtml(getEmailLogoUrl())}" alt="${escapeHtml(EMAIL_BRAND_NAME)}" width="128" height="33" style="display: block; margin: 0 0 20px; height: auto; max-width: 128px;" />
          <h1 style="margin: 0 0 12px; font-family: ${EMAIL_FONTS.serif}; font-size: 28px; font-weight: 400; line-height: 1.2; color: ${EMAIL_COLORS.textPrimary};">${escapeHtml(input.headline)}</h1>
          <div style="font-size: 15px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">
            ${input.introHtml}
          </div>
        </div>
        ${bodySection}
      </div>
      <p style="max-width: 560px; margin: 16px auto 0; font-size: 12px; line-height: 1.5; color: ${EMAIL_COLORS.textLabel}; text-align: center;">
        ${escapeHtml(EMAIL_BRAND_NAME)} · <a href="${escapeHtml(getEmailAppUrl())}" style="color: ${EMAIL_COLORS.textMuted}; text-decoration: underline;">getritul.com</a>
      </p>
    </div>
  `;
}

export function emailSectionLabel(
  text: string,
  options?: { first?: boolean }
): string {
  const marginTop = options?.first ? "28px" : "36px";
  return `<h2 style="margin: ${marginTop} 0 12px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${EMAIL_COLORS.textLabel}; font-weight: 600;">${escapeHtml(text)}</h2>`;
}

export function emailMutedText(text: string): string {
  return `<p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted};">${escapeHtml(text)}</p>`;
}

export function emailStageBadge(label: string): string {
  return `<p style="margin: 16px 0 0; display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${EMAIL_COLORS.textPrimary}; background: ${EMAIL_COLORS.cardBorder};">${escapeHtml(label)}</p>`;
}
