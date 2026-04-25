import { ok } from "@/server/http";
import {
  getAlertsFeed,
  getFakeBattle,
  getLastDonations,
  getTopDonors,
} from "@/server/widgets/feed";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "30");
  const includeFake = url.searchParams.get("includeFake") !== "false";

  if (params.slug === "last-donations") {
    return ok(await getLastDonations(limit));
  }
  if (params.slug === "top-donors") {
    return ok(await getTopDonors(Math.min(10, limit)));
  }
  if (params.slug === "alerts-feed") {
    return ok(await getAlertsFeed(limit, includeFake));
  }
  if (params.slug === "fake-battle") {
    return ok(await getFakeBattle(limit));
  }

  return ok([]);
}
