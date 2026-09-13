"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Radio,
  Store,
  Download,
  Film,
  Send,
  History,
} from "lucide-react";

const itens = [
  { href: "/", label: "Painel", icon: LayoutGrid },
  { href: "/canais", label: "Canais", icon: Radio },
  { href: "/lojas", label: "Lojas", icon: Store },
  { href: "/produtos/importar", label: "Importar", icon: Download },
  { href: "/videos", label: "Vídeos", icon: Film },
  { href: "/postar", label: "Postar", icon: Send },
  { href: "/historico", label: "Histórico", icon: History },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-line md:px-4 md:py-6">
        <div className="mb-8 px-2">
          <p className="text-lg font-bold leading-tight">Afiliado Multipost</p>
          <p className="text-sm text-muted">um link, todos os canais</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {itens.map(({ href, label, icon: Icon }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  ativo ? "bg-ink text-paper" : "text-ink/80 hover:bg-line/60"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Header — mobile */}
      <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
        <p className="font-bold">Afiliado Multipost</p>
      </header>

      <main className="flex-1 px-4 py-6 pb-24 md:px-10 md:py-10 md:pb-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-paper/95 backdrop-blur md:hidden">
        {itens.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                ativo ? "text-cobalt" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={ativo ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
