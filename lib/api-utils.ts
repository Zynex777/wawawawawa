import { NextResponse } from "next/server";

export function respostaErro(e: unknown, contexto: string) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[${contexto}]`, e);
  return NextResponse.json({ erro: msg }, { status: 500 });
}
