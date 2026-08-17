"use client";

import { useState } from "react";
import { Movie } from "@/types/movies";

interface CreateEventModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEventModal({
  movie,
  isOpen,
  onClose,
}: CreateEventModalProps) {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !movie) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!movie) return;
    setLoading(true);
    setError(null);

    const payload = {
      title: movie.title,
      description: movie.overview,
      poster_url: movie.poster_url,
      tmdb_id: movie.tmdb_id,
      date: new Date(date).toISOString(),
      location,
      price: parseFloat(price),
      capacity: parseInt(capacity),
      organizer_id: 1, // ID padrão para testes locais
    };

    try {
      const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao cadastrar evento");
      }

      alert("Evento e mapa de assentos criados com sucesso!");
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
      <div className="bg-[#FAF7F2] border border-[#E5DDD0] text-stone-900 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">
          Criar Sessão: {movie.title}
        </h2>
        <p className="text-xs text-stone-600 mt-1 mb-5 line-clamp-2 leading-relaxed">
          {movie.overview || "Sem sinopse informada."}
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl mb-4 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Data e Horário
            </label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Local / Sala de Cinema
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Sala 3 - Shopping Center"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Preço do Ingresso (R$)
              </label>
              <input
                type="number"
                step="0.50"
                min="1"
                required
                placeholder="25.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Capacidade (Assentos)
              </label>
              <input
                type="number"
                min="5"
                max="200"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-[#E5DDD0] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium rounded-xl bg-[#EFE9DF] hover:bg-[#E5DDD0] text-stone-700 border border-[#D5CBB9] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-900 hover:bg-amber-800 text-stone-50 transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? "Criando..." : "Confirmar e Gerar Sala"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}