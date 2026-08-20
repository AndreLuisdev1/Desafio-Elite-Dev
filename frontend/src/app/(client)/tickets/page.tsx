"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TicketItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MyTicketsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function fetchMyTickets() {
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/tickets/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Erro ao carregar seus ingressos.");
        }

        const data = await res.json();
        setTickets(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user && token) {
      fetchMyTickets();
    }
  }, [user, token, authLoading, router]);

  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function shareTicket(ticketCode: string) {
    const shareUrl = `${window.location.origin}/share/${encodeURIComponent(ticketCode)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meu ingresso", url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        window.alert("Link do ingresso copiado.");
      }
    } catch {
      // Cancelar o compartilhamento nativo não deve exibir erro.
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-70px)] flex items-center justify-center text-xs text-stone-500">
        Carregando seus ingressos digitais...
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
      {/* Banner */}
      <section className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-8 shadow-xs mb-8">
        <span className="text-[11px] font-bold tracking-widest text-amber-900 uppercase bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
          Carteira Digital
        </span>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-3">
          Meus Ingressos
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Apresente o QR Code na portaria do cinema para liberar seu acesso.
        </p>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs mb-6 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Lista de Ingressos */}
      {tickets.length === 0 ? (
        <div className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-12 text-center">
          <span className="text-4xl">🎟️</span>
          <h2 className="text-lg font-bold text-stone-800 mt-3">Nenhum ingresso encontrado</h2>
          <p className="text-xs text-stone-500 mt-1">
            Você ainda não comprou ingressos para as sessões disponíveis.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-5 bg-stone-900 text-stone-50 text-xs font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Ver Sessões em Cartaz
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {tickets.map((ticket) => {
            const isUsed = ticket.status === "USED";
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
              ticket.ticket_code
            )}`;

            return (
              <article
                key={ticket.id}
                className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6 items-center justify-between"
              >
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isUsed
                          ? "bg-stone-200 border-stone-300 text-stone-600"
                          : "bg-emerald-100 border-emerald-300 text-emerald-900"
                      }`}
                    >
                      {isUsed ? "Utilizado" : "Ingresso Válido"}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-400">
                      #{ticket.ticket_code}
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-stone-900">{ticket.event_title}</h2>

                  <div className="text-xs text-stone-600 space-y-1">
                    <p>🗓️ <strong>Data:</strong> {formatDate(ticket.event_date)}</p>
                    <p>📍 <strong>Local:</strong> {ticket.event_location}</p>
                    <p>💺 <strong>Assento:</strong> Poltrona {ticket.seat_number}</p>
                    <p>👤 <strong>Titular:</strong> {ticket.user_name}</p>
                  </div>
                </div>

                {/* QR Code de Entrada */}
                <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-[#E5DDD0] shadow-2xs">
                  <img
                    src={qrUrl}
                    alt={`QR Code ${ticket.ticket_code}`}
                    className={`w-36 h-36 ${isUsed ? "opacity-30 grayscale" : ""}`}
                  />
                  <span className="text-[10px] font-mono font-semibold text-stone-500 mt-2">
                    {ticket.ticket_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => shareTicket(ticket.ticket_code)}
                    className="mt-3 rounded-lg bg-stone-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-amber-900"
                  >
                    Compartilhar ingresso
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}