"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CreateEventPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  // Campos do formulário (compatíveis com EventCreate do FastAPI)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("Sala IMAX 01 - Cinema Boulevard");
  const [price, setPrice] = useState("35.00");
  const [capacity, setCapacity] = useState("50");
  const [posterUrl, setPosterUrl] = useState("");
  const [tmdbId, setTmdbId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Proteção da rota para Organizadores
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ORGANIZER") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  // Define uma data padrão (amanhã às 20:00)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    setDate(tomorrow.toISOString().slice(0, 16));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        date: new Date(date).toISOString(),
        location: location.trim(),
        price: parseFloat(price),
        capacity: parseInt(capacity, 10),
        poster_url: posterUrl.trim() || undefined,
        tmdb_id: tmdbId ? parseInt(tmdbId, 10) : undefined,
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
        const errData = await res.json();
        throw new Error(errData.detail || "Erro ao cadastrar evento no banco de dados.");
      }

      const data = await res.json();
      setSuccess(true);

      setTimeout(() => {
        router.push(`/events/${data.event_id || ""}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function formatPreviewDate(val: string) {
    if (!val) return "Data não informada";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "Data inválida";
    return d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-[calc(100vh-70px)] flex items-center justify-center text-xs text-stone-500">
        Verificando permissões de organizador...
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
      {/* Cabeçalho */}
      <section className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-8 shadow-xs">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-purple-900 uppercase bg-purple-100 border border-purple-300 px-3 py-1 rounded-full">
            Painel do Organizador
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-3">
            Cadastrar Nova Sessão
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Preencha os detalhes da exibição. O backend gerará as poltronas automaticamente no banco.
          </p>
        </div>

        <Link
          href="/catalog"
          className="bg-white hover:bg-stone-50 border border-[#D5CBB9] text-stone-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-2xs"
        >
          🔍 Importar do Catálogo TMDb
        </Link>
      </section>

      {/* Alertas */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl mb-6 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl mb-6 text-xs font-medium">
          ✅ Sessão criada com sucesso! Redirecionando para o mapa de assentos...
        </div>
      )}

      {/* Grid: Formulário + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário */}
        <div className="lg:col-span-7 bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Título do Filme / Evento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Oppenheimer"
                className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Sinopse / Descrição *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sinopse detalhada da exibição..."
                className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Data e Horário *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Local / Sala *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Sala IMAX 01"
                  className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Preço do Ingresso (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Capacidade Total *
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  O backend distribuirá os assentos em fileiras (A até E).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  URL da Imagem do Poster
                </label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ID TMDb (Opcional)
                </label>
                <input
                  type="number"
                  value={tmdbId}
                  onChange={(e) => setTmdbId(e.target.value)}
                  placeholder="Ex: 872585"
                  className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-stone-50 font-semibold text-xs py-3.5 rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-white rounded-full animate-spin" />
                  <span>Registrando Sessão e Gerando Assentos...</span>
                </>
              ) : (
                "Salvar e Publicar Sessão"
              )}
            </button>
          </form>
        </div>

        {/* Pré-visualização do Card da Vitrine */}
        <div className="lg:col-span-5 bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-6 shadow-xs sticky top-24">
          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Pré-visualização do Card
            </span>
            <p className="text-xs text-stone-400">Assim os clientes verão sua sessão na Home:</p>
          </div>

          <article className="bg-white border border-[#E5DDD0] rounded-2xl overflow-hidden shadow-xs">
            <div className="relative h-64 w-full bg-stone-200 overflow-hidden flex items-center justify-center">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={title || "Poster"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-xs text-stone-400 font-medium">Sem imagem de capa</span>
              )}
              <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-stone-50 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700/50">
                R$ {price ? parseFloat(price || "0").toFixed(2) : "0.00"}
              </div>
            </div>

            <div className="p-5">
              <h2 className="text-base font-bold text-stone-900 truncate">
                {title || "Título da Sessão"}
              </h2>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                {description || "A sinopse do filme aparecerá aqui para os espectadores."}
              </p>

              <div className="mt-4 pt-4 border-t border-stone-100 space-y-1.5 text-xs text-stone-700">
                <p>🗓️ <strong>Data:</strong> {formatPreviewDate(date)}</p>
                <p>📍 <strong>Local:</strong> {location || "Não especificado"}</p>
                <p>💺 <strong>Capacidade:</strong> {capacity || 50} poltronas</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}