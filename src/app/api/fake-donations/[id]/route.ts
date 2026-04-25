import { isDashboardAuthorized } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isDashboardAuthorized()) return fail("Потрібна авторизація.", 401);
  await prisma.fakeDonation.delete({
    where: { id: params.id },
  });
  return ok({ deleted: true });
}
