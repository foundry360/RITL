"use client";

import { useState } from "react";
import { EMAIL_PREVIEW_TEMPLATES, type EmailPreviewTemplateId } from "@/lib/email/preview";
import { cn } from "@/lib/utils";

interface EmailPreviewPanelProps {
  previewApiPath?: string;
}

export function EmailPreviewPanel({
  previewApiPath = "/api/admin/email-preview",
}: EmailPreviewPanelProps) {
  const [activeTemplate, setActiveTemplate] = useState<EmailPreviewTemplateId>(
    EMAIL_PREVIEW_TEMPLATES[0]?.id ?? "confirmation"
  );

  const activeLabel =
    EMAIL_PREVIEW_TEMPLATES.find((template) => template.id === activeTemplate)
      ?.label ?? activeTemplate;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {EMAIL_PREVIEW_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setActiveTemplate(template.id)}
            className={cn(
              "rounded-[8px] border px-3 py-2 text-xs tracking-[0.12em] uppercase transition-colors",
              activeTemplate === template.id
                ? "border-graphite bg-graphite text-text-primary"
                : "border-graphite/60 text-text-muted hover:border-graphite hover:text-text-primary"
            )}
          >
            {template.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[8px] border border-graphite">
        <div className="border-b border-graphite bg-soft-black/40 px-4 py-3 text-xs tracking-[0.12em] uppercase text-text-muted">
          {activeLabel}
        </div>
        <iframe
          key={activeTemplate}
          title={`Email preview: ${activeLabel}`}
          src={`${previewApiPath}?template=${activeTemplate}`}
          className="h-[min(900px,85vh)] w-full"
        />
      </div>
    </div>
  );
}
