from typing import List
from db import execute_query, fetch_all, fetch_one
from dependencies import require_role
from fastapi import APIRouter, Depends, HTTPException, status
from schemas import EventCreate, EventResponse, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


# 1. Criar um evento e gerar o mapa de assentos - ORGANIZADOR
@router.post("", status_code=status.HTTP_201_CREATED)
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
        seats_per_row, extra_seats = divmod(event.capacity, len(rows))

        for row_index, row in enumerate(rows):
            row_capacity = seats_per_row + (1 if row_index < extra_seats else 0)
            for number in range(1, row_capacity + 1):
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


# 2. Listar todos os eventos
@router.get("", response_model=List[EventResponse], status_code=status.HTTP_200_OK)
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


# Atualizar qualquer evento por um organizador autenticado
@router.put("/{event_id}", response_model=EventResponse, status_code=status.HTTP_200_OK)
async def update_event(
    event_id: int,
    event: EventUpdate,
    current_user: dict = Depends(require_role(["ORGANIZER"])),
):
    query = """
        UPDATE events
        SET title = %s, description = %s, date = %s, location = %s,
            price = %s, poster_url = %s
        WHERE id = %s
    """
    try:
        await execute_query(
            query,
            (
                event.title,
                event.description,
                event.date,
                event.location,
                event.price,
                event.poster_url,
                event_id,
            ),
        )
        updated_event = await fetch_one(
            """
            SELECT e.id, e.title, e.description, e.date, e.location, e.price, e.capacity,
                   e.tmdb_id, e.poster_url, e.organizer_id, e.created_at,
                   u.name as organizer_name
            FROM events e JOIN users u ON e.organizer_id = u.id
            WHERE e.id = %s
            """,
            (event_id,),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao atualizar evento: {str(e)}",
        )

    if not updated_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
    return updated_event


# Excluir qualquer evento por um organizador autenticado
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: dict = Depends(require_role(["ORGANIZER"])),
):
    event = await fetch_one(
        "SELECT id FROM events WHERE id = %s",
        (event_id,),
    )
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")

    try:
        await execute_query("DELETE FROM events WHERE id = %s", (event_id,))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao excluir evento: {str(e)}",
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