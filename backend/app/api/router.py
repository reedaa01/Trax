from fastapi import APIRouter
from app.api.routes import auth, drivers, requests, search

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router,     prefix="/auth",    tags=["Auth"])
api_router.include_router(drivers.router,  prefix="/drivers", tags=["Drivers"])
api_router.include_router(requests.router, prefix="/requests",tags=["Requests"])
api_router.include_router(search.router,   prefix="/search",  tags=["Search"])
