"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MovieTMDb } from "@/types";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: MovieTMDb | null;
  onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CreateEventModal({
  isOpen,
  onClose,
  movie,
  onSuccess,
}: CreateEventModalProps) {
  const { token } = useAuth();

  const [date, setDate] = useState("");
  const [location, setLocation] = useState("Sala IMAX 01 - Cinema Boulevard");
  const [price, setPrice] = useState("35.00");
  const [capacity, setCapacity] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(20, 0, 0, 0);
      setDate(tomorrow.toISOString().slice(0, 16));
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !movie) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!movie) return;

    setError(null);
    setLoading(true);

    try {
      if (!token) {
        throw new Error("Sua sessão expirou. Entre novamente para criar um evento.");
      }

      const eventDate = new Date(date);
      const eventPrice = Number(price);
      const eventCapacity = Number(capacity);

      if (Number.isNaN(eventDate.getTime())) {
        throw new Error("Informe uma data e horário válidos.");
      }

      if (!Number.isFinite(eventPrice) || eventPrice <= 0) {
        throw new Error("Informe um preço válido.");
      }

      if (!Number.isInteger(eventCapacity) || eventCapacity <= 0) {
        throw new Error("Informe uma capacidade válida.");
      }

      const payload = {
        title: movie.title,
        description: movie.overview,
        date: eventDate.toISOString(),
        location: location.trim(),
        price: eventPrice,
        capacity: eventCapacity,
        tmdb_id: movie.tmdb_id || movie.id,
        poster_url: movie.poster_url,
      };

      const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const responseText = await res.text();
        let message = "Falha ao criar sessão do evento.";

        if (responseText) {
          try {
            const errData = JSON.parse(responseText);
            message = errData.detail || message;
          } catch {
            message = responseText;
          }
        }

        throw new Error(message);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#E5DDD0] bg-[#FAF7F2] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5DDD0] px-6 py-5 sm:px-8">
          <div>
            <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900">
              Nova sessão
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-900">{movie.title}</h2>
            <p className="mt-1 text-xs text-stone-500">Defina os detalhes e publique o evento com seus assentos.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D5CBB9] bg-white text-lg font-bold text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800 sm:mx-8">
            <span aria-hidden="true">!</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex gap-4 rounded-2xl border border-[#E5DDD0] bg-white p-4">
            {movie.poster_url && (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-44 w-28 shrink-0 rounded-xl object-cover shadow-sm"
              />
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900">Filme selecionado</p>
              <p className="mt-2 line-clamp-7 text-sm leading-6 text-stone-600">
                {movie.overview || "Sem sinopse disponível."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-700">Data e horário</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-700">Local ou sala</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Sala IMAX 01 - Cinema Boulevard"
                className="w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-stone-700">Preço (R$)</label>
              <input
                type="number"
                step="0.50"
                min="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-700">Capacidade</label>
              <input
                type="number"
                min="10"
                max="200"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-amber-900 focus:ring-2 focus:ring-amber-900/20"
              />
            </div>
          </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#E5DDD0] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#E5DDD0] px-5 py-3 text-xs font-bold text-stone-800 transition hover:bg-[#D5CBB9]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-stone-950 px-6 py-3 text-xs font-bold text-stone-50 shadow-lg transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Publicando..." : "Criar sessão e assentos"}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}