from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users, trades, journal, courses, ai_analysis, dashboard
import app.models as models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TradeMentor AI Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router,       prefix="/api/v1")
app.include_router(trades.router,      prefix="/api/v1")
app.include_router(journal.router,     prefix="/api/v1")
app.include_router(courses.router,     prefix="/api/v1")
app.include_router(ai_analysis.router, prefix="/api/v1")
app.include_router(dashboard.router,   prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "online", "service": "TradeMentor AI Core API v2", "docs": "/docs"}