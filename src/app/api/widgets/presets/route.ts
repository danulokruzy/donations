import { isDashboardAuthorized } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET() {
  const presets = await prisma.widgetPreset.findMany({
    orderBy: { createdAt: "asc" },
  });
  return ok(presets);
}

export async function POST(request: Request) {
  if (!isDashboardAuthorized()) return fail("Потрібна авторизація.", 401);
  const body = (await request.json().catch(() => null)) as
    | {
        slug?: string;
        name?: string;
        settings?: Record<string, unknown>;
        isActive?: boolean;
      }
    | null;

  const slug = body?.slug?.trim();
  if (!slug) return fail("slug є обов'язковим.", 400);

  const preset = await prisma.widgetPreset.upsert({
    where: { slug },
    update: {
      name: body?.name?.trim() || slug,
      settingsJson: JSON.stringify(body?.settings || {}),
      isActive: body?.isActive ?? true,
    },
    create: {
      slug,
      name: body?.name?.trim() || slug,
      settingsJson: JSON.stringify(body?.settings || {}),
      isActive: body?.isActive ?? true,
    },
  });

  return ok(preset);
}
