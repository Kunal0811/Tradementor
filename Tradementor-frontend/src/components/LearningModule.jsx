import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, HelpCircle, Award, ArrowRight, RotateCcw, Lock, Clock, Star } from 'lucide-react';

const COURSE_DATA = [
  {
    id: 'intro',
    title: 'Introduction to Trading',
    description: 'Understand how markets work, what assets are traded, and core vocabulary.',
    emoji: '📈',
    readTime: 4,
    difficulty: 'Beginner',
    content: [
      { heading: "What Is Trading?", text: "Trading is the act of buying and selling financial instruments — stocks, currencies, commodities, or crypto — to profit from price changes. Unlike long-term investing (holding for years), trading typically involves shorter timeframes: days, hours, or even minutes." },
      { heading: "Bid vs Ask Price", text: "Every asset has two prices. The Bid is the highest price a buyer will pay. The Ask is the lowest price a seller will accept. The gap between them is the Spread — the broker's implicit fee. Narrow spreads mean lower costs and higher liquidity." },
      { heading: "Market Participants", text: "Markets consist of retail traders (individuals), institutional traders (banks, hedge funds), and market makers who ensure liquidity. Understanding who you're trading against helps you make better decisions." },
      { heading: "Order Types", text: "A Market Order executes immediately at the current price. A Limit Order executes only at your specified price or better. A Stop Order triggers when price reaches a threshold. Most beginners start with market orders but graduate to limits for precision." },
    ],
    quiz: [
      { q: "What does the market 'Ask Price' represent?", opts: ["Highest price a buyer will pay", "Lowest price a seller will accept", "The historical average price", "Broker commission fee"], correct: 1 },
      { q: "What is the spread in trading?", opts: ["The trading fee charged upfront", "The difference between bid and ask prices", "The daily price range of an asset", "A type of derivative instrument"], correct: 1 },
      { q: "Which order type guarantees execution but not price?", opts: ["Limit Order", "Stop Order", "Market Order", "GTC Order"], correct: 2 },
    ]
  },
  {
    id: 'candlesticks',
    title: 'Candlestick Patterns',
    description: 'Learn to read price action through Japanese candlestick charts.',
    emoji: '🕯️',
    readTime: 6,
    difficulty: 'Beginner',
    content: [
      { heading: "Anatomy of a Candle", text: "Each candlestick shows four prices: Open, High, Low, Close (OHLC). The body spans open to close. The wicks (shadows) extend to the high and low. A green/white candle closes higher than it opened (bullish). A red/black candle closes lower (bearish)." },
      { heading: "Key Reversal Patterns", text: "The Hammer has a tiny body and long lower wick — shows buyers rejected lower prices, signaling potential bullish reversal. The Shooting Star is the opposite — tiny body, long upper wick — signals bearish reversal after an uptrend." },
      { heading: "Doji Candles", text: "A Doji forms when open and close are nearly equal, creating a cross shape. It signals indecision. In context (after a strong trend), a Doji warns of potential reversal. Never trade a Doji alone — wait for the next candle to confirm direction." },
      { heading: "Engulfing Patterns", text: "A Bullish Engulfing is a small red candle followed by a larger green candle that completely engulfs the prior body. It's a strong reversal signal. The Bearish Engulfing is the opposite — a large red candle engulfs a small green one, warning of downside." },
    ],
    quiz: [
      { q: "What does a green candlestick indicate?", opts: ["Price closed lower than it opened", "Price closed higher than it opened", "Trading volume was high", "The asset is in a downtrend"], correct: 1 },
      { q: "What does a Doji candle primarily signal?", opts: ["Strong bullish momentum", "Strong bearish reversal", "Market indecision", "Increased volume"], correct: 2 },
      { q: "In a Bullish Engulfing pattern, the second candle:", opts: ["Is smaller than the first", "Is red and closes lower", "Completely engulfs the first candle's body", "Has an unusually long wick"], correct: 2 },
    ]
  },
  {
    id: 'technical',
    title: 'Technical Indicators',
    description: 'Use RSI, MACD, Moving Averages, and Bollinger Bands to time trades.',
    emoji: '📊',
    readTime: 8,
    difficulty: 'Intermediate',
    content: [
      { heading: "Moving Averages (MA)", text: "A Moving Average smooths out price noise by averaging past prices. The 50-day MA and 200-day MA are widely watched. When the 50-day crosses above the 200-day, it's called a Golden Cross — a bullish signal. The opposite is a Death Cross — bearish. MAs are lagging indicators." },
      { heading: "RSI — Relative Strength Index", text: "RSI measures momentum on a 0–100 scale. Above 70 = overbought (price may be due for a pullback). Below 30 = oversold (potential bounce). RSI divergence is powerful: if price makes a new high but RSI doesn't, momentum is weakening and reversal may be near." },
      { heading: "MACD", text: "MACD (Moving Average Convergence Divergence) plots the relationship between two EMAs (12 and 26 period). The MACD line crossing above the signal line is bullish. Histogram bars show the gap. MACD works best in trending markets, not sideways chop." },
      { heading: "Bollinger Bands", text: "Bollinger Bands consist of a middle MA with upper and lower bands 2 standard deviations away. Price touching the upper band = overbought. Lower band = oversold. When bands contract (squeeze), a big price move is often coming. Direction is determined by which way price breaks." },
    ],
    quiz: [
      { q: "What does a Golden Cross signal?", opts: ["A bearish reversal pattern", "50-day MA crossing above 200-day MA", "RSI entering oversold territory", "Volume spike during decline"], correct: 1 },
      { q: "An RSI reading of 75 indicates:", opts: ["The asset is oversold", "Strong bullish confirmation", "Possible overbought condition", "Low volatility"], correct: 2 },
      { q: "Bollinger Band squeeze typically precedes:", opts: ["A period of low volatility", "A significant price move", "A trend reversal only", "Increased spreads"], correct: 1 },
    ]
  },
  {
    id: 'risk',
    title: 'Risk Management',
    description: 'Protect your capital with stop-losses, position sizing, and risk-reward rules.',
    emoji: '🛡️',
    readTime: 7,
    difficulty: 'Intermediate',
    content: [
      { heading: "The 1% Rule", text: "Professional traders risk no more than 1–2% of total capital on any single trade. If you have $10,000, you risk at most $100–$200 per trade. This ensures no single loss is catastrophic and allows you to survive a string of bad trades. Most beginners violate this rule — it's the #1 cause of account blowups." },
      { heading: "Stop-Loss Orders", text: "A stop-loss is an automatic order that closes your position if price moves against you by a preset amount. Always set it before entering a trade, not after. Placing it below a key support level (for longs) or above resistance (for shorts) gives your trade room to breathe without exposing too much capital." },
      { heading: "Risk-to-Reward Ratio", text: "For every trade, calculate your risk (entry to stop-loss) and potential reward (entry to target). A 1:2 ratio means risking $50 to make $100. Over time, even a 40% win rate is profitable with 1:2. The math: 4 wins × $100 = $400, 6 losses × $50 = $300 → +$100 net." },
      { heading: "Position Sizing Formula", text: "Position size = (Account risk $) ÷ (Trade risk per share). If you risk $100 and your stop is $5 below entry, you buy 20 shares. This keeps risk constant regardless of stock price. Never let position size be random — it should always be calculated." },
    ],
    quiz: [
      { q: "The 1% rule means risking no more than 1% of:", opts: ["The position value", "Daily profit target", "Total account capital per trade", "Margin available"], correct: 2 },
      { q: "A 1:2 Risk-to-Reward ratio means:", opts: ["Winning twice as often as losing", "Targeting double the amount you risk", "Using 2x leverage", "Holding 2 positions maximum"], correct: 1 },
      { q: "A stop-loss should ideally be placed:", opts: ["At a random price below entry", "Below a key support level", "Exactly 5% below entry always", "After the trade goes profitable"], correct: 1 },
    ]
  },
  {
    id: 'psychology',
    title: 'Trading Psychology',
    description: 'Overcome emotional bias, FOMO, and revenge trading to trade consistently.',
    emoji: '🧠',
    readTime: 6,
    difficulty: 'Advanced',
    content: [
      { heading: "Fear and Greed", text: "The two dominant emotions in trading are fear (of losing, of missing out) and greed (holding too long, over-leveraging). Markets oscillate between these extremes. The best traders learn to act against their instincts — buying when others fear, selling when others are greedy. This is called contrarian thinking." },
      { heading: "FOMO — Fear of Missing Out", text: "FOMO causes traders to chase assets after they've already moved significantly — buying the top of a rally. The antidote: have a pre-planned entry criteria. If you missed the setup, accept it and wait for the next one. Chasing trades leads to poor entries and blown stop-losses." },
      { heading: "Revenge Trading", text: "After a loss, the emotional urge is to immediately trade again to 'make it back.' This leads to oversized positions, ignored rules, and deeper losses. After any significant loss, step away. Review what went wrong before trading again. The market will still be there tomorrow." },
      { heading: "Building a Trading Plan", text: "Every trade should follow your written plan: entry criteria, position size, stop-loss, target, and exit rules. If a trade doesn't meet all criteria — don't take it. Following your plan even when your gut says otherwise is what separates professional traders from gamblers." },
    ],
    quiz: [
      { q: "What is 'revenge trading'?", opts: ["Trading in the opposite direction of a loss", "Over-trading to recover from a loss emotionally", "A risk management strategy", "Trading with a partner"], correct: 1 },
      { q: "The best defense against FOMO is:", opts: ["Trading more frequently", "Pre-defined entry criteria and discipline", "Increasing position size", "Watching the news constantly"], correct: 1 },
      { q: "A trading plan should include all of the following EXCEPT:", opts: ["Entry criteria", "Stop-loss level", "Predicted market direction", "Position size rules"], correct: 2 },
    ]
  },
];

