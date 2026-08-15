import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

async def now_playing_movies(page: int = 1):
    url = f"{TMDB_BASE_URL}/movie/now_playing"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "pt-BR",
        "region": "BR",
        "page": page
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        
        if response.status_code != 200:
            return {"error": "Falha ao consultar o TMDb", "status": response.status_code}
            
        data = response.json()
        movies = []
        for item in data.get("results", []):
            poster_path = item.get("poster_path")
            movies.append({
                "tmdb_id": item.get("id"),
                "title": item.get("title"),
                "overview": item.get("overview"),
                "release_date": item.get("release_date"),
                "vote_average": item.get("vote_average"),
                "poster_url": f"{IMAGE_BASE_URL}{poster_path}" if poster_path else None
            })
            
        return movies

async def search_movies(query: str):
    """Busca filmes por título"""
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "pt-BR",
        "query": query
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return []
            
        data = response.json()
        movies = []
        for item in data.get("results", []):
            poster_path = item.get("poster_path")
            movies.append({
                "tmdb_id": item.get("id"),
                "title": item.get("title"),
                "overview": item.get("overview"),
                "release_date": item.get("release_date"),
                "poster_url": f"{IMAGE_BASE_URL}{poster_path}" if poster_path else None
            })
        return movies