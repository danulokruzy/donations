import { ensureBootstrap } from "@/server/bootstrap";
import { ok } from "@/server/http";
import { prisma } from "@/server/prisma";
import { CHECK_STATUS } from "@/server/domain";

export async function GET() {
  await ensureBootstrap();
  const [checks, donations, fake] = await Promise.all([
    prisma.donationCheck.findMany({
      where: { status: CHECK_STATUS.PENDING },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.donation.findMany({
      where: { isFake: false },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.fakeDonation.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return ok({ checks, donations, fakeDonations: fake });
}
