import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status
from db import execute_query, fetch_all, fetch_one
from schemas import TicketCheckoutRequest, TicketResponse, TicketValidateRequest

router = APIRouter(prefix="/tickets", tags=["tickets"])


# 1. Realizar Checkout / Emissão do Ingresso
@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def checkout_ticket(payload: TicketCheckoutRequest):

    # 1. Verifica se o assento está disponível ou sob reserva temporária
    seat_query = "SELECT id, status FROM seats WHERE id = %s AND event_id = %s"
    seat = await fetch_one(seat_query, (payload.seat_id, payload.event_id))

    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assento não encontrado para este evento",
        )

    if seat["status"] == "OCCUPIED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este assento já foi comprado por outro usuário",
        )

    try:
        # 2. Bloqueia o assento em definitivo
        update_seat_query = "UPDATE seats SET status = 'OCCUPIED' WHERE id = %s"
        await execute_query(update_seat_query, (payload.seat_id,))

        # 3. Gera código único para o QR Code (Ex: TKT-A1B2C3D4E5)
        ticket_code = f"TKT-{uuid.uuid4().hex[:10].upper()}"

        # 4. Salva o ingresso no banco
        insert_ticket_query = """
            INSERT INTO tickets (event_id, seat_id, user_id, ticket_code, status)
            VALUES (%s, %s, %s, %s, 'VALID')
        """
        ticket_id = await execute_query(
            insert_ticket_query,
            (payload.event_id, payload.seat_id, payload.user_id, ticket_code),
        )

        return {
            "message": "Compra confirmada com sucesso!",
            "ticket_id": ticket_id,
            "ticket_code": ticket_code,
            "status": "VALID",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar compra do ingresso: {str(e)}",
        )


# 2. Listar Ingressos de um Usuário
@router.get("/user/{user_id}", response_model=List[TicketResponse], status_code=status.HTTP_200_OK)
async def list_user_tickets(user_id: int):

    query = """
        SELECT 
            t.id, t.event_id, t.seat_id, t.user_id, t.ticket_code, t.status, t.created_at,
            e.title AS event_title, e.date AS event_date, e.location AS event_location,
            s.seat_number,
            u.name AS user_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN seats s ON t.seat_id = s.id
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = %s
        ORDER BY t.created_at DESC
    """
    try:
        tickets = await fetch_all(query, (user_id,))
        return tickets
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar ingressos do usuário: {str(e)}",
        )


# 3. Buscar Ingresso Específico por ID
@router.get("/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK)
async def get_ticket(ticket_id: int):

    query = """
        SELECT 
            t.id, t.event_id, t.seat_id, t.user_id, t.ticket_code, t.status, t.created_at,
            e.title AS event_title, e.date AS event_date, e.location AS event_location,
            s.seat_number,
            u.name AS user_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN seats s ON t.seat_id = s.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    """
    try:
        ticket = await fetch_one(query, (ticket_id,))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar ingresso: {str(e)}",
        )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingresso não encontrado",
        )

    return ticket


# 4. Validar Ingresso na Portaria (Check-in via QR Code)
@router.post("/validate", status_code=status.HTTP_200_OK)
async def validate_ticket(payload: TicketValidateRequest):

    query = """
        SELECT 
            t.id, t.status, t.ticket_code,
            e.title AS event_title,
            s.seat_number,
            u.name AS user_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN seats s ON t.seat_id = s.id
        JOIN users u ON t.user_id = u.id
        WHERE t.ticket_code = %s
    """
    ticket = await fetch_one(query, (payload.ticket_code,))

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR Code inválido: Ingresso não encontrado no sistema",
        )

    if ticket["status"] == "USED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Atenção: Este ingresso já foi utilizado anteriormente ({ticket['user_name']} - Assento {ticket['seat_number']})",
        )

    if ticket["status"] == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este ingresso foi cancelado e não permite entrada",
        )

    # Marca como utilizado
    try:
        update_query = "UPDATE tickets SET status = 'USED' WHERE id = %s"
        await execute_query(update_query, (ticket["id"],))

        return {
            "status": "AUTHORIZED",
            "message": "Entrada Liberada!",
            "event": ticket["event_title"],
            "attendee": ticket["user_name"],
            "seat": ticket["seat_number"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao registrar entrada na portaria: {str(e)}",
        )