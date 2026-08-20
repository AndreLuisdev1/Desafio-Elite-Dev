"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SharedTicket = {
  ticket_code: string;
  status: "VALID" | "USED" | "CANCELLED";
  event_title: string;
  event_date: string;
  event_location: string;
  seat_number: string | null;
};

export default function SharedTicketPage() {
  const { code } = useParams<{ code: string }>();
  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTicket() {
      try {
        const response = await fetch(`${API_URL}/tickets/share/${encodeURIComponent(code)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Ingresso não encontrado.");
        setTicket(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o ingresso.");
      } finally {
        setLoading(false);
      }
    }

    if (code) void loadTicket();
  }, [code]);

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-stone-500">Carregando ingresso...</main>;
  }

  if (error || !ticket) {
    return <main className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-rose-800">{error || "Ingresso não encontrado."}</main>;
  }

  const isValid = ticket.status === "VALID";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ticket.ticket_code)}`;

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <section className="mx-auto max-w-lg rounded-3xl border border-[#E5DDD0] bg-[#FAF7F2] p-6 shadow-xl sm:p-8">
        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isValid ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-stone-300 bg-stone-200 text-stone-600"}`}>
          {isValid ? "Ingresso válido" : "Ingresso utilizado"}
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-stone-900">{ticket.event_title}</h1>
        <div className="mt-5 space-y-2 text-sm text-stone-600">
          <p><strong>Data:</strong> {formatDate(ticket.event_date)}</p>
          <p><strong>Local:</strong> {ticket.event_location}</p>
          <p><strong>Assento:</strong> {ticket.seat_number || "Livre"}</p>
        </div>
        <div className="mt-7 flex flex-col items-center rounded-2xl border border-[#E5DDD0] bg-white p-5">
          <img src={qrUrl} alt={`QR Code ${ticket.ticket_code}`} className={`h-52 w-52 ${isValid ? "" : "grayscale opacity-40"}`} />
          <p className="mt-3 font-mono text-xs font-bold text-stone-500">{ticket.ticket_code}</p>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-stone-500">Este link exibe apenas os dados necessários para compartilhar o ingresso.</p>
      </section>
    </main>
  );
}
