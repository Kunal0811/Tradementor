from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users # <-- Import the authentication router
import app.models as models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TradeMentor AI Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the registration and authentication routes
app.include_router(users.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "online", "service": "TradeMentor AI Core API Engine"}