"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { EventItem, Seat } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const selectedSeatRef = useRef<number | null>(null);

  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "PIX">("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const pixCode = "00020126580014BR.GOV.BCB.PIX0136simulacao-cineplex-2026-0000000000005204000053039865802BR5920CINEPLEX SIMULADO6009SAO PAULO62070503***6304FAKE";
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Busca dados da sessão
  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/events/${id}`);
      if (!res.ok) throw new Error("Sessão não encontrada.");
      const data = await res.json();
      setEvent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingEvent(false);
    }
  }, [id]);

  // Busca mapa de assentos da sessão
  const fetchSeats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/events/${id}/seats`);
      if (!res.ok) throw new Error("Erro ao carregar mapa de assentos.");
      const data = await res.json();
      setSeats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSeats(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchSeats();
    }
  }, [id, fetchEvent, fetchSeats]);

  // Libera o bloqueio quando o cliente abandona a tela sem concluir a compra.
  useEffect(() => {
    return () => {
      const seatId = selectedSeatRef.current;
      if (seatId && token) {
        void fetch(`${API_URL}/seats/release`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seat_id: seatId }),
          keepalive: true,
        });
      }
    };
  }, [token]);

  // Ação ao clicar no assento
  async function handleSelectSeat(seat: Seat) {
    if (seat.status === "SOLD") return;

    if (!user || !token) {
      router.push("/login");
      return;
    }

    setError(null);

    async function releaseSeat(seatId: number) {
      const response = await fetch(`${API_URL}/seats/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seat_id: seatId }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível liberar o assento anterior.");
      }
    }

    // Se clicar no mesmo assento, desmarca e libera
    if (selectedSeat?.id === seat.id) {
      try {
        await releaseSeat(seat.id);
        selectedSeatRef.current = null;
        setSelectedSeat(null);
        await fetchSeats();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível liberar o assento.");
      }
      return;
    }

    // Tenta reservar temporariamente o assento selecionado
    try {
      if (selectedSeat) {
        await releaseSeat(selectedSeat.id);
        selectedSeatRef.current = null;
        setSelectedSeat(null);
      }

      const res = await fetch(`${API_URL}/seats/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seat_id: seat.id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Este assento não está disponível.");
      }

      selectedSeatRef.current = seat.id;
      setSelectedSeat({ ...seat, status: "HELD" });
      await fetchSeats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível reservar o assento.");
    }
  }

  // Finaliza a compra
  function openPayment() {
    if (!user || !token) {
      router.push("/login");
      return;
    }

    if (!selectedSeat || !event) {
      setError("Por favor, selecione um assento para continuar.");
      return;
    }

    setPaymentError(null);
    setIsPaymentOpen(true);
  }

  async function handleCheckout() {
    if (!selectedSeat || !event) return;

    if (paymentMethod === "CARD" && cardNumber.replace(/\D/g, "").length < 16) {
      setPaymentError("Informe um número de cartão válido com 16 dígitos.");
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    await new Promise((resolve) => setTimeout(resolve, 900));

    if (paymentMethod === "CARD" && cardNumber.replace(/\D/g, "").endsWith("0000")) {
      setPaymentError("Pagamento recusado na simulação. Tente outro cartão.");
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/tickets/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: event.id,
          seat_id: selectedSeat.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erro ao processar checkout.");
      }

      setSuccessMessage("Ingresso garantido com sucesso! Redirecionando...");
      setIsPaymentOpen(false);
      setTimeout(() => {
        router.push("/tickets");
      }, 1500);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Erro ao processar pagamento.");
      setProcessing(false);
    }
  }

  // Organiza os assentos em linhas para montar a grade (A, B, C...)
  const rows = Array.from(new Set(seats.map((s) => s.seat_number.charAt(0)))).sort();

  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loadingEvent) {
    return (
      <div className="min-h-[calc(100vh-70px)] flex items-center justify-center text-xs text-stone-500">
        Carregando detalhes do filme e mapa de assentos...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl">
        <p className="text-sm text-stone-700 font-medium">Sessão não encontrada.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-stone-900 text-white text-xs px-4 py-2 rounded-xl"
        >
          Voltar à Vitrine
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
      {/* Informações Principais da Sessão */}
      <section className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-6 sm:p-8 shadow-xs mb-10 flex flex-col md:flex-row gap-8 items-start">
        {event.poster_url && (
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full md:w-52 h-72 object-cover rounded-2xl border border-[#D5CBB9] shadow-sm flex-shrink-0"
          />
        )}

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
              Sessão Aberta
            </span>
            <span className="text-xs text-stone-500">
              Organizado por: <strong>{event.organizer_name || "Cineplex"}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-3">
            {event.title}
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed max-w-3xl">
            {event.description || "Nenhuma sinopse cadastrada."}
          </p>

          <div className="mt-6 pt-6 border-t border-[#E5DDD0] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-700">
            <div>
              <p className="text-stone-400 font-medium uppercase text-[10px]">Data & Hora</p>
              <p className="font-semibold text-stone-900 capitalize mt-0.5">
                {formatDate(event.date)}
              </p>
            </div>
            <div>
              <p className="text-stone-400 font-medium uppercase text-[10px]">Local / Sala</p>
              <p className="font-semibold text-stone-900 mt-0.5">{event.location}</p>
            </div>
            <div>
              <p className="text-stone-400 font-medium uppercase text-[10px]">Valor do Ingresso</p>
              <p className="font-bold text-amber-950 text-sm mt-0.5">
                R$ {Number(event.price).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Seleção de Assentos */}
      <section className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-6 sm:p-10 shadow-xs mb-10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-stone-900">Selecione seu Assento</h2>
          <p className="text-xs text-stone-500 mt-1">
            Clique em uma poltrona livre para selecioná-la.
          </p>
        </div>

        {/* Indicador da Tela do Cinema */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="w-full h-3 bg-stone-300 rounded-full shadow-inner mb-2" />
          <p className="text-[10px] text-center font-bold tracking-widest text-stone-400 uppercase">
            TELA DO CINEMA
          </p>
        </div>

        {/* Feedback de erro/sucesso */}
        {error && (
          <div className="max-w-md mx-auto bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl mb-6 text-xs text-center font-medium">
            ⚠️ {error}
          </div>
        )}

        {successMessage && (
          <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl mb-6 text-xs text-center font-medium">
            ✅ {successMessage}
          </div>
        )}

        {/* Mapa Interativo de Poltronas */}
        {loadingSeats ? (
          <div className="text-center text-xs text-stone-400 py-10">
            Carregando poltronas...
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {rows.map((rowLetter) => {
              const rowSeats = seats.filter((s) => s.seat_number.startsWith(rowLetter));
              return (
                <div key={rowLetter} className="flex items-center justify-center gap-2">
                  <span className="w-5 text-xs font-bold text-stone-400 text-right mr-2">
                    {rowLetter}
                  </span>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeat?.id === seat.id;
                      const isSold = seat.status === "SOLD";
                      const isHeld = seat.status === "HELD" && !isSelected;

                      let styleClass =
                        "bg-white border-[#D5CBB9] text-stone-800 hover:border-amber-900 hover:bg-amber-50 cursor-pointer";

                      if (isSold) {
                        styleClass =
                          "bg-stone-300 border-stone-300 text-stone-500 cursor-not-allowed opacity-60";
                      } else if (isHeld) {
                        styleClass =
                          "bg-amber-100 border-amber-300 text-amber-800 cursor-not-allowed";
                      } else if (isSelected) {
                        styleClass =
                          "bg-amber-900 border-amber-900 text-white font-bold ring-2 ring-amber-900/30 cursor-pointer";
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isSold}
                          onClick={() => handleSelectSeat(seat)}
                          className={`w-9 h-9 text-xs rounded-xl border flex items-center justify-center transition font-medium ${styleClass}`}
                          title={`Assento ${seat.seat_number} - ${
                            isSold ? "Ocupado" : isSelected ? "Selecionado" : "Disponível"
                          }`}
                        >
                          {seat.seat_number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-[#E5DDD0] text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-white border border-[#D5CBB9]" />
            <span>Livre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-900" />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-stone-300" />
            <span>Ocupado</span>
          </div>
        </div>

        {/* Resumo da Seleção e Botão Checkout */}
        <div className="mt-8 max-w-md mx-auto bg-white border border-[#E5DDD0] rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-stone-400 uppercase font-semibold">Assento Selecionado</p>
            <p className="text-base font-extrabold text-stone-900 mt-0.5">
              {selectedSeat ? `Poltrona ${selectedSeat.seat_number}` : "Nenhum"}
            </p>
          </div>

          <button
            onClick={openPayment}
            disabled={!selectedSeat || processing}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {processing ? "Processando..." : `Ir para pagamento`}
          </button>
        </div>
      </section>

      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#E5DDD0] bg-[#FAF7F2] p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-900">Pagamento simulado</p>
                <h2 className="mt-1 text-2xl font-black text-stone-900">Finalize seu ingresso</h2>
                <p className="mt-1 text-xs text-stone-500">Poltrona {selectedSeat?.seat_number} · R$ {Number(event.price).toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="h-9 w-9 rounded-full border border-[#D5CBB9] bg-white text-lg leading-none text-stone-700 hover:bg-stone-100"
                aria-label="Fechar pagamento"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {(["CARD", "PIX"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => { setPaymentMethod(method); setPaymentError(null); }}
                  className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${paymentMethod === method ? "border-amber-900 bg-amber-900 text-white" : "border-[#D5CBB9] bg-white text-stone-700 hover:border-amber-700"}`}
                >
                  {method === "CARD" ? "Cartão" : method === "PIX" ? "PIX" : "Boleto"}
                </button>
              ))}
            </div>

            {paymentMethod === "CARD" && (
              <label className="mt-5 block text-xs font-bold text-stone-700">
                Número do cartão
                <input
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value.replace(/[^\d\s]/g, ""))}
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  className="mt-2 w-full rounded-xl border-[#D5CBB9] bg-white px-4 py-3 text-sm font-normal text-stone-900 outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                />
              </label>
            )}

            {paymentMethod === "PIX" && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-950">
                <div
                  className="mx-auto h-36 w-36 rounded-xl border-8 border-white bg-white shadow-sm"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, #292524 0 3px, transparent 3px 7px), repeating-linear-gradient(-45deg, #292524 0 2px, transparent 2px 6px)",
                  }}
                  aria-label="QR Code PIX fictício"
                  role="img"
                />
                <p className="mt-3 font-bold">QR Code PIX fictício</p>
                <p className="mt-1 text-[11px] text-amber-900/80">Esta é uma simulação. Nenhum pagamento real será realizado.</p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    readOnly
                    value={pixCode}
                    className="min-w-0 flex-1 rounded-lg border-amber-200 bg-white px-2 py-2 text-[10px] text-stone-600"
                    aria-label="Código PIX fictício"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(pixCode);
                      setPixCopied(true);
                      setTimeout(() => setPixCopied(false), 2000);
                    }}
                    className="shrink-0 rounded-lg bg-amber-900 px-3 py-2 text-[10px] font-bold text-white hover:bg-amber-950"
                  >
                    {pixCopied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            {paymentError && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">{paymentError}</p>}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={processing}
              className="mt-6 w-full rounded-xl bg-stone-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60"
            >
              {processing ? "Processando pagamento..." : `Confirmar pagamento · R$ ${Number(event.price).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}