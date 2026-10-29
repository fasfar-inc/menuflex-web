import { NextResponse } from "next/server";
import { slugForCode } from "@/lib/menuflex/public";

/**
 * A QR code's stable address. It never changes, even if the restaurant's slug
 * does, and leads to the current menu while the restaurant is published.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const slug = await slugForCode((await params).code);
  const to = new URL(slug ? `/m/${slug}/` : "/", request.url);
  return NextResponse.redirect(to, { status: 307 });
}
