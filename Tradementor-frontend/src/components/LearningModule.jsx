import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle, HelpCircle, ArrowRight, RotateCcw, Clock, Loader, Trophy, Brain } from 'lucide-react';
import { courseAPI, aiAPI } from '../services/api';

const CONTENT = {
  1: { emoji:'📈', difficulty:'Beginner', readTime:4, blocks:[
    { heading:"What Is Trading?", text:"Trading is buying and selling financial instruments — stocks, currencies, commodities, or crypto — to profit from price changes. Unlike long-term investing, trading uses shorter timeframes: days, hours, or minutes." },
    { heading:"Bid vs Ask Price", text:"Every asset has two prices. The Bid is the highest price a buyer will pay. The Ask is the lowest a seller will accept. The gap between them is the Spread — the broker's implicit fee. Narrow spreads = lower costs." },
    { heading:"Order Types", text:"A Market Order executes immediately at current price. A Limit Order executes only at your specified price or better — giving you price control. A Stop Order triggers when price hits a threshold — used for stop-losses." },
    { heading:"Market Participants", text:"Markets have retail traders (individuals like you), institutional traders (banks, hedge funds), and market makers who provide liquidity. Knowing who you trade against helps you anticipate moves." },
  ]},
  2: { emoji:'🕯️', difficulty:'Beginner', readTime:6, blocks:[
    { heading:"Anatomy of a Candle", text:"Each candlestick shows OHLC: Open, High, Low, Close. The body spans open to close. Wicks extend to the high and low. Green/white candle = closed higher (bullish). Red/black = closed lower (bearish)." },
    { heading:"Hammer & Shooting Star", text:"Hammer: tiny body at top, long lower wick — buyers rejected lower prices, potential bullish reversal. Shooting Star: tiny body at bottom, long upper wick — sellers rejected higher prices, potential bearish reversal." },
    { heading:"Doji Candle", text:"A Doji forms when open and close are nearly equal — a cross shape. It signals indecision. After a strong trend, a Doji warns of potential reversal. Always wait for the NEXT candle to confirm direction." },
    { heading:"Engulfing Patterns", text:"Bullish Engulfing: small red candle followed by a larger green that engulfs its body — strong reversal signal. Bearish Engulfing: large red candle engulfs a small green one — downtrend warning. Volume confirms both." },
  ]},
  3: { emoji:'📊', difficulty:'Intermediate', readTime:8, blocks:[
    { heading:"Moving Averages (MA)", text:"A Moving Average smooths price noise by averaging past prices. 50-day and 200-day MAs are widely watched. Golden Cross: 50-day crosses above 200-day = bullish signal. Death Cross = bearish. MAs lag price — they confirm, not predict." },
    { heading:"RSI — Relative Strength Index", text:"RSI measures momentum 0–100. Above 70 = overbought (price may reverse down). Below 30 = oversold (potential bounce). RSI divergence: if price makes a new high but RSI doesn't, momentum is weakening — reversal likely near." },
    { heading:"MACD", text:"MACD plots the gap between two EMAs (12-period and 26-period). When the MACD line crosses above the signal line = bullish. Histogram bars show the gap. Works best in trending markets, unreliable in sideways chop." },
    { heading:"Bollinger Bands", text:"Three lines: middle MA with upper/lower bands 2 standard deviations away. Price touching upper band = overbought. Lower band = oversold. A Bollinger Squeeze (bands contracting) precedes a big price move — direction TBD by breakout side." },
  ]},
  4: { emoji:'🛡️', difficulty:'Intermediate', readTime:7, blocks:[
    { heading:"The 1% Rule", text:"Never risk more than 1–2% of total capital on a single trade. With $10,000, that's $100–$200 max risk per trade. This ensures no single loss is catastrophic and lets you survive a string of losers — which every trader experiences." },
    { heading:"Stop-Loss Orders", text:"A stop-loss automatically closes your position if price moves against you by a preset amount. Always set it BEFORE entering — not after. Place it below key support (for longs) or above key resistance (for shorts)." },
    { heading:"Risk-to-Reward Ratio", text:"For every trade, calculate risk (entry to stop) and potential reward (entry to target). Minimum 1:2 ratio: risk $50, target $100. With 1:2 R:R, even a 40% win rate is profitable: 4 wins×$100 = $400, 6 losses×$50 = $300 → +$100 net." },
    { heading:"Position Sizing Formula", text:"Position size = (Account risk $) ÷ (Trade risk per share). If you risk $100 total and stop is $5 below entry, you can buy exactly 20 shares. Never let position size be arbitrary — always calculate it before placing the order." },
  ]},
  5: { emoji:'🧠', difficulty:'Advanced', readTime:6, blocks:[
    { heading:"Fear and Greed", text:"The two dominant market emotions are fear (of losing, of missing out) and greed (holding too long, oversizing). Markets cycle between them. The best traders act against instinct — buying when others fear, selling when others are greedy." },
    { heading:"FOMO — Fear of Missing Out", text:"FOMO pushes you to chase assets that have already moved — buying the top. Antidote: pre-planned entry criteria. If the setup is gone, accept it and wait for the next one. Chasing leads to bad entries and blown stops." },
    { heading:"Revenge Trading", text:"After a loss, the emotional urge to immediately recover it leads to oversized positions and ignored rules — turning one loss into many. After any significant loss, step away, review what went wrong, then re-engage with a clear head." },
    { heading:"Building a Trading Plan", text:"Every trade should follow a written plan: entry criteria, position size, stop-loss, target, and exit rules. If any criterion isn't met — skip the trade. Discipline between trades is what separates consistent professionals from emotional gamblers." },
  ]},
};

