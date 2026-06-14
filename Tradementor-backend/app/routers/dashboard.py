from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/dashboard", tags=["Progress Dashboard"])

@router.get("/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Returns combined learning, trading, and journal summary for the dashboard."""

    # Portfolio
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.user_id).first()
    balance = portfolio.balance if portfolio else 10000.0
    realized_pnl = portfolio.profit_loss if portfolio else 0.0

    # Trades
    all_trades = db.query(models.Trade).filter(models.Trade.user_id == current_user.user_id).all()
    total_trades = len(all_trades)
    buy_trades = [t for t in all_trades if t.action_type == "BUY" and t.status == "OPEN"]

    # Open positions value (approximate — no live prices on backend)
    portfolio_value = sum(t.execution_price * t.quantity for t in buy_trades)

    # Quiz results
    quiz_results = db.query(models.QuizResult).filter(models.QuizResult.user_id == current_user.user_id).all()
    courses_attempted = len(set(r.quiz_id for r in quiz_results))
    avg_quiz_score = round(sum(r.score for r in quiz_results) / len(quiz_results), 1) if quiz_results else 0

    # Journal
    journal = db.query(models.TradingJournal).filter(models.TradingJournal.user_id == current_user.user_id).all()
    wins = sum(1 for e in journal if e.outcome == "WIN")
    losses = sum(1 for e in journal if e.outcome == "LOSS")
    win_rate = round((wins / len(journal)) * 100, 1) if journal else 0

    # Most common mistake
    mistake_freq = {}
    for e in journal:
        if e.mistake_tag and e.mistake_tag != "NONE":
            mistake_freq[e.mistake_tag] = mistake_freq.get(e.mistake_tag, 0) + 1
    top_mistake = max(mistake_freq, key=mistake_freq.get) if mistake_freq else None

    # Equity curve from trades (simplified: BUY costs, SELL proceeds)
    equity_curve = []
    running = 10000.0
    for t in sorted(all_trades, key=lambda x: x.trade_date):
        if t.action_type == "BUY":
            running -= t.execution_price * t.quantity
        else:
            running += t.execution_price * t.quantity
        equity_curve.append(round(running, 2))

    return schemas.DashboardSummary(
        cash_balance=round(balance, 2),
        portfolio_value=round(portfolio_value, 2),
        total_assets=round(balance + portfolio_value, 2),
        realized_pnl=round(realized_pnl, 2),
        total_trades=total_trades,
        open_positions=len(buy_trades),
        courses_attempted=courses_attempted,
        avg_quiz_score=avg_quiz_score,
        journal_entries=len(journal),
        win_rate=win_rate,
        top_mistake=top_mistake,
        equity_curve=equity_curve[-30:] if equity_curve else [10000.0]
    )