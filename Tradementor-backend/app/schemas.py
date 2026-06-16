import json
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── AUTH ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name:     str = Field(..., min_length=2, max_length=100)
    email:    EmailStr
    password: str = Field(..., min_length=6)

class UserOut(BaseModel):
    user_id:    int
    name:       str
    email:      EmailStr
    created_at: datetime
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type:   str
    user_id:      int
    name:         str
    email:        str

class TokenData(BaseModel):
    email: Optional[str] = None


# ── TRADING ───────────────────────────────────────────────────────────────────
class TradeCreate(BaseModel):
    stock_symbol:    str   = Field(..., max_length=20)
    action_type:     str                        # "BUY" or "SELL"
    execution_price: float = Field(..., gt=0)
    quantity:        int   = Field(..., gt=0)

class TradeOut(BaseModel):
    trade_id:        int
    stock_symbol:    str
    action_type:     str
    execution_price: float
    quantity:        int
    pnl:             float
    status:          str
    trade_date:      datetime
    class Config: from_attributes = True

class HoldingOut(BaseModel):
    id:            int
    symbol:        str
    quantity:      int
    average_price: float
    class Config: from_attributes = True

class PositionOut(BaseModel):
    symbol:    str
    shares:    int
    avg_entry: float
    total_cost:float

class PortfolioOut(BaseModel):
    portfolio_id: int
    balance:      float
    profit_loss:  float
    positions:    List[PositionOut] = []
    class Config: from_attributes = True


# ── JOURNAL ───────────────────────────────────────────────────────────────────
class JournalCreate(BaseModel):
    stock_symbol:   Optional[str]   = None
    outcome:        str             = "BREAKEVEN"
    mistake_tag:    str             = "NONE"
    emotion:        Optional[str]   = None
    entry_price:    Optional[float] = None
    exit_price:     Optional[float] = None
    entry_reason:   Optional[str]   = None
    followed_plan:  bool            = True
    notes:          str

class JournalOut(BaseModel):
    journal_id:     int
    stock_symbol:   Optional[str]
    outcome:        str
    mistake_tag:    str
    emotion:        Optional[str]
    entry_price:    Optional[float]
    exit_price:     Optional[float]
    entry_reason:   Optional[str]
    followed_plan:  bool
    psychology_note:Optional[str]
    notes:          str
    created_at:     datetime
    class Config: from_attributes = True

class JournalStats(BaseModel):
    total_entries:     int
    wins:              int
    losses:            int
    win_rate:          float
    mistake_frequency: Dict[str, int]
    emotion_frequency: Dict[str, int]


# ── COURSES / QUIZZES ─────────────────────────────────────────────────────────
class CourseOut(BaseModel):
    course_id:   int
    title:       str
    description: Optional[str]
    order_index: int
    class Config: from_attributes = True

class QuizOut(BaseModel):
    quiz_id:     int
    course_id:   int
    question:    str
    options:     List[str]          # parsed from JSON
    answer:      int
    explanation: Optional[str]

    @classmethod
    def from_orm_quiz(cls, q):
        opts = json.loads(q.options) if isinstance(q.options, str) else q.options
        return cls(quiz_id=q.quiz_id, course_id=q.course_id,
                   question=q.question, options=opts,
                   answer=q.answer, explanation=q.explanation)

    class Config: from_attributes = True

class QuizResultCreate(BaseModel):
    course_id: int
    score:     int
    total:     int

class QuizResultOut(BaseModel):
    result_id:    int
    quiz_id:      int
    course_id:    int
    score:        int
    total:        int
    passed:       bool
    evaluated_at: datetime
    class Config: from_attributes = True

class LearningProgressUpdate(BaseModel):
    completion_percentage: int = Field(..., ge=0, le=100)
    reading_done:          bool = False

class LearningProgressOut(BaseModel):
    course_id:             int
    completion_percentage: int
    reading_done:          bool
    last_accessed:         datetime
    class Config: from_attributes = True


# ── DASHBOARD ─────────────────────────────────────────────────────────────────
class CourseProgress(BaseModel):
    course_id:   int
    title:       str
    reading_done:bool
    best_score:  Optional[int]
    best_total:  Optional[int]
    passed:      bool

class DashboardSummary(BaseModel):
    cash_balance:      float
    portfolio_value:   float
    total_assets:      float
    realized_pnl:      float
    total_trades:      int
    open_positions:    int
    courses_progress:  List[CourseProgress]
    avg_quiz_score:    float
    journal_entries:   int
    win_rate:          float
    top_mistake:       Optional[str]
    equity_curve:      List[float]
    leaderboard_rank:  Optional[int]


# ── AI ────────────────────────────────────────────────────────────────────────
class AIChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

class AIChatResponse(BaseModel):
    reply: str

class TradeAnalysisRequest(BaseModel):
    context: Optional[str] = None

class PsychologyAnalysisRequest(BaseModel):
    entry_reason:  str
    followed_plan: bool
    outcome:       str
    emotion:       str
    notes:         str


# ── LEADERBOARD ───────────────────────────────────────────────────────────────
class LeaderboardOut(BaseModel):
    rank:         int
    user_name:    str
    total_roi:    float
    win_rate:     float
    total_trades: int