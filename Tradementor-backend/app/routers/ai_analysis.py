from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas
import os

router = APIRouter(prefix="/ai", tags=["AI Analysis"])

SYSTEM_PROMPT = (
    "You are TradeMentor AI, an expert trading educator inside a simulation platform. "
    "Help beginners learn: candlestick patterns, technical indicators (RSI, MACD, Bollinger Bands, MAs), "
    "risk management (1% rule, stop-loss, R:R ratio), and trading psychology. "
    "Be concise (under 200 words), educational, and include a practical tip. "
    "Never give real financial advice. Note this is simulation for learning."
)


def _get_client():
    try:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(503, "GEMINI_API_KEY not configured on server.")
        return genai.Client(api_key=api_key)
    except ImportError:
        raise HTTPException(503, "google-genai package not installed.")


def _save_chat(db: Session, user_id: int, question: str, response: str):
    db.add(models.AIChat(user_id=user_id, question=question, response=response))
    db.commit()


@router.post("/chat", response_model=schemas.AIChatResponse)
async def ai_chat(request: schemas.AIChatRequest, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    from google.genai import types
    client = _get_client()

    history = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part.from_text(text=m["text"])]
        )
        for m in request.history[:-1]
    ]
    config = types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT, temperature=0.7)
    chat = client.chats.create(model="gemini-2.5-flash", history=history, config=config)
    response = chat.send_message(request.message)
    reply = response.text

    _save_chat(db, current_user.user_id, request.message, reply)
    return schemas.AIChatResponse(reply=reply)


@router.post("/analyze-trade", response_model=schemas.AIChatResponse)
async def analyze_trade(request: schemas.TradeAnalysisRequest, db: Session = Depends(get_db),
                        current_user: models.User = Depends(get_current_user)):
    client = _get_client()

    trades = db.query(models.Trade).filter_by(user_id=current_user.user_id)\
               .order_by(models.Trade.trade_date.desc()).limit(10).all()
    trade_summary = "\n".join([
        f"- {t.action_type} {t.quantity} {t.stock_symbol} @ ${t.execution_price:.2f} "
        f"| PnL: ${t.pnl:.2f} ({t.status})"
        for t in trades
    ]) or "No trades yet."

    journal = db.query(models.TradingJournal).filter_by(user_id=current_user.user_id)\
                .order_by(models.TradingJournal.created_at.desc()).limit(5).all()
    journal_summary = "\n".join([
        f"- {e.stock_symbol or 'N/A'} | {e.outcome} | {e.mistake_tag} | "
        f"Psych: {e.psychology_note or 'N/A'} | {e.notes[:80]}"
        for e in journal
    ]) or "No journal entries."

    portfolio = db.query(models.Portfolio).filter_by(user_id=current_user.user_id).first()
    balance = portfolio.balance if portfolio else 10000
    pnl = portfolio.profit_loss if portfolio else 0

    prompt = f"""Analyze this beginner trader's performance and provide 4-5 specific, actionable tips.

RECENT TRADES:
{trade_summary}

JOURNAL (last 5 entries):
{journal_summary}

PORTFOLIO: Cash ${balance:.2f} | Realized P&L ${pnl:.2f}
Context: {request.context or 'General performance review'}

Focus on: entry quality, risk management, emotional patterns, and concrete next steps."""

    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    reply = response.text
    _save_chat(db, current_user.user_id, "Trade analysis request", reply)
    return schemas.AIChatResponse(reply=reply)


@router.post("/psychology", response_model=schemas.AIChatResponse)
async def analyze_psychology(request: schemas.PsychologyAnalysisRequest,
                              db: Session = Depends(get_db),
                              current_user: models.User = Depends(get_current_user)):
    """AI Trading Psychology Analyzer — per proposal feature."""
    client = _get_client()

    prompt = f"""Analyze this trader's psychology for a specific trade:

Entry Reason: {request.entry_reason}
Followed Plan: {request.followed_plan}
Emotion During Trade: {request.emotion}
Trade Outcome: {request.outcome}
Notes: {request.notes}

Identify: Was this FOMO, revenge trading, or overtrading? 
What psychological pattern is present?
Give 2-3 specific improvement actions. Under 120 words."""

    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    reply = response.text
    _save_chat(db, current_user.user_id, f"Psychology analysis: {request.entry_reason[:50]}", reply)
    return schemas.AIChatResponse(reply=reply)


@router.get("/recommendations", response_model=schemas.AIChatResponse)
async def get_learning_recommendations(db: Session = Depends(get_db),
                                        current_user: models.User = Depends(get_current_user)):
    """AI Learning Path Generator — per proposal."""
    client = _get_client()

    results = db.query(models.QuizResult).filter_by(user_id=current_user.user_id).all()
    if not results:
        return schemas.AIChatResponse(
            reply="Complete at least one quiz to receive AI-personalized learning recommendations. Start with Introduction to Trading!")

    from app.routers.courses import get_all_courses
    course_map = {c.course_id: c.title for c in db.query(models.Course).all()}
    summary = "\n".join([
        f"- {course_map.get(r.course_id,'Unknown')}: {r.score}/{r.total} "
        f"({'PASSED' if r.passed else 'FAILED'})"
        for r in results
    ])

    journal = db.query(models.TradingJournal).filter_by(user_id=current_user.user_id).all()
    top_mistakes = {}
    for e in journal:
        if e.mistake_tag != "NONE":
            top_mistakes[e.mistake_tag] = top_mistakes.get(e.mistake_tag, 0) + 1

    prompt = f"""You are an AI learning path generator for a trading education platform.

STUDENT QUIZ RESULTS:
{summary}

TOP TRADING MISTAKES FROM JOURNAL:
{', '.join(f'{k}({v}x)' for k,v in sorted(top_mistakes.items(), key=lambda x: -x[1])) or 'None yet'}

Create a personalized 3-step learning roadmap:
1. Identify their weakest topic
2. Recommend the specific module to revisit
3. Give one actionable practice exercise

Be encouraging and specific. Under 150 words."""

    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    reply = response.text
    _save_chat(db, current_user.user_id, "Learning path request", reply)
    return schemas.AIChatResponse(reply=reply)


@router.get("/chat-history")
def get_chat_history(db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    chats = db.query(models.AIChat).filter_by(user_id=current_user.user_id)\
              .order_by(models.AIChat.created_at.desc()).limit(20).all()
    return [{"question": c.question, "response": c.response,
             "created_at": c.created_at.isoformat()} for c in chats]