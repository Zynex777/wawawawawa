import { createClient } from "@supabase/supabase-js";

let instancia: ReturnType<typeof createClient> | null = null;

export function supabaseBrowser() {
  if (!instancia) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !chave) {
      throw new Error("Storage não configurado (faltam as variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    instancia = createClient(url, chave);
  }
  return instancia;
}
