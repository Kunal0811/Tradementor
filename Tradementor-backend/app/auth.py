import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models

# Pull environment variables or fall back to safe defaults
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_signing_key_change_me_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Initialize the password hashing engine
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Points FastAPI to our token endpoint for automated documentation generation
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# --- PASSWORD UTILITIES ---
def hash_password(password: str) -> str:
    """Hashes a plain text password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compares a plain text password with a hashed database string."""
    return pwd_context.verify(plain_password, hashed_password)

# --- JWT TOKEN UTILITIES ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a cryptographically signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- SECURE CURRENT USER DEPENDENCY ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """
    Dependency that intercepts requests, decodes the JWT, 
    and validates the requesting user against the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user