import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUsuario } from "@/lib/usuario";

export const dynamic = "force-dynamic";

export async function GET() {
  const usuario = await getOrCreateUsuario();
  const canais = await prisma.canal.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { rede: "asc" },
  });
  return NextResponse.json(canais);
}
