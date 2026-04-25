import { isDashboardAuthorized } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET() {
  const logs = await prisma.eventLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return ok(logs);
}

export async function DELETE() {
  if (!isDashboardAuthorized()) return fail("Потрібна авторизація.", 401);
  await prisma.eventLog.deleteMany({});
  return ok({ cleared: true });
}
