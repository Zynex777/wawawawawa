import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usuario = await getOrCreateUsuario();
    const canais = await prisma.canal.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { rede: "asc" },
    });
    return NextResponse.json(canais);
  } catch (e) {
    return respostaErro(e, "GET /api/canais");
  }
}
