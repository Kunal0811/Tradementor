from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/dashboard", tags=["Progress Dashboard"])


@router.get("/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db),
                           current_user: models.User = Depends(get_current_user)):
    # Portfolio & holdings
    portfolio = db.query(models.Portfolio).filter_by(user_id=current_user.user_id).first()
    balance       = portfolio.balance      if portfolio else 10000.0
    realized_pnl  = portfolio.profit_loss if portfolio else 0.0

    holdings = db.query(models.Holding).filter_by(user_id=current_user.user_id).all()
    portfolio_value = sum(h.average_price * h.quantity for h in holdings)

    # Trades
    all_trades = db.query(models.Trade).filter_by(user_id=current_user.user_id).all()
    total_trades   = len(all_trades)
    open_positions = len([h for h in holdings if h.quantity > 0])

    # Equity curve
    equity_curve = []
    running = 10000.0
    for t in sorted(all_trades, key=lambda x: x.trade_date):
        running += t.pnl if t.action_type == "SELL" else 0
        equity_curve.append(round(running, 2))

    # Courses progress
    courses = db.query(models.Course).order_by(models.Course.order_index).all()
    learning_prog = {lp.course_id: lp for lp in
                     db.query(models.LearningProgress).filter_by(user_id=current_user.user_id).all()}
    # Best quiz result per course
    quiz_results = db.query(models.QuizResult).filter_by(user_id=current_user.user_id).all()
    best_per_course: dict = {}
    for r in quiz_results:
        if r.course_id not in best_per_course or r.score > best_per_course[r.course_id].score:
            best_per_course[r.course_id] = r

    courses_progress = []
    for c in courses:
        lp = learning_prog.get(c.course_id)
        br = best_per_course.get(c.course_id)
        courses_progress.append(schemas.CourseProgress(
            course_id=c.course_id, title=c.title,
            reading_done=lp.reading_done if lp else False,
            best_score=br.score if br else None,
            best_total=br.total if br else None,
            passed=br.passed if br else False,
        ))

    all_scores   = [r.score for r in quiz_results]
    avg_quiz     = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

    # Journal stats
    journal = db.query(models.TradingJournal).filter_by(user_id=current_user.user_id).all()
    wins   = sum(1 for e in journal if e.outcome == "WIN")
    win_rate = round((wins / len(journal)) * 100, 1) if journal else 0
    mistake_freq = {}
    for e in journal:
        if e.mistake_tag and e.mistake_tag != "NONE":
            mistake_freq[e.mistake_tag] = mistake_freq.get(e.mistake_tag, 0) + 1
    top_mistake = max(mistake_freq, key=mistake_freq.get) if mistake_freq else None

    # Leaderboard rank
    all_lb = db.query(models.LeaderboardEntry).order_by(
        models.LeaderboardEntry.total_roi.desc()).all()
    rank = next((i+1 for i, lb in enumerate(all_lb) if lb.user_id == current_user.user_id), None)

    return schemas.DashboardSummary(
        cash_balance=round(balance, 2),
        portfolio_value=round(portfolio_value, 2),
        total_assets=round(balance + portfolio_value, 2),
        realized_pnl=round(realized_pnl, 2),
        total_trades=total_trades,
        open_positions=open_positions,
        courses_progress=courses_progress,
        avg_quiz_score=avg_quiz,
        journal_entries=len(journal),
        win_rate=win_rate,
        top_mistake=top_mistake,
        equity_curve=equity_curve[-30:] if equity_curve else [10000.0],
        leaderboard_rank=rank,
    )