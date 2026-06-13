import os
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url  # <-- Corrected import path and name
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv # <-- Noted standard utility function name

# Safely extract values from local configurations
load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:081104@localhost:3306/tradementor")

# Create connection pool architecture for concurrent FastAPI requests
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Automatically recycles stale connections
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency provider to cleanly inject transactional sessions into API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()