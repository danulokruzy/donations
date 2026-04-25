import { ensureBootstrap } from "@/server/bootstrap";
import { ok } from "@/server/http";
import { prisma } from "@/server/prisma";
import { CHECK_STATUS } from "@/server/domain";

export async function GET() {
  await ensureBootstrap();
  const [connections, settings, actionsCount, giftsCount, checksCount, donationsCount, bridge] =
    await Promise.all([
      prisma.connection.findFirst({ orderBy: { updatedAt: "desc" } }),
      prisma.paymentSettings.findFirst({ orderBy: { updatedAt: "desc" } }),
      prisma.action.count(),
      prisma.giftCatalog.count({ where: { isActive: true } }),
      prisma.donationCheck.count({ where: { status: CHECK_STATUS.PENDING } }),
      prisma.donation.count(),
      prisma.bridgeClient.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  return ok({
    connections,
    settings,
    metrics: {
      actionsCount,
      giftsCount,
      checksCount,
      donationsCount,
      bridgeCount: bridge.length,
    },
    bridgeClients: bridge,
  });
}
