from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Desafio Elite Dev 2026 - API",
    description="API para Plataforma de Eventos e Ingressos",
    version="1.0.0",
)

# Configuração de CORS para o Next.js
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
        "message": "API rodando lisa sem Prisma!"
    }