from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import init_db, close_db, fetch_one

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(
    title="Desafio Elite Dev 2026 - API",
    description="API para Plataforma de Eventos e Ingressos",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "API rodando!"
    }

@app.get("/health")
async def health_check():
    try:
        result = await fetch_one("SELECT COUNT(*) as total_users FROM users;")
        return {
            "status": "healthy",
            "database": "connected",
            "users_count": result["total_users"]
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database_error": str(e)
        }