export default function LearningModule() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [step, setStep] = useState('reading');
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(() => {
    const stored = localStorage.getItem('tm_progress');
    return stored ? JSON.parse(stored) : {};
  });
  const [contentIdx, setContentIdx] = useState(0);

  const course = COURSE_DATA[activeIdx];
  const totalContent = course.content.length;

  const saveProgress = (id, scoreVal, total) => {
    const next = { ...progress, [id]: { score: scoreVal, total, passed: scoreVal === total, completedAt: new Date().toISOString() } };
    setProgress(next);
    localStorage.setItem('tm_progress', JSON.stringify(next));
  };

  const handleSelect = (idx) => {
    if (answers[idx] == null) return; // already submitted
  };

  const submitQuiz = () => {
    let s = 0;
    course.quiz.forEach((q, i) => { if (answers[i] === q.correct) s++; });
    setScore(s);
    saveProgress(course.id, s, course.quiz.length);
    setStep('result');
  };

  const reset = () => { setAnswers({}); setScore(0); setStep('reading'); setContentIdx(0); };

  const switchCourse = (idx) => { setActiveIdx(idx); reset(); };

  const passedCount = COURSE_DATA.filter(c => progress[c.id]?.passed).length;
  const overallPct = Math.round((passedCount / COURSE_DATA.length) * 100);

  const diffColors = { Beginner: 'text-brand-bull bg-brand-bull/10', Intermediate: 'text-brand-gold bg-brand-gold/10', Advanced: 'text-brand-accent2 bg-brand-accent2/10' };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="font-bold text-white">Learning Progress</h2>
            <p className="text-xs text-brand-muted mt-0.5">{passedCount} of {COURSE_DATA.length} modules completed</p>
          </div>
          <span className="text-2xl font-bold font-mono text-brand-accent">{overallPct}%</span>
        </div>
        <div className="w-full bg-brand-surface rounded-full h-2 border border-brand-border">
          <div className="h-2 rounded-full bg-linear-to-r from-brand-accent to-brand-accent2 transition-all duration-700" style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex gap-3 mt-3 flex-wrap">
          {COURSE_DATA.map(c => (
            <div key={c.id} className={`flex items-center gap-1.5 text-xs ${progress[c.id]?.passed ? 'text-brand-bull' : 'text-brand-muted'}`}>
              {progress[c.id]?.passed ? <CheckCircle className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-brand-border" />}
              <span>{c.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold px-1 mb-3">Modules</p>
          {COURSE_DATA.map((c, idx) => {
            const p = progress[c.id];
            const isActive = idx === activeIdx;
            return (
              <button key={c.id} onClick={() => switchCourse(idx)}
                className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 ${isActive ? 'bg-brand-accent/10 border-brand-accent' : 'bg-brand-card border-brand-border hover:border-brand-muted hover:bg-brand-surface'}`}>
                <span className="text-lg leading-none mt-0.5">{c.emoji}</span>
                <div className="min-w-0">
                  <p className={`font-bold truncate leading-tight ${isActive ? 'text-brand-accent' : 'text-white'}`}>{c.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${diffColors[c.difficulty]}`}>{c.difficulty}</span>
                    {p?.passed && <CheckCircle className="w-3 h-3 text-brand-bull" />}
                    {p && !p.passed && <span className="text-[10px] text-brand-bear">{p.score}/{p.total}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded-2xl p-6 min-h-125 flex flex-col">
          {step === 'reading' && (
            <div className="flex flex-col flex-1 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{course.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${diffColors[course.difficulty]}`}>{course.difficulty}</span>
                      <span className="text-[10px] text-brand-muted flex items-center gap-1"><Clock className="w-3 h-3" />{course.readTime} min read</span>
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">{course.title}</h1>
                  </div>
                </div>
                <p className="text-brand-muted text-sm">{course.description}</p>
              </div>

              {/* Content cards */}
              <div className="flex-1 space-y-4">
                {course.content.map((block, i) => (
                  <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-brand-accent text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-brand-accent/15 text-[10px] font-bold flex items-center justify-center text-brand-accent">{i + 1}</span>
                      {block.heading}
                    </h3>
                    <p className="text-brand-text text-sm leading-relaxed">{block.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-brand-border">
                {progress[course.id] && <span className="text-xs text-brand-muted flex items-center gap-1"><Star className="w-3 h-3 text-brand-gold" /> Best: {progress[course.id].score}/{course.quiz.length}</span>}
                <button onClick={() => setStep('quiz')} className="ml-auto bg-brand-accent hover:bg-sky-300 text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer">
                  Take Quiz <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'quiz' && (
            <div className="flex flex-col flex-1 gap-6">
              <div className="border-b border-brand-border pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-brand-gold" />
                  <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Quiz · {course.title}</span>
                </div>
                <p className="text-sm text-brand-muted">Answer all {course.quiz.length} questions then submit.</p>
              </div>

              <div className="space-y-6 flex-1">
                {course.quiz.map((q, qi) => (
                  <div key={qi} className="space-y-3">
                    <h4 className="font-bold text-white text-sm">{qi + 1}. {q.q}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.opts.map((opt, oi) => {
                        const chosen = answers[qi] === oi;
                        return (
                          <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                            className={`text-left p-3 rounded-xl border text-sm transition-all cursor-pointer ${chosen ? 'bg-brand-accent/10 border-brand-accent text-brand-accent font-medium' : 'bg-brand-surface border-brand-border text-brand-text hover:border-brand-muted hover:text-white'}`}>
                            <span className={`text-[10px] font-bold mr-2 ${chosen ? 'text-brand-accent' : 'text-brand-muted'}`}>{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-brand-border">
                <button onClick={() => setStep('reading')} className="text-sm text-brand-muted hover:text-white underline transition-colors">← Back to reading</button>
                <button onClick={submitQuiz} disabled={Object.keys(answers).length < course.quiz.length}
                  className="bg-brand-bull hover:bg-emerald-400 disabled:opacity-40 text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:cursor-not-allowed">
                  Submit · {Object.keys(answers).length}/{course.quiz.length} answered
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6 py-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${score === course.quiz.length ? 'bg-brand-bull/10 ring-2 ring-brand-bull' : score >= Math.ceil(course.quiz.length / 2) ? 'bg-brand-gold/10 ring-2 ring-brand-gold' : 'bg-brand-bear/10 ring-2 ring-brand-bear'}`}>
                {score === course.quiz.length ? '🏆' : score >= Math.ceil(course.quiz.length / 2) ? '📚' : '🔄'}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Quiz Complete</h2>
                <p className="text-brand-muted mt-1 text-sm">{course.title}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-black font-mono ${score === course.quiz.length ? 'text-brand-bull' : score >= Math.ceil(course.quiz.length / 2) ? 'text-brand-gold' : 'text-brand-bear'}`}>{score}</span>
                <span className="text-2xl text-brand-muted font-mono">/ {course.quiz.length}</span>
              </div>

              <div className="space-y-1 text-sm">
                {score === course.quiz.length && <p className="text-brand-bull font-semibold">Perfect score! Module mastered. 🎉</p>}
                {score >= Math.ceil(course.quiz.length / 2) && score < course.quiz.length && <p className="text-brand-gold">Good effort — review the missed concepts and retry.</p>}
                {score < Math.ceil(course.quiz.length / 2) && <p className="text-brand-bear">Review the reading material and try again.</p>}
              </div>

              {/* Correct answer review */}
              <div className="w-full space-y-3 text-left">
                {course.quiz.map((q, qi) => {
                  const userAns = answers[qi];
                  const correct = userAns === q.correct;
                  return (
                    <div key={qi} className={`rounded-xl border p-3 text-xs ${correct ? 'border-brand-bull/30 bg-brand-bull/5' : 'border-brand-bear/30 bg-brand-bear/5'}`}>
                      <p className="font-semibold text-white mb-1">{qi + 1}. {q.q}</p>
                      <p className={correct ? 'text-brand-bull' : 'text-brand-bear'}>
                        {correct ? '✓ Correct' : `✗ Your answer: "${q.opts[userAns]}" → Correct: "${q.opts[q.correct]}"`}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex items-center gap-2 bg-brand-surface hover:bg-brand-border border border-brand-border text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
                {activeIdx < COURSE_DATA.length - 1 && (
                  <button onClick={() => switchCourse(activeIdx + 1)} className="flex items-center gap-2 bg-brand-accent hover:bg-sky-300 text-brand-dark px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                    Next Module <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}