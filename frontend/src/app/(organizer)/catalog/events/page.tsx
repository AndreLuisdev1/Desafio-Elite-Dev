"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { EventItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type EventForm = {
  title: string;
  description: string;
  date: string;
  location: string;
  price: string;
  poster_url: string;
};

const emptyForm: EventForm = { title: "", description: "", date: "", location: "", price: "", poster_url: "" };

function toInputDate(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}

async function getResponseMessage(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    return JSON.parse(text).detail || fallback;
  } catch {
    return text;
  }
}

export default function OrganizerEventsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ORGANIZER")) {
      router.push(user ? "/" : "/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!token || user?.role !== "ORGANIZER") return;
    async function loadEvents() {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/events`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(await getResponseMessage(response, "Não foi possível carregar os eventos."));
        setEvents(await response.json());
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erro ao carregar eventos.");
      } finally {
        setLoading(false);
      }
    }
    void loadEvents();
  }, [token, user]);

  function openEditor(event: EventItem) {
    setEditingEvent(event);
    setForm({ title: event.title, description: event.description || "", date: toInputDate(event.date), location: event.location, price: String(event.price), poster_url: event.poster_url || "" });
    setError(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEvent || !token) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() || null, date: new Date(form.date).toISOString(), location: form.location.trim(), price: Number(form.price), poster_url: form.poster_url.trim() || null }),
      });
      if (!response.ok) throw new Error(await getResponseMessage(response, "Não foi possível atualizar o evento."));
      const updatedEvent: EventItem = await response.json();
      setEvents((current) => current.map((item) => item.id === updatedEvent.id ? updatedEvent : item));
      setEditingEvent(null);
      setNotice("Evento atualizado com sucesso.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao atualizar evento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: EventItem) {
    if (!token || !window.confirm(`Excluir o evento "${event.title}"? Essa ação não pode ser desfeita.`)) return;
    setError(null);
    try {
      const response = await fetch(`${API_URL}/events/${event.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(await getResponseMessage(response, "Não foi possível excluir o evento."));
      setEvents((current) => current.filter((item) => item.id !== event.id));
      setNotice("Evento excluído com sucesso.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro ao excluir evento.");
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (authLoading || !user || user.role !== "ORGANIZER") {
    return <div className="min-h-[calc(100vh-70px)] flex items-center justify-center text-xs text-stone-500">Verificando permissões...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
      <section className="rounded-3xl bg-stone-950 px-7 py-8 text-stone-50 shadow-xl sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">Gestão de eventos</span><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Eventos publicados</h1><p className="mt-2 max-w-xl text-sm leading-6 text-stone-300">Edite os dados da sessão ou remova eventos que não estarão mais em cartaz.</p></div>
          <button type="button" onClick={() => router.push("/catalog")} className="rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-stone-950 transition hover:bg-amber-300">Criar nova sessão</button>
        </div>
      </section>

      {notice && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">{notice}</div>}
      {error && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">{error}</div>}

      {loading ? <div className="mt-8 rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] px-6 py-16 text-center text-xs text-stone-500">Carregando eventos...</div> : events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#CDBEAA] bg-[#FAF7F2] px-6 py-16 text-center"><h2 className="text-lg font-bold text-stone-900">Nenhum evento criado</h2><p className="mt-1 text-sm text-stone-500">Escolha um filme no catálogo para publicar uma nova sessão.</p><button type="button" onClick={() => router.push("/catalog")} className="mt-5 rounded-xl bg-stone-900 px-5 py-3 text-xs font-bold text-white">Ir para o catálogo</button></div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {events.map((event) => <article key={event.id} className="overflow-hidden rounded-2xl border border-[#E5DDD0] bg-[#FAF7F2] shadow-sm"><div className="flex gap-4 p-5">{event.poster_url ? <img src={event.poster_url} alt={event.title} className="h-28 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-28 w-20 shrink-0 rounded-xl bg-[#E5DDD0]" />}<div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-widest text-amber-900">Sessão publicada</p><h2 className="mt-1 truncate text-lg font-black text-stone-900">{event.title}</h2><p className="mt-2 text-xs text-stone-600">{formatDate(event.date)}</p><p className="text-xs text-stone-600">{event.location}</p></div></div><div className="grid grid-cols-3 border-t border-[#E5DDD0] text-xs text-stone-600"><div className="px-5 py-3"><span className="block text-[10px] uppercase text-stone-400">Valor</span><strong className="text-stone-900">R$ {Number(event.price).toFixed(2)}</strong></div><div className="border-x border-[#E5DDD0] px-5 py-3"><span className="block text-[10px] uppercase text-stone-400">Capacidade</span><strong className="text-stone-900">{event.capacity}</strong></div><div className="px-5 py-3"><span className="block text-[10px] uppercase text-stone-400">Código</span><strong className="text-stone-900">#{event.id}</strong></div></div><div className="flex gap-2 border-t border-[#E5DDD0] p-4"><button type="button" onClick={() => openEditor(event)} className="flex-1 rounded-xl border border-[#D5CBB9] bg-white py-2.5 text-xs font-bold text-stone-800 transition hover:bg-stone-100">Editar evento</button><button type="button" onClick={() => handleDelete(event)} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100">Apagar</button></div></article>)}
        </div>
      )}

      {editingEvent && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/70 p-4 backdrop-blur-sm"><form onSubmit={handleSave} className="w-full max-w-2xl rounded-3xl border border-[#E5DDD0] bg-[#FAF7F2] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-amber-900">Editar sessão</p><h2 className="mt-2 text-2xl font-black text-stone-900">{editingEvent.title}</h2></div><button type="button" onClick={() => setEditingEvent(null)} className="h-9 w-9 rounded-full border border-[#D5CBB9] bg-white text-lg font-bold text-stone-500">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-xs font-bold text-stone-700">Título<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm font-normal text-stone-900 outline-none focus:border-amber-900" /></label><label className="text-xs font-bold text-stone-700">Data e horário<input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm font-normal text-stone-900 outline-none focus:border-amber-900" /></label><label className="text-xs font-bold text-stone-700">Preço<input required min="0.01" step="0.01" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm font-normal text-stone-900 outline-none focus:border-amber-900" /></label><label className="sm:col-span-2 text-xs font-bold text-stone-700">Local ou sala<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm font-normal text-stone-900 outline-none focus:border-amber-900" /></label><label className="sm:col-span-2 text-xs font-bold text-stone-700">Descrição<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 w-full resize-none rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm font-normal text-stone-900 outline-none focus:border-amber-900" /></label><label className="sm:col-span-2 text-xs font-bold text-stone-700">URL do cartaz<input value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[#D5CBB9] bg-white px-3.5 py-3 text-sm font-normal text-stone-900 outline-none focus:border-amber-900" /></label></div><div className="mt-6 flex justify-end gap-3 border-t border-[#E5DDD0] pt-5"><button type="button" onClick={() => setEditingEvent(null)} className="rounded-xl bg-[#E5DDD0] px-5 py-3 text-xs font-bold text-stone-800">Cancelar</button><button type="submit" disabled={saving} className="rounded-xl bg-stone-950 px-6 py-3 text-xs font-bold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar alterações"}</button></div></form></div>}
    </main>
  );
}