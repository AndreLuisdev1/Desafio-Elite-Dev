from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Validação dos campos para criação de eventos
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str
    price: float = Field(gt=0)
    capacity: int = Field(gt=0)
    tmdb_id: Optional[int] = None
    poster_url: Optional[str] = None
    organizer_id: int = Field


# Validação dos campos para eventos criados
class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    date: datetime
    location: str
    price: float
    capacity: int
    tmdb_id: Optional[int] = None
    poster_url: Optional[str] = None
    organizer_id: int
    created_at: datetime

# Validação dos campos para assentos
class SeatHoldRequest(BaseModel):
    seat_id: int
    user_id: Optional[int] = None

# Validação dos campos para resposta de assentos
class SeatResponse(BaseModel):
    id: int
    event_id: int
    seat_number: str
    status: str  # 'AVAILABLE', 'HELD', 'OCCUPIED'


class TicketCheckoutRequest(BaseModel):
    event_id: int
    seat_id: int
    user_id: int

class TicketValidateRequest(BaseModel):
    ticket_code: str

class TicketResponse(BaseModel):
    id: int
    event_id: int
    seat_id: int
    user_id: int
    ticket_code: str
    status: str  # 'VALID', 'USED', 'CANCELLED'
    created_at: datetime
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    seat_number: Optional[str] = None
    user_name: Optional[str] = None