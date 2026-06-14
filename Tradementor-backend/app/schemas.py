from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime


# ── AUTH ──────────────────────────────────────────────────────────────────────
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
    user_id: int
    name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None


# ── TRADING ───────────────────────────────────────────────────────────────────
class TradeCreate(BaseModel):
    stock_symbol: str = Field(..., max_length=20)
    action_type: str                      # "BUY" or "SELL"
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

class PositionOut(BaseModel):
    symbol: str
    shares: int
    avg_entry: float
    total_cost: float

class PortfolioOut(BaseModel):
    portfolio_id: int
    balance: float
    profit_loss: float
    positions: List[PositionOut] = []
    class Config:
        from_attributes = True


# ── JOURNAL ───────────────────────────────────────────────────────────────────
class JournalCreate(BaseModel):
    stock_symbol: Optional[str] = None
    outcome: str = "BREAKEVEN"           # WIN / LOSS / BREAKEVEN
    mistake_tag: str = "NONE"
    emotion: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    notes: str

class JournalOut(BaseModel):
    journal_id: int
    stock_symbol: Optional[str]
    outcome: str
    mistake_tag: str
    emotion: Optional[str]
    entry_price: Optional[float]
    exit_price: Optional[float]
    notes: str
    created_at: datetime
    class Config:
        from_attributes = True

class JournalStats(BaseModel):
    total_entries: int
    wins: int
    losses: int
    win_rate: float
    mistake_frequency: Dict[str, int]


# ── COURSES / QUIZZES ─────────────────────────────────────────────────────────
class CourseOut(BaseModel):
    course_id: int
    title: str
    description: Optional[str]
    class Config:
        from_attributes = True

class QuizOut(BaseModel):
    quiz_id: int
    course_id: int
    question: str
    answer: str
    class Config:
        from_attributes = True

class QuizResultCreate(BaseModel):
    quiz_id: int
    score: int

class QuizResultOut(BaseModel):
    result_id: int
    quiz_id: int
    score: int
    evaluated_at: datetime
    class Config:
        from_attributes = True


# ── DASHBOARD ─────────────────────────────────────────────────────────────────
class DashboardSummary(BaseModel):
    cash_balance: float
    portfolio_value: float
    total_assets: float
    realized_pnl: float
    total_trades: int
    open_positions: int
    courses_attempted: int
    avg_quiz_score: float
    journal_entries: int
    win_rate: float
    top_mistake: Optional[str]
    equity_curve: List[float]


# ── AI ────────────────────────────────────────────────────────────────────────
class AIChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []   # [{role, text}, ...]

class TradeAnalysisRequest(BaseModel):
    context: Optional[str] = None

class AIChatResponse(BaseModel):
    reply: str