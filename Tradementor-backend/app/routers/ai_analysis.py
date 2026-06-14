from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas
import os

router = APIRouter(prefix="/ai", tags=["AI Analysis"])

@router.post("/chat", response_model=schemas.AIChatResponse)
async def ai_chat(request: schemas.AIChatRequest, current_user: models.User = Depends(get_current_user)):
    """Direct AI chat endpoint using Google Gemini."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="Gemini API key not configured.")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=(
                "You are TradeMentor AI, an expert trading educator. "
                "Help beginners learn trading concepts, indicators, patterns, risk management, and psychology. "
                "Be concise, educational, and practical. Never give real financial advice. "
                "Always note this is a simulation for learning. Keep responses under 200 words."
            )
        )
        chat = model.start_chat(history=[
            {"role": ("model" if m["role"] == "assistant" else "user"), "parts": [m["text"]]}
            for m in request.history[:-1]
        ])
        response = chat.send_message(request.message)
        return schemas.AIChatResponse(reply=response.text)

    except ImportError:
        raise HTTPException(status_code=503, detail="google-generativeai package not installed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

@router.post("/analyze-trade", response_model=schemas.AIChatResponse)
async def analyze_trade(
    request: schemas.TradeAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """AI analyzes a user's recent trades and provides feedback."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="Gemini API key not configured.")

        # Fetch user's last 10 trades for context
        trades = db.query(models.Trade).filter(
            models.Trade.user_id == current_user.user_id
        ).order_by(models.Trade.trade_date.desc()).limit(10).all()

        trade_summary = "\n".join([
            f"- {t.action_type} {t.quantity} {t.stock_symbol} @ ${t.execution_price:.2f} ({t.status})"
            for t in trades
        ]) or "No trades yet."

        journal_entries = db.query(models.TradingJournal).filter(
            models.TradingJournal.user_id == current_user.user_id
        ).order_by(models.TradingJournal.created_at.desc()).limit(5).all()

        journal_summary = "\n".join([
            f"- {e.stock_symbol or 'N/A'} | Outcome: {e.outcome} | Mistake: {e.mistake_tag} | Notes: {e.notes[:80]}"
            for e in journal_entries
        ]) or "No journal entries."

        portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.user_id).first()
        balance = portfolio.balance if portfolio else 10000
        pnl = portfolio.profit_loss if portfolio else 0

        prompt = f"""Analyze this beginner trader's activity and give 3-5 specific, actionable improvement tips.

TRADE HISTORY (last 10):
{trade_summary}

TRADING JOURNAL (last 5):
{journal_summary}

PORTFOLIO: Balance ${balance:.2f} | Realized P&L ${pnl:.2f}

Specific trade context: {request.context or 'General analysis requested.'}

Focus on: entry/exit quality, risk management, emotional patterns, and what to improve next."""

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return schemas.AIChatResponse(reply=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@router.get("/recommendations", response_model=schemas.AIChatResponse)
async def get_learning_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate personalized learning recommendations based on quiz performance."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="Gemini API key not configured.")

        results = db.query(models.QuizResult).filter(
            models.QuizResult.user_id == current_user.user_id
        ).all()

        if not results:
            return schemas.AIChatResponse(
                reply="Complete at least one quiz module to receive personalized learning recommendations. Start with the Introduction to Trading module!"
            )

        summary = "\n".join([f"- Quiz {r.quiz_id}: score {r.score}" for r in results])
        prompt = f"""A beginner trader has completed these quiz assessments:
{summary}

Based on these results, provide 3 specific personalized learning recommendations. 
Be encouraging but specific about areas needing improvement. Under 150 words."""

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return schemas.AIChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")