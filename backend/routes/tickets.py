import hashlib
from typing import List
import uuid
from db import execute_query, fetch_all, fetch_one
from dependencies import get_current_user, require_role
from fastapi import APIRouter, Depends, HTTPException, status
from schemas import TicketCheckoutRequest, TicketResponse, TicketValidateRequest

router = APIRouter(prefix="/tickets", tags=["tickets"])


# 1. Realizar Checkout / Emissão do Ingresso (Apenas CLIENT)
@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def checkout_ticket(
    payload: TicketCheckoutRequest,
    current_user: dict = Depends(require_role(["CLIENT", "ORGANIZER"])),
):
    buyer_id = current_user["id"]

    # 1. Verifica se o assento existe e pertence à sessão
    seat_query = "SELECT id, status FROM seats WHERE id = %s AND event_id = %s"
    seat = await fetch_one(seat_query, (payload.seat_id, payload.event_id))

    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assento não encontrado para este evento",
        )

    # Verifica se já foi comprado (SOLD)
    if seat["status"] == "SOLD":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este assento já foi comprado por outro usuário",
        )

    try:
        # 2. Bloqueia o assento em definitivo
        update_seat_query = (
            "UPDATE seats SET status = 'SOLD', held_by_user_id = NULL WHERE id = %s"
        )
        await execute_query(update_seat_query, (payload.seat_id,))

        # 3. Gera identificador e hash criptográfico do QR Code
        ticket_code = f"TKT-{uuid.uuid4().hex[:10].upper()}"
        qr_code_hash = hashlib.sha256(
            f"{ticket_code}-{payload.event_id}-{buyer_id}".encode()
        ).hexdigest()

        # 4. Salva o ingresso no banco
        insert_ticket_query = """
            INSERT INTO tickets (event_id, seat_id, user_id, ticket_code, qr_code_hash, status)
            VALUES (%s, %s, %s, %s, %s, 'VALID')
        """
        ticket_id = await execute_query(
            insert_ticket_query,
            (
                payload.event_id,
                payload.seat_id,
                buyer_id,
                ticket_code,
                qr_code_hash,
            ),
        )

        return {
            "message": "Compra confirmada com sucesso!",
            "ticket_id": ticket_id,
            "ticket_code": ticket_code,
            "qr_code_hash": qr_code_hash,
            "status": "VALID",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar compra do ingresso: {str(e)}",
        )


# 2. Listar Ingressos do Usuário Conectado (Meus Ingressos)
@router.get( "/me", response_model=List[TicketResponse], status_code=status.HTTP_200_OK)
async def list_my_tickets(
    current_user: dict = Depends(get_current_user),
):
    query = """
        SELECT 
            t.id, t.event_id, t.seat_id, t.user_id, t.ticket_code, t.status, t.created_at,
            e.title AS event_title, e.date AS event_date, e.location AS event_location,
            s.seat_number,
            u.name AS user_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        LEFT JOIN seats s ON t.seat_id = s.id
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = %s
        ORDER BY t.created_at DESC
    """
    try:
        tickets = await fetch_all(query, (current_user["id"],))
        return tickets
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar ingressos: {str(e)}",
        )


# 3. Buscar Ingresso Específico por ID
@router.get("/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK)
async def get_ticket(ticket_id: int, current_user: dict = Depends(get_current_user)):
    query = """
        SELECT 
            t.id, t.event_id, t.seat_id, t.user_id, t.ticket_code, t.status, t.created_at,
            e.title AS event_title, e.date AS event_date, e.location AS event_location,
            s.seat_number,
            u.name AS user_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        LEFT JOIN seats s ON t.seat_id = s.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    """
    ticket = await fetch_one(query, (ticket_id,))

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingresso não encontrado",
        )

    if (
        current_user["role"] == "CLIENT"
        and ticket["user_id"] != current_user["id"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para visualizar este ingresso",
        )

    return ticket


# 4. Validar Ingresso na Portaria (Check-in via QR Code)
@router.post("/validate")
async def validate_ticket(
    payload: TicketValidateRequest,
    current_user: dict = Depends(require_role(["GATEKEEPER", "ORGANIZER"])),
):
    query = """
        SELECT 
            t.id, t.status, t.ticket_code,
            e.title AS event_title,
            s.seat_number,
            u.name AS user_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        LEFT JOIN seats s ON t.seat_id = s.id
        JOIN users u ON t.user_id = u.id
        WHERE t.ticket_code = %s OR t.qr_code_hash = %s
    """
    ticket = await fetch_one(query, (payload.ticket_code, payload.ticket_code))

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

    # Marca como utilizado e registra a data/hora do check-in
    try:
        update_query = (
            "UPDATE tickets SET status = 'USED', used_at = NOW() WHERE id = %s"
        )
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