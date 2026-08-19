"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();

  const roleBadgeStyles: Record<string, string> = {
    ORGANIZER: "bg-purple-100 text-purple-900 border-purple-300",
    GATEKEEPER: "bg-emerald-100 text-emerald-900 border-emerald-300",
    CLIENT: "bg-amber-100 text-amber-900 border-amber-300",
  };

  const roleLabels: Record<string, string> = {
    ORGANIZER: "Organizador",
    GATEKEEPER: "Portaria",
    CLIENT: "Cliente",
  };

  return (
    <header className="bg-[#EFE9DF] border-b border-[#DFD7C8] px-6 sm:px-10 py-3.5 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link 
          href="/" 
          className="font-bold text-lg text-amber-950 tracking-tight flex items-center gap-2 hover:opacity-90 transition"
        >
          <span className="text-xl">🎬</span>
          <span className="font-extrabold tracking-tight">CineEventos</span>
        </Link>

        {/* Links de Navegação por Papel */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-stone-700">
          <Link 
            href="/" 
            className="hover:text-amber-950 transition-colors"
          >
            Sessões
          </Link>

          {user?.role === "CLIENT" && (
            <Link 
              href="/tickets" 
              className="hover:text-amber-950 transition-colors"
            >
              Meus Ingressos
            </Link>
          )}

          {user?.role === "ORGANIZER" && (
            <>
              <Link 
                href="/catalog" 
                className="hover:text-amber-950 transition-colors"
              >
                Catálogo TMDb
              </Link>
              <Link 
                href="/scanner" 
                className="hover:text-amber-950 transition-colors"
              >
                Portaria
              </Link>
            </>
          )}

          {user?.role === "GATEKEEPER" && (
            <Link 
              href="/scanner" 
              className="hover:text-amber-950 transition-colors"
            >
              📷 Leitor Portaria
            </Link>
          )}

          <div className="h-4 w-px bg-[#D5CBB9]" />

          {/* Área de Autenticação / Perfil */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-stone-900">
                  {user.name}
                </span>
                <span 
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border self-end uppercase ${roleBadgeStyles[user.role] || "bg-stone-100 text-stone-800 border-stone-300"}`}
                >
                  {roleLabels[user.role] || user.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="bg-[#E5DDD0] hover:bg-[#D5CBB9] text-stone-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-stone-800 hover:text-stone-950 px-3 py-1.5"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-stone-900 hover:bg-stone-800 text-stone-50 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
              >
                Cadastrar
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}