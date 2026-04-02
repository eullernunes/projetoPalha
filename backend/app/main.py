import os
from fastapi import FastAPI, Depends
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal
from app.models import models
from app.auth import get_current_user, hash_password
from app.routers import employees, roles, production, expenses, dashboard, auth

models.Base.metadata.create_all(bind=engine)

api_router = APIRouter(prefix="/api")

app = FastAPI(
    title="Sistema Palha - API",
    description="Sistema de gestão para fábrica de palha",
    version="1.0.0",
)

# CORS: em produção as origens são controladas pelo nginx (mesmo host)
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas públicas (sem autenticação)
api_router.include_router(auth.router)

# Todas as demais rotas protegidas por JWT
protected = {"dependencies": [Depends(get_current_user)]}
api_router.include_router(employees.router, **protected)
api_router.include_router(roles.router, **protected)
api_router.include_router(production.router, **protected)
api_router.include_router(expenses.router, **protected)
api_router.include_router(dashboard.router, **protected)

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "Sistema Palha API v1.0"}


# ─── Seed: cria usuário admin padrão se o banco estiver vazio ─────────────────

def seed_admin():
    db = SessionLocal()
    try:
        exists = db.query(models.User).first()
        if not exists:
            password = os.getenv("DEFAULT_ADMIN_PASSWORD", "palha@2025")
            admin = models.User(
                username="admin",
                hashed_password=hash_password(password),
                active=True,
            )
            db.add(admin)
            db.commit()
            print(f"[INFO] Usuário admin criado. Senha padrão: {password}")
            print("[AVISO] Altere a senha em produção via /auth/change-password")
    finally:
        db.close()


seed_admin()
