export interface Ticket {
  id: string;
  event_id: number;
  movie: string;
  date: string;
  seat: string;
  status: "valid" | "used" | "pending";
  qr_code: string;
}
