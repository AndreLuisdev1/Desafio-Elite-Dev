from typing import List
from dependencies import require_role
from fastapi import APIRouter, Depends, HTTPException, status
from db import execute_query, fetch_all, fetch_one
from schemas import SeatResponse, SeatHoldRequest

router = APIRouter(tags=["seats"])


# Listar todos os assentos de um evento
@router.get("/events/{event_id}/seats", response_model=List[SeatResponse], status_code=status.HTTP_200_OK)
async def list_event_seats(event_id: int):
    await execute_query(
        """
        UPDATE seats SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL
        WHERE event_id = %s AND status = 'HELD' AND (held_until IS NULL OR held_until <= NOW())
        """,
        (event_id,),
    )
    query = """
        SELECT id, event_id, seat_number, status 
        FROM seats 
        WHERE event_id = %s 
        ORDER BY seat_number ASC
    """
    try:
        seats = await fetch_all(query, (event_id,))
        return seats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar assentos do evento: {str(e)}",
        )


# Bloquear assento temporariamente durante a seleção
@router.post("/seats/hold", status_code=status.HTTP_200_OK)
async def hold_seat(
    payload: SeatHoldRequest,
    current_user: dict = Depends(require_role(["CLIENT"])),
):
    await execute_query(
        """
        UPDATE seats SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL
        WHERE id = %s AND status = 'HELD' AND (held_until IS NULL OR held_until <= NOW())
        """,
        (payload.seat_id,),
    )
    query_check = "SELECT id, status FROM seats WHERE id = %s"
    seat = await fetch_one(query_check, (payload.seat_id,))

    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assento não encontrado",
        )

    if seat["status"] != "AVAILABLE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assento indisponível para reserva",
        )

    query_update = """
        UPDATE seats 
        SET status = 'HELD', held_by_user_id = %s, held_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        WHERE id = %s AND (status = 'AVAILABLE' OR (status = 'HELD' AND (held_until IS NULL OR held_until <= NOW())))
    """
    try:
        await execute_query(query_update, (current_user["id"], payload.seat_id))
        return {
            "message": "Assento reservado temporariamente com sucesso",
            "seat_id": payload.seat_id,
            "status": "HELD",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao bloquear assento: {str(e)}",
        )


# Liberar assento (caso o usuário desista ou feche a tela)
@router.post("/seats/release", status_code=status.HTTP_200_OK)
async def release_seat(
    payload: SeatHoldRequest,
    current_user: dict = Depends(require_role(["CLIENT"])),
):
    query_update = """
        UPDATE seats 
        SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL
        WHERE id = %s AND status = 'HELD' AND held_by_user_id = %s
    """
    try:
        await execute_query(query_update, (payload.seat_id, current_user["id"]))
        return {
            "message": "Assento liberado com sucesso",
            "seat_id": payload.seat_id,
            "status": "AVAILABLE",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao liberar assento: {str(e)}",
        )