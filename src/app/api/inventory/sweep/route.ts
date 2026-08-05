import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { releaseExpiredReservations } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * Releases stock held by checkouts that were never paid.
 *
 * The same sweep runs opportunistically on checkout and on the gateway page,
 * so this endpoint is a safety net for a quiet shop: without it, an abandoned
 * order placed at 2am keeps its units off the shelf until the next visitor
 * happens to trigger a sweep.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/inventory/sweep
 *
 * Unprotected sweeping would let anyone cancel unpaid orders on demand, so
 * without `CRON_SECRET` configured the route stays closed.
 */
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const offered = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!offered) return false;

  const a = Buffer.from(offered);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const released = await releaseExpiredReservations();
  return NextResponse.json({ released });
}
