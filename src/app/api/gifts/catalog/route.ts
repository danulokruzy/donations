import { isDashboardAuthorized } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET() {
  const items = await prisma.giftCatalog.findMany({
    where: { isActive: true },
    orderBy: [{ coins: "asc" }, { name: "asc" }],
    take: 1000,
  });
  return ok(items);
}

export async function POST(request: Request) {
  if (!isDashboardAuthorized()) return fail("Потрібна авторизація.", 401);
  const body = (await request.json().catch(() => null)) as
    | {
        provider?: string;
        giftId?: string;
        name?: string;
        coins?: number;
      }
    | null;

  const giftId = body?.giftId?.trim();
  const name = body?.name?.trim();
  if (!giftId || !name) {
    return fail("giftId і name є обов'язковими.", 400);
  }

  const gift = await prisma.giftCatalog.upsert({
    where: { giftId },
    update: {
      name,
      coins: body?.coins != null ? Number(body.coins) : 1,
      lastSeenAt: new Date(),
      isActive: true,
    },
    create: {
      provider: body?.provider?.trim() || "tiktok",
      giftId,
      name,
      coins: body?.coins != null ? Number(body.coins) : 1,
    },
  });
  return ok(gift);
}
