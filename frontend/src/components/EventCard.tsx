import Image from "next/image";
import Link from "next/link";
import { Event } from "@/types/events";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = new Date(event.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(event.price);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 shadow-lg">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {event.poster_url ? (
          <Image
            src={event.poster_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            Sem pôster
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-md bg-zinc-950/80 px-2.5 py-1 text-sm font-semibold text-emerald-400 backdrop-blur-md">
          {formattedPrice}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
          {event.title}
        </h3>

        <div className="mt-2 space-y-1 text-xs text-zinc-400">
          <p className="flex items-center gap-1">
            <span>📅</span> {formattedDate}
          </p>
          <p className="flex items-center gap-1">
            <span>📍</span> {event.location}
          </p>
        </div>

        <p className="mt-3 line-clamp-2 text-xs text-zinc-500 leading-relaxed">
          {event.description}
        </p>

        <div className="mt-auto pt-4">
          <Link
            href={`/events/${event.id}`}
            className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 active:scale-[0.98]"
          >
            Garantir Ingresso
          </Link>
        </div>
      </div>
    </div>
  );
}