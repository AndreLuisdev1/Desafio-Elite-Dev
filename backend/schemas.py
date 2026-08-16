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