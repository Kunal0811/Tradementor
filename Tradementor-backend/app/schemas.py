from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- SECURITY / REGISTRATION LAYER ---
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserOut(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- SIMULATOR MATRIX VALIDATIONS ---
class TradeCreate(BaseModel):
    stock_symbol: str = Field(..., max_length=20)
    action_type: str  # "BUY" or "SELL"
    execution_price: float = Field(..., gt=0)
    quantity: int = Field(..., gt=0)

class TradeOut(BaseModel):
    trade_id: int
    stock_symbol: str
    action_type: str
    execution_price: float
    quantity: int
    status: str
    trade_date: datetime

    class Config:
        from_attributes = True


# --- JOURNAL ENTRY SCHEMA VALIDATIONS ---
class JournalCreate(BaseModel):
    stock_symbol: str
    mistake_tag: str
    notes: str

class JournalOut(BaseModel):
    journal_id: int
    mistake_tag: str
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True