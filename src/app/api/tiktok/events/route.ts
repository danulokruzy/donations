import { fail, ok } from "@/server/http";
import { prisma } from "@/server/prisma";
import { runMatchedActions } from "@/server/actions/engine";

type TikTokGiftEvent = {
  type: "gift";
  giftId: string;
  giftName: string;
  coins: number;
  donorName?: string;
};

type TikTokLikeEvent = {
  type: "like";
  likeCount: number;
  donorName?: string;
};

type TikTokSubscribeEvent = {
  type: "subscribe";
  donorName?: string;
};

type TikTokCommandEvent = {
  type: "command";
  commandText: string;
  donorName?: string;
};

type Payload = TikTokGiftEvent | TikTokLikeEvent | TikTokSubscribeEvent | TikTokCommandEvent;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Payload | null;
  if (!body?.type) return fail("Некоректна подія TikTok.", 400);

  if (body.type === "gift") {
    await prisma.giftCatalog.upsert({
      where: { giftId: body.giftId },
      update: {
        name: body.giftName,
        coins: Number(body.coins),
        lastSeenAt: new Date(),
        isActive: true,
      },
      create: {
        giftId: body.giftId,
        name: body.giftName,
        coins: Number(body.coins),
        provider: "tiktok",
      },
    });

    const donation = await prisma.donation.create({
      data: {
        donorName: body.donorName?.trim() || "TikTok Viewer",
        message: `TikTok gift: ${body.giftName}`,
        channel: "UAH",
        amountOriginal: 0,
        amountLabel: "TikTok gift",
        amountUah: 0,
        isAnonymous: false,
      },
    });

    const actions = await runMatchedActions({
      donationId: donation.id,
      channel: "UAH",
      amountUah: 0,
      giftName: body.giftName,
      giftCoins: Number(body.coins),
    });

    return ok({ received: true, actions });
  }

  if (body.type === "like") {
    const donation = await prisma.donation.create({
      data: {
        donorName: body.donorName?.trim() || "TikTok Viewer",
        message: `TikTok лайки: ${body.likeCount}`,
        channel: "UAH",
        amountOriginal: 0,
        amountLabel: "TikTok likes",
        amountUah: 0,
      },
    });

    const actions = await runMatchedActions({
      donationId: donation.id,
      channel: "UAH",
      amountUah: 0,
      likeCount: Number(body.likeCount),
    });

    return ok({ received: true, actions });
  }

  if (body.type === "subscribe") {
    const donation = await prisma.donation.create({
      data: {
        donorName: body.donorName?.trim() || "TikTok Viewer",
        message: "TikTok підписка",
        channel: "UAH",
        amountOriginal: 0,
        amountLabel: "TikTok subscribe",
        amountUah: 0,
      },
    });

    const actions = await runMatchedActions({
      donationId: donation.id,
      channel: "UAH",
      amountUah: 0,
      isSubscribe: true,
    });

    return ok({ received: true, actions });
  }

  const donation = await prisma.donation.create({
    data: {
      donorName: body.donorName?.trim() || "TikTok Viewer",
      message: `Команда: ${body.commandText}`,
      channel: "UAH",
      amountOriginal: 0,
      amountLabel: "TikTok command",
      amountUah: 0,
    },
  });

  const actions = await runMatchedActions({
    donationId: donation.id,
    channel: "UAH",
    amountUah: 0,
    commandText: body.commandText,
  });

  return ok({ received: true, actions });
}
