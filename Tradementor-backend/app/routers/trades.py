from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/trades", tags=["Trading Simulator"])

@router.post("/", response_model=schemas.TradeOut, status_code=status.HTTP_201_CREATED)
def execute_trade(trade_in: schemas.TradeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found for this user.")

    order_cost = trade_in.execution_price * trade_in.quantity

    if trade_in.action_type == "BUY":
        if portfolio.balance < order_cost:
            raise HTTPException(status_code=400, detail="Insufficient virtual funds.")
        portfolio.balance = round(portfolio.balance - order_cost, 2)

    elif trade_in.action_type == "SELL":
        # Calculate P&L from open BUY trades for this symbol
        open_buys = db.query(models.Trade).filter(
            models.Trade.user_id == current_user.user_id,
            models.Trade.stock_symbol == trade_in.stock_symbol,
            models.Trade.action_type == "BUY",
            models.Trade.status == "OPEN"
        ).all()
        total_held = sum(t.quantity for t in open_buys)
        if total_held < trade_in.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough shares. You hold {total_held}.")

        avg_cost = sum(t.execution_price * t.quantity for t in open_buys) / total_held if total_held > 0 else 0
        pnl = (trade_in.execution_price - avg_cost) * trade_in.quantity
        portfolio.balance = round(portfolio.balance + order_cost, 2)
        portfolio.profit_loss = round(portfolio.profit_loss + pnl, 2)

        # Mark BUY trades as CLOSED (FIFO)
        qty_to_close = trade_in.quantity
        for buy_trade in sorted(open_buys, key=lambda t: t.trade_date):
            if qty_to_close <= 0:
                break
            if buy_trade.quantity <= qty_to_close:
                buy_trade.status = "CLOSED"
                qty_to_close -= buy_trade.quantity
            else:
                # Partial close — split not implemented, mark fully
                buy_trade.status = "CLOSED"
                qty_to_close = 0

    new_trade = models.Trade(
        user_id=current_user.user_id,
        stock_symbol=trade_in.stock_symbol,
        action_type=trade_in.action_type,
        execution_price=trade_in.execution_price,
        quantity=trade_in.quantity,
        status="OPEN" if trade_in.action_type == "BUY" else "CLOSED"
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    return new_trade

@router.get("/", response_model=List[schemas.TradeOut])
def get_my_trades(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Trade).filter(
        models.Trade.user_id == current_user.user_id
    ).order_by(models.Trade.trade_date.desc()).all()

@router.get("/portfolio", response_model=schemas.PortfolioOut)
def get_portfolio(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")

    # Build open positions from OPEN BUY trades
    open_buys = db.query(models.Trade).filter(
        models.Trade.user_id == current_user.user_id,
        models.Trade.action_type == "BUY",
        models.Trade.status == "OPEN"
    ).all()

    positions_map = {}
    for t in open_buys:
        sym = t.stock_symbol
        if sym not in positions_map:
            positions_map[sym] = {"symbol": sym, "shares": 0, "total_cost": 0.0}
        positions_map[sym]["shares"] += t.quantity
        positions_map[sym]["total_cost"] += t.execution_price * t.quantity

    positions = []
    for sym, data in positions_map.items():
        avg_entry = round(data["total_cost"] / data["shares"], 2) if data["shares"] > 0 else 0
        positions.append(schemas.PositionOut(
            symbol=sym,
            shares=data["shares"],
            avg_entry=avg_entry,
            total_cost=round(data["total_cost"], 2)
        ))

    return schemas.PortfolioOut(
        portfolio_id=portfolio.portfolio_id,
        balance=portfolio.balance,
        profit_loss=portfolio.profit_loss,
        positions=positions
    )

@router.delete("/reset", status_code=status.HTTP_200_OK)
def reset_portfolio(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Trade).filter(models.Trade.user_id == current_user.user_id).delete()
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.user_id).first()
    if portfolio:
        portfolio.balance = 10000.00
        portfolio.profit_loss = 0.00
    db.commit()
    return {"message": "Portfolio reset to $10,000."}