from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/journal", tags=["Trading Journal"])

@router.post("/", response_model=schemas.JournalOut, status_code=status.HTTP_201_CREATED)
def create_journal_entry(entry: schemas.JournalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_entry = models.TradingJournal(
        user_id=current_user.user_id,
        stock_symbol=entry.stock_symbol,
        outcome=entry.outcome,
        mistake_tag=entry.mistake_tag,
        emotion=entry.emotion,
        entry_price=entry.entry_price,
        exit_price=entry.exit_price,
        notes=entry.notes
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.get("/", response_model=List[schemas.JournalOut])
def get_my_journal(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.TradingJournal).filter(
        models.TradingJournal.user_id == current_user.user_id
    ).order_by(models.TradingJournal.created_at.desc()).all()

@router.delete("/{journal_id}", status_code=status.HTTP_200_OK)
def delete_journal_entry(journal_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entry = db.query(models.TradingJournal).filter(
        models.TradingJournal.journal_id == journal_id,
        models.TradingJournal.user_id == current_user.user_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted."}

@router.get("/stats", response_model=schemas.JournalStats)
def get_journal_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entries = db.query(models.TradingJournal).filter(
        models.TradingJournal.user_id == current_user.user_id
    ).all()
    total = len(entries)
    wins = sum(1 for e in entries if e.outcome == "WIN")
    losses = sum(1 for e in entries if e.outcome == "LOSS")
    win_rate = round((wins / total) * 100, 1) if total > 0 else 0

    mistake_freq = {}
    for e in entries:
        if e.mistake_tag and e.mistake_tag != "NONE":
            mistake_freq[e.mistake_tag] = mistake_freq.get(e.mistake_tag, 0) + 1

    return schemas.JournalStats(
        total_entries=total,
        wins=wins,
        losses=losses,
        win_rate=win_rate,
        mistake_frequency=mistake_freq
    )