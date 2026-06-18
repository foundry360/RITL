import { NextRequest, NextResponse } from "next/server";
import {
  EMAIL_PREVIEW_TEMPLATES,
  type EmailPreviewTemplateId,
  renderEmailPreview,
} from "@/lib/email/preview";

function isEmailPreviewTemplateId(value: string): value is EmailPreviewTemplateId {
  return EMAIL_PREVIEW_TEMPLATES.some((template) => template.id === value);
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const template = request.nextUrl.searchParams.get("template");
  if (!template || !isEmailPreviewTemplateId(template)) {
    return NextResponse.json(
      {
        error: "Invalid template",
        templates: EMAIL_PREVIEW_TEMPLATES.map((entry) => entry.id),
      },
      { status: 400 }
    );
  }

  const { html } = renderEmailPreview(template);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
