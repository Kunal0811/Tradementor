import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, AlertCircle, Zap } from 'lucide-react';
import { aiAPI, geminiDirect } from '../services/api';

const SYSTEM = `You are TradeMentor AI, an expert trading educator inside a simulation platform.
Help beginners learn: candlestick patterns, technical indicators, risk management, trading psychology, and market concepts.
Be concise (under 200 words), educational, and always include a practical tip. 
Never give real financial advice. Note this is a simulation for learning purposes.`;

const SUGGESTED = [
  "What is a candlestick pattern?",
  "Explain stop-loss vs take-profit",
  "What is the RSI indicator?",
  "How do I manage trading risk?",
  "What causes market volatility?",
  "Explain support and resistance",
];

const DEMO_RESPONSES = {
  candlestick: "Candlestick charts show price movement per period. Each candle has a body (open→close) and wicks (high/low). Green = closed higher (bullish). Red = closed lower (bearish). Key patterns: Hammer (bullish reversal — long lower wick), Shooting Star (bearish reversal — long upper wick), Doji (indecision — tiny body). 💡 Tip: Never trade a single candle in isolation — always wait for confirmation from the next candle.",
  stop: "A Stop-Loss automatically closes your trade if price moves against you — it caps your downside. A Take-Profit closes the trade when your target is reached — it locks in gains. 💡 Rule: Always set your stop-loss BEFORE entering, not after. Most pros risk no more than 1-2% of capital per trade. A good risk-reward ratio is at least 1:2 (risk $50, target $100).",
  rsi: "RSI (Relative Strength Index) measures momentum on a 0–100 scale. Above 70 = overbought (price may reverse down). Below 30 = oversold (potential bounce). RSI divergence is powerful: if price makes a new high but RSI doesn't, momentum is weakening. 💡 Tip: RSI works best in range-bound markets, not strong trends. In a bull trend, RSI can stay above 70 for extended periods.",
  risk: "Risk management is the #1 skill in trading. Key rules: (1) Never risk more than 1–2% of capital on one trade. (2) Always define stop-loss before entering. (3) Aim for 1:2 Risk-Reward or better. (4) Never revenge trade after a loss. 💡 Your job isn't to be right — it's to lose small when wrong and win big when right. Consistent small wins beat large sporadic ones.",
  support: "Support is a price level where buying interest prevents further decline — the floor. Resistance is where selling pressure prevents further rise — the ceiling. When price breaks through resistance, it often becomes new support (role reversal). 💡 Tip: Round numbers ($100, $50) often act as psychological support/resistance. The more times a level is tested, the stronger — and the more significant when it finally breaks.",
};

