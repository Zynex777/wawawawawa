import { NextResponse } from "next/server";
import { supabaseAdmin, garantirBucketVideos, BUCKET_VIDEOS } from "@/lib/supabase-admin";
import { respostaErro } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nomeOriginal = String(body.nomeArquivo ?? "video.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");
    const caminho = `${Date.now()}-${nomeOriginal}`;

    await garantirBucketVideos();

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.storage.from(BUCKET_VIDEOS).createSignedUploadUrl(caminho);
    if (error) throw error;

    return NextResponse.json({ caminho: data.path, token: data.token });
  } catch (e) {
    return respostaErro(e, "POST /api/upload");
  }
}
