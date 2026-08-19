export type UserRole = "CLIENT" | "ORGANIZER" | "GATEKEEPER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  capacity: number;
  poster_url: string;
  organizer_id: number;
  organizer_name?: string;
  created_at?: string;
}

export interface Seat {
  id: number;
  event_id: number;
  seat_number: string;
  status: "AVAILABLE" | "HELD" | "SOLD";
}

export interface Ticket {
  id: number;
  event_id: number;
  seat_id: number | null;
  user_id: number;
  ticket_code: string;
  status: "VALID" | "USED" | "CANCELLED";
  created_at: string;
  event_title?: string;
  event_date?: string;
  event_location?: string;
  seat_number?: string;
  user_name?: string;
}

export interface MovieTMDb {
  id: number;
  tmdb_id: number;
  title: string;
  overview: string;
  poster_url: string;
  release_date?: string;
  vote_average?: number;
}

export interface TicketItem {
  id: number;
  event_id: number;
  seat_id: number;
  user_id: number;
  ticket_code: string;
  status: "VALID" | "USED" | "CANCELLED";
  created_at: string;
  event_title: string;
  event_date: string;
  event_location: string;
  seat_number: string;
  user_name: string;
}