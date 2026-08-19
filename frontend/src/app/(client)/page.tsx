"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { EventItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HomePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`${API_URL}/events`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Erro ao carregar lista de sessões.");
        }
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || "Não foi possível conectar ao servidor.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
      {/* Banner de Boas-Vindas */}
      <section className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-8 sm:p-10 shadow-xs">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold tracking-widest text-amber-900 uppercase bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
            Programação do Cinema
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-3">
            Sessões em Cartaz
          </h1>
          <p className="text-sm text-stone-600 mt-2">
            Escolha seu filme, selecione a poltrona em tempo real e receba seu ingresso digital com QR Code.
          </p>
        </div>

        {user?.role === "ORGANIZER" && (
          <Link
            href="/catalog"
            className="mt-6 sm:mt-0 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold px-5 py-3 rounded-2xl shadow-xs transition cursor-pointer"
          >
            + Criar Nova Sessão
          </Link>
        )}
      </section>

      {/* Alerta de erro */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl mb-8 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Grid de Cards dos Eventos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl h-96 animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-12 text-center my-6">
          <span className="text-4xl">🎬</span>
          <h2 className="text-lg font-bold text-stone-800 mt-3">
            Nenhuma sessão em cartaz no momento
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {user?.role === "ORGANIZER"
              ? "Acesse o catálogo do organizador para cadastrar novas exibições."
              : "Novos filmes serão disponibilizados em breve. Volte mais tarde!"}
          </p>
          {user?.role === "ORGANIZER" && (
            <Link
              href="/catalog"
              className="inline-block mt-5 bg-stone-900 text-stone-50 text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition"
            >
              Ir para o Catálogo TMDb
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <article
              key={event.id}
              className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              {/* Imagem do Poster */}
              <div className="relative h-72 w-full bg-stone-200 overflow-hidden">
                {event.poster_url ? (
                  <img
                    src={event.poster_url}
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                    Sem poster disponível
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-stone-50 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700/50">
                  R$ {Number(event.price).toFixed(2)}
                </div>
              </div>

              {/* Informações da Sessão */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 tracking-tight line-clamp-1">
                    {event.title}
                  </h2>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                    {event.description || "Nenhuma sinopse informada."}
                  </p>

                  <div className="mt-4 pt-4 border-t border-[#E5DDD0] space-y-2 text-xs text-stone-700">
                    <div className="flex items-center gap-2">
                      <span>🗓️</span>
                      <span className="font-semibold capitalize">{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="truncate">{event.location}</span>
                    </div>
                    {event.organizer_name && (
                      <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                        <span>👤</span>
                        <span>{event.organizer_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de Redirecionamento para a Seleção de Assentos */}
                <Link
                  href={`/events/${event.id}`}
                  className="mt-6 w-full text-center bg-amber-900 hover:bg-amber-950 text-amber-50 text-xs font-semibold py-3 rounded-xl transition duration-150 shadow-xs block"
                >
                  Selecionar Assentos
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}