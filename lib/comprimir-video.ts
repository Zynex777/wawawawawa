// Compacta vídeo no próprio navegador antes de enviar (roda no celular do
// usuário, via WebAssembly) — assim um vídeo gravado em alta resolução some
// abaixo do limite do Supabase sem precisar de nenhum servidor de vídeo.
//
// Só entra em ação pra arquivos realmente grandes; vídeos já pequenos são
// enviados como estão (mais rápido, gasta menos bateria).

const LIMITE_SEM_COMPACTAR = 20 * 1024 * 1024; // 20MB

let ffmpegPromise: Promise<any> | null = null;

async function carregarFfmpeg(aoProgredir?: (pct: number) => void) {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  const ffmpeg = await ffmpegPromise;
  if (aoProgredir) {
    ffmpeg.on("progress", ({ progress }: { progress: number }) =>
      aoProgredir(Math.min(99, Math.round(progress * 100)))
    );
  }
  return ffmpeg;
}

export async function comprimirVideo(arquivo: File, aoProgredir?: (pct: number) => void): Promise<File> {
  if (arquivo.size < LIMITE_SEM_COMPACTAR) return arquivo;

  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await carregarFfmpeg(aoProgredir);

  const nomeEntrada = "entrada-" + arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const nomeSaida = "saida.mp4";

  await ffmpeg.writeFile(nomeEntrada, await fetchFile(arquivo));
  await ffmpeg.exec([
    "-i",
    nomeEntrada,
    "-vf",
    "scale=-2:720",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    nomeSaida,
  ]);

  const dados = await ffmpeg.readFile(nomeSaida);
  await ffmpeg.deleteFile(nomeEntrada).catch(() => {});
  await ffmpeg.deleteFile(nomeSaida).catch(() => {});

  const blob = new Blob([dados], { type: "video/mp4" });
  const nomeBase = arquivo.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${nomeBase}-compactado.mp4`, { type: "video/mp4" });
}
