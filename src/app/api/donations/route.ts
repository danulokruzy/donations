import { ensureBootstrap } from "@/server/bootstrap";
import { isDashboardAuthorized } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { prisma } from "@/server/prisma";
import { CHECK_STATUS } from "@/server/domain";

export async function GET() {
  await ensureBootstrap();
  const [checks, donations] = await Promise.all([
    prisma.donationCheck.findMany({
      where: { status: CHECK_STATUS.PENDING },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return ok({ checks, donations });
}

export async function POST(request: Request) {
  await ensureBootstrap();
  if (!isDashboardAuthorized()) return fail("Потрібна авторизація.", 401);

  const body = (await request.json().catch(() => null)) as {
    donorName?: string;
    amountUah?: number;
    message?: string;
    channel?: string;
  } | null;

  if (!body?.donorName?.trim()) return fail("Вкажіть ім'я.");
  if (!body?.amountUah || body.amountUah <= 0) return fail("Вкажіть суму.");

  const channel = body.channel?.toUpperCase() || "UAH";
  const amount = Number(body.amountUah);

  const donation = await prisma.donation.create({
    data: {
      donorName: body.donorName.trim(),
      message: body.message?.trim() || "",
      channel,
      amountOriginal: amount,
      amountLabel: `${amount} грн`,
      amountUah: amount,
      isAnonymous: false,
      isFake: false,
    },
  });

  await prisma.eventLog.create({
    data: {
      type: "DONATION",
      message: `Створено ручний донат від ${donation.donorName} на ${amount} грн`,
      payloadJson: JSON.stringify({ donationId: donation.id }),
    },
  });

  return ok(donation);
}
