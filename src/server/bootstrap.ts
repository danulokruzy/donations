import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/server/prisma";
import { DEFAULT_WIDGET_PRESETS } from "@/server/constants";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function defaultPassword() {
  return process.env.DASHBOARD_PASSWORD?.trim() || "donatelko";
}

export async function ensureBootstrap() {
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) {
    await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: sha256(defaultPassword()),
      },
    });
  }

  const paymentSettings = await prisma.paymentSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!paymentSettings) {
    await prisma.paymentSettings.create({
      data: {
        minAmountUah: 1,
        maxAmountUah: 10000,
        paymentMemoPrefix: "DON",
        confirmationMode: "semi_auto",
        usdtToUahFallback: 40,
        tonToUahFallback: 250,
      },
    });
  }

  const connection = await prisma.connection.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!connection) {
    await prisma.connection.create({ data: {} });
  }

  for (const preset of DEFAULT_WIDGET_PRESETS) {
    await prisma.widgetPreset.upsert({
      where: { slug: preset.slug },
      update: {},
      create: {
        slug: preset.slug,
        name: preset.name,
        settingsJson: JSON.stringify(preset.settings),
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "dashboardLocale" },
    update: { value: "uk" },
    create: { key: "dashboardLocale", value: "uk" },
  });
}

export async function ensureBridgeClient(machineName = "bridge-local") {
  const existing = await prisma.bridgeClient.findFirst({
    where: { machineName },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  const token = randomBytes(24).toString("hex");
  const tokenHash = sha256(token);
  const bridge = await prisma.bridgeClient.create({
    data: {
      machineName,
      tokenHash,
      enabled: true,
    },
  });

  return { ...bridge, plainToken: token };
}
