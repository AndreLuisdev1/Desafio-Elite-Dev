from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# -------------------------------------------------------------
# 1. Autenticação & Usuários (RBAC)
# -------------------------------------------------------------
class UserRole(str, Enum):
    CLIENT = "CLIENT"
    ORGANIZER = "ORGANIZER"
    GATEKEEPER = "GATEKEEPER"


class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.CLIENT


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: str


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None


# -------------------------------------------------------------
# 2. Eventos & Sessões
# -------------------------------------------------------------
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str
    price: float = Field(gt=0)
    capacity: int = Field(gt=0)
    tmdb_id: Optional[int] = None
    poster_url: Optional[str] = None
    organizer_id: Optional[int] = (
        None  # Preenchido automaticamente via token JWT
    )


class EventUpdate(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str
    price: float = Field(gt=0)
    poster_url: Optional[str] = None


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
    organizer_name: Optional[str] = None
    organizer_id: int
    created_at: datetime


# -------------------------------------------------------------
# 3. Mapa de Assentos
# -------------------------------------------------------------
class SeatHoldRequest(BaseModel):
    seat_id: int


class SeatResponse(BaseModel):
    id: int
    event_id: int
    seat_number: str
    status: str  # 'AVAILABLE', 'HELD', 'SOLD'


# -------------------------------------------------------------
# 4. Ingressos & Validação (Tickets & Check-in)
# -------------------------------------------------------------
class TicketCheckoutRequest(BaseModel):
    event_id: int
    seat_id: int
    user_id: Optional[int] = None  # Preenchido via token JWT


class TicketValidateRequest(BaseModel):
    ticket_code: str


class TicketResponse(BaseModel):
    id: int
    event_id: int
    seat_id: Optional[int] = None
    user_id: int
    ticket_code: str
    status: str  # 'VALID', 'USED', 'CANCELLED'
    created_at: datetime
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    seat_number: Optional[str] = None
    user_name: Optional[str] = None