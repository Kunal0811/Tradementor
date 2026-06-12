import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, AlertCircle } from 'lucide-react';
import { geminiChat } from '../services/api';

const SYSTEM_PROMPT = `You are TradeMentor AI, an expert trading educator embedded inside a trading simulation platform. 
Your role is to help beginners learn trading concepts, understand technical indicators, chart patterns, risk management, and trading psychology.
Be concise, educational, and always include a practical tip. Use simple language. Format responses with clear structure when needed.
Never give real financial advice. Always remind users this is a simulation platform for learning.
Keep responses under 200 words unless a concept genuinely requires more explanation.`;

const SUGGESTED = [
  "What is a candlestick pattern?",
  "Explain stop-loss vs take-profit",
  "What is the RSI indicator?",
  "How do I manage trading risk?",
  "What causes market volatility?",
  "Explain support and resistance",
];

export default function AiAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your TradeMentor AI coach. Ask me anything about trading — patterns, indicators, risk management, or psychology. I'm here to help you learn.", ts: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasApiKey] = useState(() => !!import.meta.env.VITE_GEMINI_API_KEY);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const userMsg = { role: 'user', text: text.trim(), ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      if (!hasApiKey) {
        // Demo mode — simulated responses
        await new Promise(r => setTimeout(r, 1000));
        const demo = getDemoResponse(text);
        setMessages([...nextMessages, { role: 'assistant', text: demo, ts: Date.now() }]);
      } else {
        const reply = await geminiChat(nextMessages, SYSTEM_PROMPT);
        setMessages([...nextMessages, { role: 'assistant', text: reply, ts: Date.now() }]);
      }
    } catch (err) {
      setError('Could not reach AI. Check your Gemini API key in .env');
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoResponse = (q) => {
    const lower = q.toLowerCase();
    if (lower.includes('candlestick')) return "Candlestick charts show price movement in a period. Each candle has a body (open-close range) and wicks (high-low range). A green/white candle means price closed higher; red/black means it closed lower. Key patterns: Doji (indecision), Hammer (bullish reversal), Shooting Star (bearish reversal). 💡 Tip: Never trade a single candle in isolation — look for confirmation from the next candle.";
    if (lower.includes('stop')) return "A Stop-Loss is an automatic order that closes your trade if price moves against you by a set amount — it caps your downside. A Take-Profit closes the trade when your target profit is reached. 💡 Rule of thumb: Always set your stop-loss before entering a trade, not after. Most pros risk no more than 1-2% of capital per trade.";
    if (lower.includes('rsi')) return "RSI (Relative Strength Index) measures momentum on a scale of 0–100. Above 70 = overbought (possible reversal down). Below 30 = oversold (possible reversal up). It's a lagging indicator — don't use it alone. 💡 Tip: RSI divergence (price makes a new high but RSI doesn't) is a powerful signal that momentum is weakening.";
    if (lower.includes('risk')) return "Risk management is the #1 skill in trading. Key rules: (1) Never risk more than 1-2% of your capital on one trade. (2) Always define your stop-loss before entering. (3) Aim for a Risk:Reward ratio of at least 1:2. (4) Don't overtrade — fewer, high-quality trades beat many random ones. 💡 Your job isn't to be right — it's to lose small when wrong and win big when right.";
    if (lower.includes('support') || lower.includes('resistance')) return "Support is a price level where buying interest is strong enough to prevent further decline — the floor. Resistance is where selling pressure prevents further rise — the ceiling. When price breaks through resistance, it often becomes new support. 💡 Tip: Round numbers (like $100, $50) often act as psychological support/resistance levels.";
    return `Great question about "${q}"! This is a demo mode (no Gemini API key set). To enable real AI responses, add your VITE_GEMINI_API_KEY to the .env file. In the meantime, I can answer questions about candlesticks, stop-loss, RSI, risk management, and support/resistance. 💡 Keep learning — consistent study beats sporadic effort in trading education.`;
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-accent text-brand-dark px-4 py-3 rounded-2xl shadow-2xl hover:scale-105 transition-all z-40 flex items-center gap-2 font-bold text-sm pulse-glow"
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Coach</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-110 bg-brand-card border-l border-brand-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">TradeMentor AI Coach</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-brand-bull' : 'bg-brand-gold'} blink`} />
                <span className="text-[10px] text-brand-muted">{hasApiKey ? 'Gemini 2.0 Flash · Live' : 'Demo Mode'}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-brand-muted hover:text-white p-1.5 rounded-lg hover:bg-brand-border transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2.5 fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${msg.role === 'user' ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-accent2/20 text-brand-accent2'}`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[82%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-accent text-brand-dark font-medium rounded-tr-none' : 'bg-brand-surface border border-brand-border text-brand-text rounded-tl-none'}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-brand-muted px-1">{formatTime(msg.ts)}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 fade-in">
              <div className="w-7 h-7 rounded-lg bg-brand-accent2/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-brand-accent2" />
              </div>
              <div className="bg-brand-surface border border-brand-border rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} className="w-2 h-2 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-brand-bear/10 border border-brand-bear/30 rounded-xl p-3 text-xs text-brand-bear fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-2 font-semibold">Suggested questions</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="text-xs bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-text px-2.5 py-1.5 rounded-lg transition-colors hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-brand-border bg-brand-surface/50">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about indicators, patterns, strategies..."
              rows={1}
              className="flex-1 bg-brand-dark border border-brand-border text-brand-text placeholder-brand-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-accent resize-none font-sans transition-colors"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-brand-accent disabled:opacity-40 text-brand-dark rounded-xl hover:bg-sky-300 transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {!hasApiKey && (
            <p className="text-[10px] text-brand-muted mt-2 text-center">Demo mode · Add <code className="text-brand-gold">VITE_GEMINI_API_KEY</code> to enable real AI</p>
          )}
        </div>
      </div>
    </>
  );
}