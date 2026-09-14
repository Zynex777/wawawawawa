import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const loja = await prisma.loja.update({
      where: { id: params.id },
      data: { templateLink: body.templateLink ? String(body.templateLink) : null },
    });
    return NextResponse.json(loja);
  } catch (e) {
    return respostaErro(e, "PATCH /api/lojas/[id]");
  }
}