const QUIZ_DATA = {
  1: [
    { question:"What does the Ask Price represent?", options:["The highest price a buyer will pay","The lowest price a seller will accept","The daily price average","The broker's commission"], answer:1, explanation:"The Ask is what sellers want — the lowest they'll accept. The Bid is what buyers offer." },
    { question:"What is the spread in trading?", options:["A fixed commission fee","The difference between bid and ask price","The daily price range","A type of derivative"], answer:1, explanation:"Spread = Ask − Bid. It's the broker's cost built into every trade." },
    { question:"Which order type guarantees execution but not price?", options:["Limit Order","Stop Order","Market Order","GTC Order"], answer:2, explanation:"Market Orders execute immediately at whatever price is available — no price guarantee." },
  ],
  2: [
    { question:"What does a green candlestick indicate?", options:["Price closed lower than it opened","Price closed higher than it opened","Trading volume was high","The asset is in a downtrend"], answer:1, explanation:"Green (or white) candle = price closed ABOVE where it opened — bullish." },
    { question:"What does a Doji candle primarily signal?", options:["Strong bullish momentum","Strong bearish reversal","Market indecision","Increased volume"], answer:2, explanation:"Doji = open and close nearly equal. Neither bulls nor bears won — indecision." },
    { question:"In a Bullish Engulfing pattern, the second candle:", options:["Is smaller than the first","Is red and closes lower","Completely engulfs the first candle's body","Has an unusually long wick"], answer:2, explanation:"The second candle must fully engulf the prior candle's body to qualify as an Engulfing pattern." },
  ],
  3: [
    { question:"What does a Golden Cross signal?", options:["A bearish reversal","50-day MA crossing above 200-day MA","RSI entering oversold territory","A volume spike"], answer:1, explanation:"Golden Cross = 50-day MA crosses above 200-day MA. Long-term bullish signal." },
    { question:"An RSI reading of 75 indicates:", options:["The asset is oversold","Strong bullish confirmation","Possible overbought condition","Low volatility"], answer:2, explanation:"RSI above 70 = overbought — the asset may be due for a pullback, though it can stay overbought in strong trends." },
    { question:"Bollinger Band squeeze typically precedes:", options:["A period of low volatility","A significant price move","A trend reversal only","Increased spreads"], answer:1, explanation:"Squeeze = bands contract = low volatility. This typically precedes an explosive breakout in either direction." },
  ],
  4: [
    { question:"The 1% rule means risking no more than 1% of:", options:["The position value","Daily profit target","Total account capital per trade","Margin available"], answer:2, explanation:"The 1% rule applies to your TOTAL account capital — not position size or daily target." },
    { question:"A 1:2 Risk-to-Reward ratio means:", options:["Winning twice as often","Targeting double the amount you risk","Using 2x leverage","Holding 2 positions"], answer:1, explanation:"1:2 R:R = for every $1 risked, you target $2 profit. This makes you profitable even with a 40% win rate." },
    { question:"A stop-loss should ideally be placed:", options:["At a random level below entry","Below a key support level","Exactly 5% below entry always","After the trade goes profitable"], answer:1, explanation:"Placing stops below support gives your trade room to breathe while keeping risk defined." },
  ],
  5: [
    { question:"What is revenge trading?", options:["Trading opposite to a loss","Over-trading emotionally to recover from a loss","A risk management strategy","Trading with a partner"], answer:1, explanation:"Revenge trading = emotional, impulsive trading after a loss trying to 'make it back' — leads to more losses." },
    { question:"The best defense against FOMO is:", options:["Trading more frequently","Pre-defined entry criteria and discipline","Increasing position size","Watching news constantly"], answer:1, explanation:"With a written plan and clear entry criteria, you can objectively say 'this setup doesn't qualify' — removing emotion." },
    { question:"A trading plan should include all EXCEPT:", options:["Entry criteria","Stop-loss level","Predicted market direction for the year","Position size rules"], answer:2, explanation:"You can't predict market direction reliably. A good plan focuses on YOUR actions, not market predictions." },
  ],
};

