import os
import aiomysql
from dotenv import load_dotenv

load_dotenv()

#Correção aplicada pela IA onde a variável pool foi tipada como aiomysql.Pool | None para indicar que pode ser None antes da inicialização do pool de conexões.
pool: aiomysql.Pool | None = None

async def init_db():
    global pool
    pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "devuser"),
        password=os.getenv("DB_PASSWORD", "devpassword"),
        db=os.getenv("DB_NAME", "elitedev_db"),
        autocommit=True,
        minsize=1,
        maxsize=10 #Define o tamanho máximo do pool de conexões, deixarei um número razoável para evitar sobrecarga no banco de dados, mas ainda permitir um teste robusto.
    )

async def close_db():
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()

async def fetch_all(query: str, params: tuple = ()):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, params)
            return await cur.fetchall()

async def fetch_one(query: str, params: tuple = ()):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, params)
            return await cur.fetchone()

async def execute_query(query: str, params: tuple = ()):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return cur.lastrowid