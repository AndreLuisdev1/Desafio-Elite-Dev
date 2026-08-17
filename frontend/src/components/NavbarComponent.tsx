import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-[#e8dcc8] bg-[#fffaf3]/95 px-8 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#7b4d35] transition hover:opacity-90"
        >
          <span>🎬</span>
          <span>CineEventos</span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium text-[#4d3a30] sm:gap-6">
          <Link href="/" className="transition hover:text-[#7b4d35]">
            Sessões
          </Link>
          <Link href="/tickets" className="transition hover:text-[#7b4d35]">
            Ingressos
          </Link>
          <Link href="/catalog" className="rounded-lg bg-[#7b4d35] px-3.5 py-1.5 text-xs font-semibold text-[#fffaf3] transition hover:bg-[#a86f4d]">
            + Catálogo TMDb
          </Link>
          <Link href="/scanner" className="rounded-lg border border-[#d7c1a5] bg-[#f8f1e7] px-3.5 py-1.5 text-xs font-semibold text-[#7b4d35] transition hover:bg-[#f3e1d4]">
            Scanner
          </Link>
        </div>
      </div>
    </nav>
  );
}