import { NextResponse } from "next/server";
import { getRoastifyStatus } from "@/lib/roastify/catalog-api";

export async function GET() {
  const status = await getRoastifyStatus();
  return NextResponse.json(status);
}
