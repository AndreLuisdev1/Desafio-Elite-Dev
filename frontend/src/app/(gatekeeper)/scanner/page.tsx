"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ValidationResult {
  status: "AUTHORIZED";
  message: string;
  event: string;
  attendee: string;
  seat: string | null;
}

export default function ScannerPage() {
  const { token } = useAuth();

  const [code, setCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function validateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setError("Informe o código do ingresso para continuar.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/tickets/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticket_code: normalizedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Não foi possível validar este ingresso.");
      }

      setResult(data);
      setCode("");
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Erro ao conectar ao servidor de validação."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-start">
        {/* Formulário de Validação */}
        <section className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-7 sm:p-10 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Portaria ativa
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-4">
                Liberar entrada
              </h1>
              <p className="text-sm text-stone-600 mt-2 max-w-md">
                Valide o ingresso antes de permitir o acesso à sessão.
              </p>
            </div>
          </div>

          <form onSubmit={validateTicket} className="mt-10">
            <label
              htmlFor="ticket-code"
              className="block text-xs font-bold text-stone-800 mb-2"
            >
              Código do ingresso
            </label>
            <div className="flex gap-2">
              <input
                id="ticket-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="TKT-XXXXXXXXXX"
                autoComplete="off"
                className="min-w-0 flex-1 bg-white border border-[#D5CBB9] rounded-xl px-4 py-3 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-stone-50 py-3.5 rounded-xl text-xs font-bold transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Validando ingresso..." : "Validar e liberar entrada"}
            </button>
          </form>

          {error && (
            <div
              role="alert"
              className="mt-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium"
            >
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div
              role="status"
              className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <div>
                  <p className="text-sm font-extrabold text-emerald-950">
                    Entrada liberada
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Ingresso validado com sucesso.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-emerald-200 text-xs">
                <div>
                  <p className="text-emerald-700">Participante</p>
                  <p className="font-bold text-emerald-950 mt-0.5">
                    {result.attendee}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-700">Assento</p>
                  <p className="font-bold text-emerald-950 mt-0.5">
                    {result.seat || "Livre"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-emerald-700">Sessão</p>
                  <p className="font-bold text-emerald-950 mt-0.5">
                    {result.event}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Instruções do Procedimento */}
        <aside className="bg-stone-900 text-stone-50 rounded-3xl p-7 sm:p-8 shadow-xs">
          <p className="text-[10px] font-bold tracking-widest uppercase text-amber-300">
            Procedimento
          </p>
          <h2 className="text-xl font-extrabold mt-3">Uma entrada por vez</h2>

          <div className="mt-7 space-y-5">
            {[
              "Cole o código exibido no ingresso digital.",
              "Confirme os dados do participante e da sessão.",
              "Permita a entrada somente após a aprovação.",
            ].map((step, index) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-amber-300 text-stone-900 text-xs font-extrabold flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-sm text-stone-300 leading-6">{step}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}