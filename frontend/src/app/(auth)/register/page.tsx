"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CLIENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validações básicas no cliente
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password, role);
    } catch (err: any) {
      setError(err.message || "Erro ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  const roleDescriptions: Record<UserRole, { title: string; desc: string }> = {
    CLIENT: {
      title: "Cliente / Espectador",
      desc: "Comprar ingressos, escolher assentos e acessar QR Codes.",
    },
    ORGANIZER: {
      title: "Organizador / Cinema",
      desc: "Cadastrar novos eventos via catálogo TMDb e gerenciar salas.",
    },
    GATEKEEPER: {
      title: "Portaria / Validador",
      desc: "Acessar o leitor de QR Code para liberar entrada de espectadores.",
    },
  };

  return (
    <main className="min-h-[calc(100vh-65px)] flex items-center justify-center p-6 bg-[#F9F6F0]">
      <div className="bg-[#FAF7F2] border border-[#E5DDD0] rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-sm my-6">
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <span className="text-3xl">🎟️</span>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-2">
            Criar Conta no CineEventos
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Escolha seu perfil e preencha as informações básicas.
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
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: André Silva"
              className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 dígitos"
                className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Confirmar Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full bg-white border border-[#D5CBB9] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900 transition"
              />
            </div>
          </div>

          {/* Seleção Interativa do Perfil (Role) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Selecione o Tipo de Acesso
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(["CLIENT", "ORGANIZER", "GATEKEEPER"] as UserRole[]).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start justify-between cursor-pointer ${
                      isSelected
                        ? "bg-amber-50/70 border-amber-900 ring-1 ring-amber-900"
                        : "bg-white border-[#D5CBB9] hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          isSelected ? "text-amber-950" : "text-stone-800"
                        }`}
                      >
                        {roleDescriptions[r].title}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {roleDescriptions[r].desc}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                        isSelected
                          ? "border-amber-900 bg-amber-900 text-white"
                          : "border-stone-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-stone-50 font-semibold text-xs py-3 rounded-xl transition duration-150 shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-white rounded-full animate-spin" />
                <span>Criando Conta...</span>
              </>
            ) : (
              "Finalizar Cadastro"
            )}
          </button>
        </form>

        {/* Rodapé / Link de Login */}
        <div className="mt-8 pt-6 border-t border-[#E5DDD0] text-center">
          <p className="text-xs text-stone-600">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-amber-950 hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}