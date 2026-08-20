"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MovieTMDb } from "@/types";
import CreateEventModal from "@/components/CreateEventModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CatalogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [movies, setMovies] = useState<MovieTMDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedMovie, setSelectedMovie] = useState<MovieTMDb | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function getErrorMessage(responseText: string, fallback: string) {
    if (!responseText) return fallback;

    try {
      const data = JSON.parse(responseText);
      return data.detail || fallback;
    } catch {
      return responseText;
    }
  }

  // Proteção de rota para Organizadores
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ORGANIZER") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  // Normaliza o retorno do backend (caso venha array direto ou objeto { results: [] })
  const normalizeMovies = (data: any): MovieTMDb[] => {
    const list = Array.isArray(data) ? data : data?.results || [];
    return list.map((m: any) => ({
      id: m.id || m.tmdb_id,
      tmdb_id: m.tmdb_id || m.id,
      title: m.title,
      overview: m.overview || "Sinopse não informada.",
      poster_url: m.poster_url || (m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : ""),
      vote_average: m.vote_average,
    })).filter((m: MovieTMDb) => m.poster_url);
  };

  // 1. Carrega filmes em cartaz via GET /catalog/movies
  const loadNowPlaying = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/catalog/movies?page=${page}`);
      if (!res.ok) {
        throw new Error(getErrorMessage(await res.text(), "Erro ao carregar catálogo."));
      }
      const data = await res.json();
      setMovies(normalizeMovies(data));
      setCurrentPage(data?.page || page);
      setTotalPages(data?.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Falha ao conectar com o backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ORGANIZER") {
      loadNowPlaying();
    }
  }, [user, loadNowPlaying]);

  function handleOpenModal(movie: MovieTMDb) {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  }

  function handleEventCreated() {
    setSuccessMessage("Evento criado com sucesso. Os assentos já foram gerados!");
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages || page === currentPage || loading) return;
    loadNowPlaying(page);
    document.getElementById("catalogo-filmes")?.scrollIntoView({ behavior: "smooth" });
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-[calc(100vh-70px)] flex items-center justify-center text-xs text-stone-500">
        Verificando permissões de acesso...
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-stone-950 px-6 py-8 text-stone-50 shadow-xl sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-amber-400/20" />
        <div className="absolute bottom-[-5rem] right-24 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Painel do organizador
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Monte a próxima sessão.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
              Escolha um filme, defina horário e sala. O sistema publica o evento e prepara o mapa de assentos automaticamente.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => document.getElementById("catalogo-filmes")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-stone-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-300"
            >
              Escolher filme <span aria-hidden="true">↓</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/catalog/events")}
              className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-xs font-semibold text-stone-200 transition hover:border-stone-500 hover:bg-stone-800"
            >
              Meus eventos
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="relative mt-5 flex items-center justify-between gap-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs font-medium text-emerald-100">
            <span><span aria-hidden="true">✓</span> {successMessage}</span>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="shrink-0 font-bold text-emerald-200 underline underline-offset-2 hover:text-white"
            >
              Ver vitrine
            </button>
          </div>
        )}

        {error && (
          <div className="relative mt-5 flex flex-col gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs font-medium text-rose-100 sm:flex-row sm:items-center sm:justify-between">
            <span><span aria-hidden="true">!</span> {error}</span>
            <button
              type="button"
              onClick={() => loadNowPlaying(currentPage)}
              className="w-fit font-bold text-rose-200 underline underline-offset-2 hover:text-white"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </section>

      <section id="catalogo-filmes" className="mt-10 scroll-mt-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-900">Filmes em destaque</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-900">Escolha um filme para criar sua sessão</h2>
          </div>
        </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[470px] animate-pulse rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2]"
            />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CDBEAA] bg-[#FAF7F2] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-900">⌕</div>
          <h3 className="mt-4 text-lg font-bold text-stone-900">Nenhum filme encontrado</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">Tente outra busca ou crie uma sessão manualmente.</p>
          <button
            type="button"
            onClick={() => router.push("/catalog/events")}
            className="mt-5 rounded-xl bg-stone-900 px-5 py-3 text-xs font-bold text-stone-50 transition hover:bg-amber-900"
          >
            Criar evento manualmente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          {movies.map((movie) => (
            <article
              key={movie.tmdb_id || movie.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl"
            >
              <div className="relative h-80 w-full overflow-hidden bg-stone-200">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/70 to-transparent" />
                {movie.vote_average !== undefined && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-xl border border-white/20 bg-stone-950/75 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md">
                    <span aria-hidden="true">★</span>
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                <span className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">Disponível para sessão</span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h2 className="line-clamp-1 text-base font-bold tracking-tight text-stone-900">
                    {movie.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-600">
                    {movie.overview}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenModal(movie)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-xs font-bold text-stone-50 shadow-sm transition duration-150 hover:bg-amber-900"
                >
                  <span className="text-base leading-none" aria-hidden="true">+</span> Criar sessão
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && movies.length > 0 && totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Paginação do catálogo">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-xl border border-[#D9CCBB] bg-[#FAF7F2] px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:border-amber-400 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="min-w-24 text-center text-xs font-bold text-stone-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-stone-50 transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima →
          </button>
        </nav>
      )}

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        movie={selectedMovie}
        onSuccess={handleEventCreated}
      />
      </section>
    </main>
  );
}