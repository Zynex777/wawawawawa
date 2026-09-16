import { createClient } from "@supabase/supabase-js";

export const BUCKET_VIDEOS = "videos";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    throw new Error(
      "Storage não configurado: faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente"
    );
  }
  return createClient(url, chave);
}

export async function garantirBucketVideos() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.storage.getBucket(BUCKET_VIDEOS);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET_VIDEOS, {
      public: true,
      fileSizeLimit: "200MB",
    });
    // Ignora erro de "já existe" (corrida entre requisições simultâneas na primeira vez)
    if (error && !error.message.includes("already exists")) throw error;
  }
}