const DIFF = { Beginner:'text-brand-bull bg-brand-bull/10', Intermediate:'text-brand-gold bg-brand-gold/10', Advanced:'text-brand-accent2 bg-brand-accent2/10' };

export default function LearningModule() {
  const [courses, setCourses]     = useState([]);
  const [activeId, setActiveId]   = useState(1);
  const [step, setStep]           = useState('reading');
  const [answers, setAnswers]     = useState({});
  const [score, setScore]         = useState(0);
  const [bestScores, setBestScores] = useState({});   // { courseId: { score, total, passed } }
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [reco, setReco]           = useState('');
  const [recoLoading, setRecoLoading] = useState(false);
  const [apiError, setApiError]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([courseAPI.getAll(), courseAPI.myProgress()]);
      setCourses(cRes.data.length ? cRes.data : [1,2,3,4,5].map(id => ({
        course_id:id, title:['Introduction to Trading','Candlestick Patterns','Technical Indicators','Risk Management','Trading Psychology'][id-1], order_index:id
      })));
      const best = {};
      pRes.data.forEach(r => {
        if (!best[r.course_id] || r.score > best[r.course_id].score)
          best[r.course_id] = { score:r.score, total:r.total, passed:r.passed };
      });
      setBestScores(best);
      setApiError(false);
    } catch {
      setApiError(true);
      setCourses([1,2,3,4,5].map(id => ({
        course_id:id, title:['Introduction to Trading','Candlestick Patterns','Technical Indicators','Risk Management','Trading Psychology'][id-1], order_index:id
      })));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const switchCourse = (id) => { setActiveId(id); setStep('reading'); setAnswers({}); setScore(0); };

  const submitQuiz = async () => {
    const quiz = QUIZ_DATA[activeId] || [];
    let s = 0;
    quiz.forEach((q, i) => { if (answers[i] === q.answer) s++; });
    setScore(s);
    setSaving(true);
    if (!apiError) {
      try {
        await courseAPI.submitResult(activeId, s, quiz.length);
        await load();
      } catch {}
    } else {
      setBestScores(prev => {
        const existing = prev[activeId];
        if (!existing || s > existing.score)
          return { ...prev, [activeId]: { score:s, total:quiz.length, passed: s===quiz.length } };
        return prev;
      });
    }
    setSaving(false);
    setStep('result');
  };

  const fetchReco = async () => {
    setRecoLoading(true);
    try {
      const res = await aiAPI.recommendations();
      setReco(res.data.reply);
    } catch { setReco('Complete quizzes to get AI recommendations. Start the FastAPI backend and add your GEMINI_API_KEY.'); }
    finally { setRecoLoading(false); }
  };

  const passedCount = courses.filter(c => bestScores[c.course_id]?.passed).length;
  const content = CONTENT[activeId] || CONTENT[1];
  const quiz = QUIZ_DATA[activeId] || [];
  const activeCourse = courses.find(c => c.course_id === activeId);

  if (loading) return <div className="flex items-center justify-center h-64 text-brand-muted"><Loader className="w-6 h-6 animate-spin mr-2"/>Loading modules…</div>;

  return (
    <div className="space-y-6">
      {/* Progress banner */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-white">Learning Progress</h2>
            <p className="text-xs text-brand-muted mt-0.5">{passedCount} of {courses.length} modules mastered</p>
          </div>
          <button onClick={fetchReco} disabled={recoLoading}
            className="flex items-center gap-2 bg-brand-accent2/10 hover:bg-brand-accent2/20 border border-brand-accent2/30 text-brand-accent2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
            {recoLoading ? <Loader className="w-3 h-3 animate-spin"/> : <Brain className="w-3 h-3"/>}
            AI Learning Path
          </button>
        </div>
        <div className="w-full bg-brand-surface rounded-full h-2 border border-brand-border">
          <div className="h-2 rounded-full bg-linear-to-r from-brand-accent to-brand-accent2 transition-all duration-700"
            style={{width:`${(passedCount/courses.length)*100}%`}}/>
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {courses.map(c => {
            const b = bestScores[c.course_id];
            return (
              <div key={c.course_id} className={`flex items-center gap-1.5 text-xs ${b?.passed?'text-brand-bull':b?'text-brand-gold':'text-brand-muted'}`}>
                {b?.passed ? <CheckCircle className="w-3 h-3"/> : <div className="w-3 h-3 rounded-full border border-current opacity-50"/>}
                <span>{CONTENT[c.course_id]?.emoji} {c.title}</span>
                {b && <span className="font-mono text-[10px]">({b.score}/{b.total})</span>}
              </div>
            );
          })}
        </div>
        {reco && (
          <div className="mt-4 bg-brand-accent2/5 border border-brand-accent2/20 rounded-xl p-4 text-xs text-brand-text leading-relaxed fade-in">
            <p className="text-brand-accent2 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><Brain className="w-3 h-3"/> AI Personalized Learning Path</p>
            <p className="whitespace-pre-wrap">{reco}</p>
          </div>
        )}
      </div>

      {apiError && (
        <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-4 py-2.5 text-xs text-brand-gold">
          ⚠️ Backend offline — reading & quizzes work, but progress won't save to database. Run <code>python seed.py</code> then start FastAPI.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold px-1 mb-3">Modules</p>
          {courses.map(c => {
            const ct = CONTENT[c.course_id];
            const b = bestScores[c.course_id];
            const isActive = c.course_id === activeId;
            return (
              <button key={c.course_id} onClick={() => switchCourse(c.course_id)}
                className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 ${isActive?'bg-brand-accent/10 border-brand-accent':'bg-brand-card border-brand-border hover:border-brand-muted hover:bg-brand-surface'}`}>
                <span className="text-lg leading-none mt-0.5">{ct?.emoji||'📚'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold truncate leading-tight text-sm ${isActive?'text-brand-accent':'text-white'}`}>{c.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DIFF[ct?.difficulty]||''}`}>{ct?.difficulty}</span>
                    {b?.passed && <CheckCircle className="w-3 h-3 text-brand-bull"/>}
                    {b && !b.passed && <span className="text-[10px] text-brand-gold font-mono">{b.score}/{b.total}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded-2xl p-6 min-h-135 flex flex-col">
          {/* READING */}
          {step==='reading' && (
            <div className="flex flex-col flex-1 gap-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{content.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${DIFF[content.difficulty]}`}>{content.difficulty}</span>
                    <span className="text-[10px] text-brand-muted flex items-center gap-1"><Clock className="w-3 h-3"/>{content.readTime} min read</span>
                  </div>
                  <h1 className="text-xl font-bold text-white mt-1">{activeCourse?.title}</h1>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                {content.blocks.map((b,i) => (
                  <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-brand-accent text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-brand-accent/15 text-[10px] font-bold flex items-center justify-center">{i+1}</span>
                      {b.heading}
                    </h3>
                    <p className="text-brand-text text-sm leading-relaxed">{b.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-brand-border">
                {bestScores[activeId] && (
                  <span className="text-xs text-brand-muted">Best: {bestScores[activeId].score}/{bestScores[activeId].total}
                    {bestScores[activeId].passed && ' 🏆'}</span>
                )}
                <button onClick={() => setStep('quiz')}
                  className="ml-auto bg-brand-accent hover:bg-sky-300 text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer">
                  Take Quiz <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* QUIZ */}
          {step==='quiz' && (
            <div className="flex flex-col flex-1 gap-5">
              <div className="border-b border-brand-border pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-brand-gold"/>
                  <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Quiz · {activeCourse?.title}</span>
                </div>
                <p className="text-sm text-brand-muted">Answer all {quiz.length} questions, then submit.</p>
              </div>
              <div className="flex-1 space-y-7">
                {quiz.map((q, qi) => (
                  <div key={qi} className="space-y-3">
                    <h4 className="font-bold text-white text-sm leading-relaxed">{qi+1}. {q.question}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => {
                        const chosen = answers[qi] === oi;
                        return (
                          <button key={oi} onClick={() => setAnswers(prev => ({...prev,[qi]:oi}))}
                            className={`text-left p-3 rounded-xl border text-sm transition-all cursor-pointer ${chosen?'bg-brand-accent/10 border-brand-accent text-brand-accent font-medium':'bg-brand-surface border-brand-border text-brand-text hover:border-brand-muted hover:text-white'}`}>
                            <span className={`text-[10px] font-bold mr-2 ${chosen?'text-brand-accent':'text-brand-muted'}`}>{String.fromCharCode(65+oi)}.</span>
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
                <button onClick={submitQuiz} disabled={Object.keys(answers).length < quiz.length || saving}
                  className="bg-brand-bull hover:bg-emerald-400 disabled:opacity-40 text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-2">
                  {saving && <Loader className="w-3.5 h-3.5 animate-spin"/>}
                  Submit · {Object.keys(answers).length}/{quiz.length} answered
                </button>
              </div>
            </div>
          )}

          {/* RESULT */}
          {step==='result' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-5 py-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${score===quiz.length?'bg-brand-bull/10 ring-2 ring-brand-bull':score>=Math.ceil(quiz.length/2)?'bg-brand-gold/10 ring-2 ring-brand-gold':'bg-brand-bear/10 ring-2 ring-brand-bear'}`}>
                {score===quiz.length?'🏆':score>=Math.ceil(quiz.length/2)?'📚':'🔄'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Quiz Complete</h2>
                <p className="text-brand-muted mt-1 text-sm">{activeCourse?.title}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-black font-mono ${score===quiz.length?'text-brand-bull':score>=Math.ceil(quiz.length/2)?'text-brand-gold':'text-brand-bear'}`}>{score}</span>
                <span className="text-2xl text-brand-muted font-mono">/ {quiz.length}</span>
              </div>
              <p className={`text-sm font-semibold ${score===quiz.length?'text-brand-bull':score>=Math.ceil(quiz.length/2)?'text-brand-gold':'text-brand-bear'}`}>
                {score===quiz.length?'Perfect score! Module mastered. 🎉':score>=Math.ceil(quiz.length/2)?'Good effort — review the missed concepts.':'Review the reading material and try again.'}
              </p>
              {/* Answer review */}
              <div className="w-full space-y-2 text-left">
                {quiz.map((q,qi) => {
                  const correct = answers[qi]===q.answer;
                  return (
                    <div key={qi} className={`rounded-xl border p-3 text-xs ${correct?'border-brand-bull/30 bg-brand-bull/5':'border-brand-bear/30 bg-brand-bear/5'}`}>
                      <p className="font-semibold text-white mb-1">{qi+1}. {q.question}</p>
                      <p className={correct?'text-brand-bull':'text-brand-bear'}>
                        {correct ? '✓ Correct' : `✗ You chose: "${q.options[answers[qi]]}" — Correct: "${q.options[q.answer]}"`}
                      </p>
                      {!correct && q.explanation && <p className="text-brand-muted mt-1">{q.explanation}</p>}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setStep('reading'); setAnswers({}); setScore(0); }}
                  className="flex items-center gap-2 bg-brand-surface hover:bg-brand-border border border-brand-border text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5"/> Retry
                </button>
                {courses.findIndex(c=>c.course_id===activeId) < courses.length-1 && (
                  <button onClick={() => switchCourse(courses[courses.findIndex(c=>c.course_id===activeId)+1].course_id)}
                    className="flex items-center gap-2 bg-brand-accent hover:bg-sky-300 text-brand-dark px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                    Next Module <ArrowRight className="w-3.5 h-3.5"/>
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