"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/movies";

export default function CatalogPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
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
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo TMDb</h1>
          <p className="text-slate-400 text-sm mt-1">
            Selecione um filme em cartaz para cadastrar como novo evento.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-slate-400 animate-pulse">Carregando filmes...</p>
        </div>
      ) : (
        <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <article
              key={movie.tmdb_id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col hover:border-slate-700 transition duration-200"
            >
              <div className="relative aspect-[2/3] w-full bg-slate-800">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Sem pôster
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded text-xs font-semibold text-amber-400 border border-slate-700">
                  ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <h2 className="font-semibold text-base line-clamp-1" title={movie.title}>
                    {movie.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Lançamento: {movie.release_date || "Não informada"}
                  </p>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-3">
                    {movie.overview || "Sem sinopse disponível."}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition duration-150 cursor-pointer"
                  onClick={() => alert(`Filme selecionado: ${movie.title}`)}
                >
                  Criar Evento
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Paginação Simples */}
      <footer className="max-w-7xl mx-auto mt-10 flex justify-center items-center gap-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="text-xs text-slate-400">Página {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700"
        >
          Próxima
        </button>
      </footer>
    </main>
  );
}