export default function AiAssistantDrawer() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState([
    { role:'assistant', text:"Hi! I'm your TradeMentor AI Coach. Ask me anything about trading — candlestick patterns, indicators, risk management, or psychology. I'm here to help you learn.", ts: Date.now() }
  ]);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);
  const [mode, setMode]       = useState('detecting'); // 'backend' | 'direct' | 'demo'
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  // Detect which AI mode to use
  useEffect(() => {
    (async () => {
      try {
        await aiAPI.chat('ping', []);
        setMode('backend');
      } catch {
        if (import.meta.env.VITE_GEMINI_API_KEY) {
          setMode('direct');
        } else {
          setMode('demo');
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const getDemoReply = (text) => {
    const l = text.toLowerCase();
    if (l.includes('candlestick') || l.includes('candle')) return DEMO_RESPONSES.candlestick;
    if (l.includes('stop') || l.includes('take profit')) return DEMO_RESPONSES.stop;
    if (l.includes('rsi') || l.includes('relative strength')) return DEMO_RESPONSES.rsi;
    if (l.includes('risk') || l.includes('position size') || l.includes('1%')) return DEMO_RESPONSES.risk;
    if (l.includes('support') || l.includes('resistance')) return DEMO_RESPONSES.support;
    return `Great question! In demo mode I have pre-written answers for: candlestick patterns, stop-loss/take-profit, RSI, risk management, and support/resistance. To unlock full AI answers, start the FastAPI backend or add VITE_GEMINI_API_KEY to your .env file. 💡 Keep studying — consistency is the most underrated trait in trading.`;
  };

  const send = async (text) => {
    if (!text.trim() || busy) return;
    setError(null);
    const userMsg = { role: 'user', text: text.trim(), ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      let reply;
      if (mode === 'backend') {
        const res = await aiAPI.chat(text.trim(), messages.map(m => ({ role: m.role, text: m.text })));
        reply = res.data.reply;
      } else if (mode === 'direct') {
        reply = await geminiDirect(next, SYSTEM);
      } else {
        await new Promise(r => setTimeout(r, 800));
        reply = getDemoReply(text);
      }
      setMessages([...next, { role:'assistant', text: reply, ts: Date.now() }]);
    } catch (err) {
      setError('AI request failed. Check console for details.');
    } finally {
      setBusy(false);
    }
  };

  const modeLabel = { backend:'Backend · Gemini 2.0', direct:'Direct · Gemini 2.0', demo:'Demo Mode', detecting:'Detecting…' };
  const modeColor = { backend:'bg-brand-bull', direct:'bg-brand-bull', demo:'bg-brand-gold', detecting:'bg-brand-muted' };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-accent text-brand-dark px-4 py-3 rounded-2xl shadow-2xl hover:scale-105 transition-all z-40 flex items-center gap-2 font-bold text-sm pulse-glow">
        <Sparkles className="w-4 h-4" /><span>AI Coach</span>
      </button>

      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-110 bg-brand-card border-l border-brand-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">TradeMentor AI Coach</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${modeColor[mode]} blink`} />
                <span className="text-[10px] text-brand-muted">{modeLabel[mode]}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-brand-muted hover:text-white p-1.5 rounded-lg hover:bg-brand-border transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 fade-in ${msg.role==='user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${msg.role==='user'?'bg-brand-accent/20 text-brand-accent':'bg-brand-accent2/20 text-brand-accent2'}`}>
                {msg.role==='user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[82%] flex flex-col ${msg.role==='user'?'items-end':'items-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role==='user'?'bg-brand-accent text-brand-dark font-medium rounded-tr-none':'bg-brand-surface border border-brand-border text-brand-text rounded-tl-none'}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-brand-muted px-1 mt-1">{new Date(msg.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-2.5 fade-in">
              <div className="w-7 h-7 rounded-lg bg-brand-accent2/20 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-brand-accent2" /></div>
              <div className="bg-brand-surface border border-brand-border rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
                {[0,0.2,0.4].map((d,i) => <span key={i} className="w-2 h-2 bg-brand-muted rounded-full animate-bounce" style={{animationDelay:`${d}s`}} />)}
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 bg-brand-bear/10 border border-brand-bear/30 rounded-xl p-3 text-xs text-brand-bear fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-2 font-semibold">Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.map((s,i) => (
                <button key={i} onClick={() => send(s)} className="text-xs bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-text px-2.5 py-1.5 rounded-lg transition-colors hover:text-white">{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* AI Trade Analysis button */}
        {mode === 'backend' && (
          <div className="px-4 pb-2">
            <button onClick={async () => {
              setBusy(true);
              try {
                const res = await aiAPI.analyzeTrades('General performance review');
                setMessages(prev => [...prev, { role:'assistant', text: res.data.reply, ts: Date.now() }]);
              } catch {} finally { setBusy(false); }
            }} disabled={busy}
              className="w-full flex items-center justify-center gap-2 text-xs bg-brand-accent2/10 hover:bg-brand-accent2/20 border border-brand-accent2/30 text-brand-accent2 py-2 rounded-xl transition-colors disabled:opacity-50">
              <Zap className="w-3.5 h-3.5" /> Analyze My Trading Performance
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-brand-border bg-brand-surface/50">
          <div className="flex gap-2 items-end">
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input);}}}
              placeholder="Ask about indicators, patterns, strategies…"
              rows={1} className="flex-1 bg-brand-dark border border-brand-border text-brand-text placeholder-brand-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-accent resize-none font-sans transition-colors"
              style={{maxHeight:'100px',overflowY:'auto'}} />
            <button onClick={() => send(input)} disabled={!input.trim()||busy}
              className="p-2.5 bg-brand-accent disabled:opacity-40 text-brand-dark rounded-xl hover:bg-sky-300 transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-brand-muted mt-2 text-center">
            {mode==='demo' && <>Demo mode · <code className="text-brand-gold">VITE_GEMINI_API_KEY</code> or backend for full AI</>}
            {mode==='direct' && 'Gemini API · Direct connection'}
            {mode==='backend' && 'Connected to FastAPI backend · Gemini 2.0 Flash'}
          </p>
        </div>
      </div>
    </>
  );
}