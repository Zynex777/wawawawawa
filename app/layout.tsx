import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/store";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Afiliado Multipost",
  description: "Cole o link, gere o vídeo, poste em todos os canais de uma vez.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
