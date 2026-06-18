import { notFound } from "next/navigation";
import { EmailPreviewPanel } from "@/components/admin/EmailPreviewPanel";

export default function DevEmailPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-near-black px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs tracking-[0.14em] uppercase text-text-muted">
            Local preview only
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-text-primary">
            Email templates
          </h1>
        </div>
        <EmailPreviewPanel previewApiPath="/api/dev/emails" />
      </div>
    </div>
  );
}
