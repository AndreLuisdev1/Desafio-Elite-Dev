"use client";

import { useState } from "react";
import { Movie } from "@/types/movies";

interface CreateEventModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ movie, isOpen, onClose }: CreateEventModalProps) {
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
      organizer_id: 1 // ID do organizador cadastrado para testes
    };

    try {
      const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <h2 className="text-xl font-bold mb-2">Criar Sessão: {movie.title}</h2>
        <p className="text-xs text-slate-400 mb-4 line-clamp-2">{movie.overview}</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Data e Horário</label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Local / Sala de Cinema</label>
            <input
              type="text"
              required
              placeholder="Ex: Sala 3 - Shopping Center"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preço do Ingresso (R$)</label>
              <input
                type="number"
                step="0.50"
                min="1"
                required
                placeholder="25.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Capacidade (Assentos)</label>
              <input
                type="number"
                min="5"
                max="200"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Criando..." : "Confirmar e Gerar Sala"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}