import { prisma } from "@/server/prisma";

export async function getLastDonations(limit = 20) {
  return prisma.donation.findMany({
    where: { isFake: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getTopDonors(limit = 3) {
  const rows = await prisma.donation.groupBy({
    by: ["donorName"],
    _sum: { amountUah: true },
    where: { isFake: false },
    orderBy: {
      _sum: {
        amountUah: "desc",
      },
    },
    take: limit,
  });

  return rows.map((row) => ({
    donorName: row.donorName,
    totalUah: Number((row._sum.amountUah ?? 0).toFixed(2)),
  }));
}

export async function getAlertsFeed(limit = 30, includeFake = true) {
  const donations = await prisma.donation.findMany({
    where: includeFake ? {} : { isFake: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return donations.map((item) => ({
    id: item.id,
    donorName: item.donorName,
    amountUah: item.amountUah,
    channel: item.channel,
    message: item.message,
    isFake: item.isFake,
    createdAt: item.createdAt,
  }));
}

export async function getFakeBattle(limit = 20) {
  const fake = await prisma.fakeDonation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const grouped = new Map<string, number>();
  for (const row of fake) {
    grouped.set(row.donorName, (grouped.get(row.donorName) ?? 0) + row.amountUah);
  }

  const top3 = Array.from(grouped.entries())
    .map(([donorName, totalUah]) => ({ donorName, totalUah }))
    .sort((a, b) => b.totalUah - a.totalUah)
    .slice(0, 3);

  return {
    entries: fake,
    top3,
  };
}
