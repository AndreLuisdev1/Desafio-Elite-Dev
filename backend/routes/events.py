from typing import List
from db import execute_query, fetch_all, fetch_one
from dependencies import require_role
from fastapi import APIRouter, Depends, HTTPException, status
from schemas import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["events"])


# 1. Criar um evento e gerar o mapa de assentos - ORGANIZADOR
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    current_user: dict = Depends(require_role(["ORGANIZER"])),
):
    # O ID do organizador vem diretamente do token validado
    organizer_id = current_user["id"]

    query = """
        INSERT INTO events (title, description, date, location, price, capacity, tmdb_id, poster_url, organizer_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        event.title,
        event.description,
        event.date,
        event.location,
        event.price,
        event.capacity,
        event.tmdb_id,
        event.poster_url,
        organizer_id,
    )

    try:
        event_id = await execute_query(query, params)

        # Geração automática da grade de assentos (Linhas A até E)
        rows = ["A", "B", "C", "D", "E"]
        seats_per_row = max(1, event.capacity // len(rows))

        for row in rows:
            for number in range(1, seats_per_row + 1):
                seat_query = """
                    INSERT INTO seats (event_id, seat_number, status) 
                    VALUES (%s, %s, 'AVAILABLE')
                """
                await execute_query(seat_query, (event_id, f"{row}{number}"))

        return {
            "message": "Evento e assentos criados com sucesso!",
            "event_id": event_id,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar evento: {str(e)}",
        )


# 2. Listar todos os eventos - PÚBLICO / CLIENTE
@router.get(
    "/", response_model=List[EventResponse], status_code=status.HTTP_200_OK
)
async def list_events():
    query = """
        SELECT e.id, e.title, e.description, e.date, e.location, e.price, e.capacity, 
               e.tmdb_id, e.poster_url, e.organizer_id, e.created_at, u.name as organizer_name
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        ORDER BY e.date ASC
    """
    try:
        events = await fetch_all(query)
        return events
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar lista de eventos: {str(e)}",
        )


# 3. Obter detalhes de um evento específico - PÚBLICO / CLIENTE
@router.get(
    "/{event_id}", response_model=EventResponse, status_code=status.HTTP_200_OK
)
async def get_event(event_id: int):
    query = """
        SELECT e.id, e.title, e.description, e.date, e.location, e.price, e.capacity, 
               e.tmdb_id, e.poster_url, e.organizer_id, e.created_at, u.name as organizer_name
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        WHERE e.id = %s
    """
    try:
        event = await fetch_one(query, (event_id,))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar banco de dados: {str(e)}",
        )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado",
        )

    return event