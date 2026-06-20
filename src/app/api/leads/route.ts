import { NextRequest, NextResponse } from "next/server";
import { isGhlConfigured } from "@/lib/gohighlevel/config";
import { syncGhlWebsiteLead } from "@/lib/gohighlevel/sync-website-lead";

interface LeadRequestBody {
  name?: string;
  email?: string;
  company?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  if (!isGhlConfigured()) {
    return NextResponse.json(
      { error: "Lead capture is not configured yet" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as LeadRequestBody;

    if (body.company?.trim()) {
      return NextResponse.json({ success: true });
    }

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (name.length > 120) {
      return NextResponse.json(
        { error: "Name must be 120 characters or fewer" },
        { status: 400 }
      );
    }

    const result = await syncGhlWebsiteLead({ name, email });

    return NextResponse.json({
      success: true,
      contactId: result.contactId,
      created: result.created,
      tag: result.tag,
    });
  } catch (error) {
    console.error("Website lead sync error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save your details";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
