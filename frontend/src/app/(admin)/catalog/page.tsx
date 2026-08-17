"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/movies";
import CreateEventModal from "@/components/CreateEventModal";

export default function CatalogPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/catalog/movies?page=${page}`);
        if (!res.ok) throw new Error("Erro ao buscar catálogo");
        const data = await res.json();
        setMovies(data);
      } catch (error) {
        console.error("Falha na requisição:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCatalog();
  }, [page, API_URL]);

  return (
    <main className="min-h-screen bg-[#f8f1e7] p-8 text-[#2f241d]">
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between border-b border-[#e8dcc8] pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a86f4d]">Admin</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2f241d]">
            Catálogo TMDb
          </h1>
          <p className="mt-1 text-sm text-[#4d3a30]">
            Selecione um filme em cartaz para cadastrar como novo evento.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="animate-pulse text-[#7b4d35]">Carregando filmes...</p>
        </div>
      ) : (
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => (
            <article
              key={movie.tmdb_id}
              className="flex flex-col overflow-hidden rounded-xl border border-[#e8dcc8] bg-[#fffaf3] shadow-sm transition hover:border-[#a86f4d]"
            >
              <div className="relative aspect-[2/3] w-full bg-[#f3e1d4]">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#7b4d35]">
                    Sem pôster
                  </div>
                )}
                <span className="absolute right-2 top-2 rounded text-xs font-semibold border border-[#d7c1a5] bg-[#2f241d]/85 px-2 py-1 text-[#f8f1e7]">
                  ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h2 className="line-clamp-1 text-base font-semibold text-[#2f241d]" title={movie.title}>
                    {movie.title}
                  </h2>
                  <p className="mt-1 text-xs text-[#4d3a30]">
                    Lançamento: {movie.release_date || "Não informada"}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs text-[#5e4a3f]">
                    {movie.overview || "Sem sinopse disponível."}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full cursor-pointer rounded-lg bg-[#7b4d35] px-4 py-2.5 text-xs font-medium text-[#fffaf3] transition hover:bg-[#a86f4d]"
                  onClick={() => setSelectedMovie(movie)}
                >
                  Criar Evento
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <footer className="mx-auto mt-10 flex max-w-7xl items-center justify-center gap-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded bg-[#fffaf3] px-4 py-2 text-xs font-semibold text-[#7b4d35] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-xs text-[#4d3a30]">Página {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="rounded bg-[#fffaf3] px-4 py-2 text-xs font-semibold text-[#7b4d35]"
        >
          Próxima
        </button>
      </footer>

      <CreateEventModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </main>
  );
}