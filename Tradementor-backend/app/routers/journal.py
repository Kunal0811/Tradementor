from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas
import os

router = APIRouter(prefix="/journal", tags=["Trading Journal"])


def _detect_psychology(entry_reason: str, followed_plan: bool, outcome: str,
                        emotion: str, notes: str) -> str:
    """Lightweight rule-based psychology detection (no API call needed)."""
    flags = []
    text = f"{entry_reason} {notes}".lower()
    if "fomo" in text or "missing out" in text or "chased" in text:
        flags.append("FOMO detected")
    if not followed_plan:
        flags.append("Deviated from trading plan")
    if emotion in ("Greedy", "Excited") and outcome == "LOSS":
        flags.append("Greed-driven loss pattern")
    if emotion in ("Anxious", "Fearful") and outcome == "LOSS":
        flags.append("Fear-driven exit too early")
    if "revenge" in text or "make back" in text or "recover" in text:
        flags.append("Possible revenge trade")
    if not flags:
        return "No major psychological pattern detected."
    return " | ".join(flags)


@router.post("/", response_model=schemas.JournalOut, status_code=status.HTTP_201_CREATED)
def create_journal_entry(entry: schemas.JournalCreate, db: Session = Depends(get_db),
                         current_user: models.User = Depends(get_current_user)):
    psych = _detect_psychology(
        entry.entry_reason or "",
        entry.followed_plan,
        entry.outcome,
        entry.emotion or "Neutral",
        entry.notes
    )
    new_entry = models.TradingJournal(
        user_id=current_user.user_id,
        stock_symbol=entry.stock_symbol,
        outcome=entry.outcome,
        mistake_tag=entry.mistake_tag,
        emotion=entry.emotion,
        entry_price=entry.entry_price,
        exit_price=entry.exit_price,
        entry_reason=entry.entry_reason,
        followed_plan=entry.followed_plan,
        psychology_note=psych,
        notes=entry.notes,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/", response_model=List[schemas.JournalOut])
def get_my_journal(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.TradingJournal).filter_by(user_id=current_user.user_id)\
             .order_by(models.TradingJournal.created_at.desc()).all()


@router.delete("/{journal_id}", status_code=200)
def delete_journal_entry(journal_id: int, db: Session = Depends(get_db),
                         current_user: models.User = Depends(get_current_user)):
    e = db.query(models.TradingJournal).filter_by(
        journal_id=journal_id, user_id=current_user.user_id).first()
    if not e:
        raise HTTPException(404, "Journal entry not found.")
    db.delete(e)
    db.commit()
    return {"message": "Deleted."}


@router.get("/stats", response_model=schemas.JournalStats)
def get_journal_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    entries = db.query(models.TradingJournal).filter_by(user_id=current_user.user_id).all()
    total  = len(entries)
    wins   = sum(1 for e in entries if e.outcome == "WIN")
    losses = sum(1 for e in entries if e.outcome == "LOSS")
    win_rate = round((wins / total) * 100, 1) if total > 0 else 0

    mistake_freq = {}
    emotion_freq = {}
    for e in entries:
        if e.mistake_tag and e.mistake_tag != "NONE":
            mistake_freq[e.mistake_tag] = mistake_freq.get(e.mistake_tag, 0) + 1
        if e.emotion:
            emotion_freq[e.emotion] = emotion_freq.get(e.emotion, 0) + 1

    return schemas.JournalStats(total_entries=total, wins=wins, losses=losses,
                                 win_rate=win_rate, mistake_frequency=mistake_freq,
                                 emotion_frequency=emotion_freq)