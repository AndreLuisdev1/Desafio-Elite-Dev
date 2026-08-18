from db import execute_query, fetch_one
from dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from schemas import (
    TokenResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
)
from security import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest):
    existing_user = await fetch_one(
        "SELECT id FROM users WHERE email = %s", (payload.email,)
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este e-mail já está cadastrado",
        )

    hashed_password = get_password_hash(payload.password)

    query = """
        INSERT INTO users (name, email, password, role)
        VALUES (%s, %s, %s, %s)
    """
    user_id = await execute_query(
        query, (payload.name, payload.email, hashed_password, payload.role.value)
    )

    access_token = create_access_token(
        data={"sub": user_id, "email": payload.email, "role": payload.role.value}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "name": payload.name,
        "email": payload.email,
        "role": payload.role.value,
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLoginRequest):
    user = await fetch_one(
        "SELECT id, name, email, password, role FROM users WHERE email = %s",
        (payload.email,),
    )

    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )

    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user