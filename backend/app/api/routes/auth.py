from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserOut, Token
from app.services.auth_service import create_user, login_user, authenticate_user
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Register a new client or driver account."""
    return create_user(db, data)


@router.post("/token", response_model=Token)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2-compatible login for Swagger UI. Returns JWT token + user."""
    user = authenticate_user(db, form_data.username, form_data.password)
    token = login_user(db, form_data.username, form_data.password)
    return Token(access_token=token, token_type="bearer", user=user)


@router.post("/login", response_model=Token)
def login_json(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """JSON login used by the frontend. Returns JWT token + user."""
    user = authenticate_user(db, form_data.username, form_data.password)
    token = login_user(db, form_data.username, form_data.password)
    return Token(access_token=token, token_type="bearer", user=user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
