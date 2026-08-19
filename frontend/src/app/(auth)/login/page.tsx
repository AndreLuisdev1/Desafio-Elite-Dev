"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] flex items-center justify-center p-6 bg-[#F9F6F0]">
      <div className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-sm">
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <span className="text-3xl">🎬</span>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-2">
            Bem-vindo de volta
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Informe suas credenciais para acessar sua conta.
          </p>
        </div>

        {/* Feedback de Erro */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl mb-5 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@cine.com"
              className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 transition"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Senha
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-stone-50 font-semibold text-xs py-3 rounded-xl transition duration-150 shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-white rounded-full animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              "Entrar na Plataforma"
            )}
          </button>
        </form>

        {/* Rodapé / Link de Cadastro */}
        <div className="mt-8 pt-6 border-t border-[#E5DDD0] text-center">
          <p className="text-xs text-stone-600">
            Ainda não tem uma conta?{" "}
            <Link
              href="/register"
              className="font-bold text-amber-950 hover:underline"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}