import asyncio
import hashlib
from datetime import datetime, timedelta

from db import close_db, execute_query, fetch_one, init_db
from security import get_password_hash

DEMO_PASSWORD = "Demo@123456"
DEMO_EVENT_TITLE = "Sessao demonstracao - Cinema em Sao Jose"
DEMO_TICKET_CODE = "TKT-DEMO2026"


async def ensure_user(name: str, email: str, role: str) -> int:
    user = await fetch_one(
        "SELECT id, email FROM users WHERE email = %s OR (name = %s AND role = %s) LIMIT 1",
        (email, name, role),
    )
    if user:
        if user["email"] != email:
            await execute_query(
                "UPDATE users SET email = %s WHERE id = %s",
                (email, user["id"]),
            )
        return user["id"]

    return await execute_query(
        """
        INSERT INTO users (name, email, password, role)
        VALUES (%s, %s, %s, %s)
        """,
        (name, email, get_password_hash(DEMO_PASSWORD), role),
    )


async def seed() -> None:
    await init_db()
    try:
        organizer_id = await ensure_user(
            "Organizador Demo", "organizer.demo@example.com", "ORGANIZER"
        )
        client_id = await ensure_user(
            "Cliente Demo", "client.demo@example.com", "CLIENT"
        )
        await ensure_user(
            "Portaria Demo", "gatekeeper.demo@example.com", "GATEKEEPER"
        )

        event = await fetch_one(
            "SELECT id FROM events WHERE title = %s AND organizer_id = %s",
            (DEMO_EVENT_TITLE, organizer_id),
        )
        if event:
            event_id = event["id"]
        else:
            event_id = await execute_query(
                """
                INSERT INTO events
                    (title, description, date, location, price, capacity, organizer_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    DEMO_EVENT_TITLE,
                    "Evento criado automaticamente para avaliacao da plataforma.",
                    datetime.now() + timedelta(days=7),
                    "Cinemark - Sao Jose dos Campos",
                    35.00,
                    50,
                    organizer_id,
                ),
            )

        for row in "ABCDE":
            for number in range(1, 11):
                await execute_query(
                    """
                    INSERT IGNORE INTO seats (event_id, seat_number, status)
                    VALUES (%s, %s, 'AVAILABLE')
                    """,
                    (event_id, f"{row}{number}"),
                )

        demo_seat = await fetch_one(
            "SELECT id FROM seats WHERE event_id = %s AND seat_number = 'A1'",
            (event_id,),
        )
        existing_ticket = await fetch_one(
            "SELECT id FROM tickets WHERE ticket_code = %s", (DEMO_TICKET_CODE,)
        )
        if not existing_ticket and demo_seat:
            qr_hash = hashlib.sha256(
                f"{DEMO_TICKET_CODE}-{event_id}-{client_id}".encode()
            ).hexdigest()
            await execute_query(
                """
                INSERT INTO tickets
                    (event_id, seat_id, user_id, ticket_code, qr_code_hash, status)
                VALUES (%s, %s, %s, %s, %s, 'VALID')
                """,
                (event_id, demo_seat["id"], client_id, DEMO_TICKET_CODE, qr_hash),
            )
            await execute_query(
                "UPDATE seats SET status = 'SOLD' WHERE id = %s",
                (demo_seat["id"],),
            )

        print("Seed concluido com sucesso.")
        print("Organizador: organizer.demo@example.com / Demo@123456")
        print("Cliente: client.demo@example.com / Demo@123456")
        print("Portaria: gatekeeper.demo@example.com / Demo@123456")
        print(f"Ingresso de demonstracao: {DEMO_TICKET_CODE}")
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
