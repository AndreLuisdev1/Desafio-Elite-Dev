from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma

app = FastAPI(
    title="Desafio Elite Dev 2026 - API",
    description="API para Plataforma de Eventos e Ingressos",
    version="1.0.0",
)

# Configuração de CORS para permitir que o Front-End (Next.js) acesse a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, defina a URL exata do Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Prisma()

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "API do Desafio Elite Dev 2026 rodando perfeitamente!"
    }

@app.get("/health")
async def health_check():
    # Verifica se a conexão com o MySQL via Prisma está funcionando
    try:
        user_count = await db.user.count()
        return {"status": "healthy", "database": "connected", "users_count": user_count}
    except Exception as e:
        return {"status": "unhealthy", "database_error": str(e)}