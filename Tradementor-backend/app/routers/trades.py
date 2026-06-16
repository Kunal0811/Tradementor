from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/trades", tags=["Trading Simulator"])


def _update_holding(db: Session, user_id: int, symbol: str, qty_delta: int, price: float):
    """Upserts the holdings table — the single source of truth for open positions."""
    h = db.query(models.Holding).filter_by(user_id=user_id, symbol=symbol).first()
    if h is None:
        if qty_delta > 0:
            db.add(models.Holding(user_id=user_id, symbol=symbol,
                                  quantity=qty_delta, average_price=price))
    else:
        new_qty = h.quantity + qty_delta
        if new_qty <= 0:
            db.delete(h)
        else:
            if qty_delta > 0:   # BUY — recalculate weighted avg
                total_cost = h.average_price * h.quantity + price * qty_delta
                h.average_price = round(total_cost / new_qty, 4)
            h.quantity = new_qty


@router.post("/", response_model=schemas.TradeOut, status_code=status.HTTP_201_CREATED)
def execute_trade(trade_in: schemas.TradeCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    portfolio = db.query(models.Portfolio).filter_by(user_id=current_user.user_id).first()
    if not portfolio:
        raise HTTPException(404, "Portfolio not found.")

    order_cost = round(trade_in.execution_price * trade_in.quantity, 2)
    realized_pnl = 0.0

    if trade_in.action_type == "BUY":
        if portfolio.balance < order_cost:
            raise HTTPException(400, "Insufficient virtual funds.")
        portfolio.balance = round(portfolio.balance - order_cost, 2)
        _update_holding(db, current_user.user_id, trade_in.stock_symbol, trade_in.quantity, trade_in.execution_price)
        trade_status = "OPEN"

    elif trade_in.action_type == "SELL":
        holding = db.query(models.Holding).filter_by(
            user_id=current_user.user_id, symbol=trade_in.stock_symbol).first()
        if not holding or holding.quantity < trade_in.quantity:
            held = holding.quantity if holding else 0
            raise HTTPException(400, f"Not enough shares. You hold {held}.")

        realized_pnl = round((trade_in.execution_price - holding.average_price) * trade_in.quantity, 2)
        portfolio.balance     = round(portfolio.balance + order_cost, 2)
        portfolio.profit_loss = round(portfolio.profit_loss + realized_pnl, 2)
        _update_holding(db, current_user.user_id, trade_in.stock_symbol, -trade_in.quantity, trade_in.execution_price)
        trade_status = "CLOSED"
    else:
        raise HTTPException(400, "action_type must be BUY or SELL.")

    new_trade = models.Trade(
        user_id=current_user.user_id,
        stock_symbol=trade_in.stock_symbol,
        action_type=trade_in.action_type,
        execution_price=trade_in.execution_price,
        quantity=trade_in.quantity,
        pnl=realized_pnl,
        status=trade_status,
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)

    # Refresh leaderboard entry
    _refresh_leaderboard(db, current_user)

    return new_trade


def _refresh_leaderboard(db: Session, user: models.User):
    trades = db.query(models.Trade).filter_by(user_id=user.user_id).all()
    sell_trades = [t for t in trades if t.action_type == "SELL"]
    wins = sum(1 for t in sell_trades if t.pnl > 0)
    win_rate = round((wins / len(sell_trades)) * 100, 1) if sell_trades else 0
    portfolio = db.query(models.Portfolio).filter_by(user_id=user.user_id).first()
    roi = round(((portfolio.profit_loss) / 10000) * 100, 2) if portfolio else 0

    entry = db.query(models.LeaderboardEntry).filter_by(user_id=user.user_id).first()
    if entry:
        entry.total_roi    = roi
        entry.win_rate     = win_rate
        entry.total_trades = len(trades)
        entry.user_name    = user.name
    else:
        db.add(models.LeaderboardEntry(user_id=user.user_id, user_name=user.name,
                                       total_roi=roi, win_rate=win_rate, total_trades=len(trades)))
    db.commit()


@router.get("/", response_model=List[schemas.TradeOut])
def get_my_trades(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Trade).filter_by(user_id=current_user.user_id)\
             .order_by(models.Trade.trade_date.desc()).all()


@router.get("/portfolio", response_model=schemas.PortfolioOut)
def get_portfolio(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    portfolio = db.query(models.Portfolio).filter_by(user_id=current_user.user_id).first()
    if not portfolio:
        raise HTTPException(404, "Portfolio not found.")

    holdings = db.query(models.Holding).filter_by(user_id=current_user.user_id).all()
    positions = [
        schemas.PositionOut(symbol=h.symbol, shares=h.quantity,
                            avg_entry=h.average_price,
                            total_cost=round(h.average_price * h.quantity, 2))
        for h in holdings if h.quantity > 0
    ]
    return schemas.PortfolioOut(portfolio_id=portfolio.portfolio_id,
                                balance=portfolio.balance,
                                profit_loss=portfolio.profit_loss,
                                positions=positions)


@router.delete("/reset", status_code=200)
def reset_portfolio(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Trade).filter_by(user_id=current_user.user_id).delete()
    db.query(models.Holding).filter_by(user_id=current_user.user_id).delete()
    portfolio = db.query(models.Portfolio).filter_by(user_id=current_user.user_id).first()
    if portfolio:
        portfolio.balance     = 10000.00
        portfolio.profit_loss = 0.00
    # Remove from leaderboard
    db.query(models.LeaderboardEntry).filter_by(user_id=current_user.user_id).delete()
    db.commit()
    return {"message": "Portfolio reset to $10,000."}