import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle, HelpCircle, Award, ArrowRight, RotateCcw, Clock, Star, Loader } from 'lucide-react';
import { courseAPI } from '../services/api';

// Full course content is kept frontend-side (no DB round-trip for reading material)
const CONTENT = {
  1: {
    emoji:'📈', difficulty:'Beginner', readTime:4,
    blocks:[
      { heading:"What Is Trading?", text:"Trading is buying and selling financial instruments — stocks, currencies, commodities, or crypto — to profit from price changes. Unlike long-term investing, trading uses shorter timeframes: days, hours, or minutes." },
      { heading:"Bid vs Ask Price", text:"Every asset has two prices. The Bid is the highest price a buyer will pay. The Ask is the lowest price a seller will accept. The gap between them is the Spread — the broker's implicit fee." },
      { heading:"Order Types", text:"A Market Order executes immediately at current price. A Limit Order executes only at your specified price or better. A Stop Order triggers when price reaches a threshold." },
      { heading:"Market Participants", text:"Markets consist of retail traders (individuals), institutional traders (banks, hedge funds), and market makers who ensure liquidity. Understanding who you trade against helps decision-making." },
    ]
  },
  2: {
    emoji:'🕯️', difficulty:'Beginner', readTime:6,
    blocks:[
      { heading:"Anatomy of a Candle", text:"Each candlestick shows OHLC: Open, High, Low, Close. The body spans open to close. Wicks extend to the high and low. Green = closed higher (bullish). Red = closed lower (bearish)." },
      { heading:"Reversal Patterns", text:"Hammer: tiny body, long lower wick — buyers rejected lower prices, potential bullish reversal. Shooting Star: tiny body, long upper wick — signals bearish reversal after an uptrend." },
      { heading:"Doji Candles", text:"A Doji forms when open and close are nearly equal — a cross shape. It signals indecision. In context (after a strong trend), a Doji warns of potential reversal. Always wait for confirmation." },
      { heading:"Engulfing Patterns", text:"Bullish Engulfing: a small red candle followed by a larger green that engulfs the prior body — strong reversal signal. Bearish Engulfing is the opposite — large red candle engulfs a small green one." },
    ]
  },
  3: {
    emoji:'📊', difficulty:'Intermediate', readTime:8,
    blocks:[
      { heading:"Moving Averages (MA)", text:"A Moving Average smooths price noise by averaging past prices. The 50-day and 200-day MAs are widely watched. Golden Cross (50-day crosses above 200-day) = bullish. Death Cross = bearish." },
      { heading:"RSI — Relative Strength Index", text:"RSI measures momentum 0–100. Above 70 = overbought. Below 30 = oversold. RSI divergence: if price makes a new high but RSI doesn't, momentum is weakening and reversal may be near." },
      { heading:"MACD", text:"MACD plots the relationship between two EMAs (12 and 26 period). MACD line crossing above signal line = bullish. Works best in trending markets, poorly in sideways chop." },
      { heading:"Bollinger Bands", text:"Bollinger Bands: middle MA with upper/lower bands 2 standard deviations away. Price at upper band = overbought. Lower band = oversold. Band squeeze precedes a significant price move." },
    ]
  },
  4: {
    emoji:'🛡️', difficulty:'Intermediate', readTime:7,
    blocks:[
      { heading:"The 1% Rule", text:"Professional traders risk no more than 1–2% of total capital on any single trade. With $10,000, that's $100–$200 max per trade. This ensures no single loss is catastrophic." },
      { heading:"Stop-Loss Orders", text:"A stop-loss automatically closes your position if price moves against you by a preset amount. Always set it before entering a trade. Place it below a key support level for long trades." },
      { heading:"Risk-to-Reward Ratio", text:"Calculate risk (entry to stop) and potential reward (entry to target). A 1:2 ratio means risking $50 to make $100. Over time, even a 40% win rate is profitable with 1:2 R:R." },
      { heading:"Position Sizing Formula", text:"Position size = (Account risk $) ÷ (Trade risk per share). If you risk $100 and stop is $5 below entry, you buy 20 shares. Never let position size be random — always calculate it." },
    ]
  },
  5: {
    emoji:'🧠', difficulty:'Advanced', readTime:6,
    blocks:[
      { heading:"Fear and Greed", text:"The two dominant emotions in trading are fear and greed. Markets oscillate between these extremes. The best traders act against their instincts — buying when others fear, selling when others are greedy." },
      { heading:"FOMO — Fear of Missing Out", text:"FOMO causes traders to chase assets after they've already moved — buying the top of a rally. The antidote: pre-planned entry criteria. If you missed the setup, accept it and wait for the next one." },
      { heading:"Revenge Trading", text:"After a loss, the urge to trade immediately to 'make it back' leads to oversized positions and deeper losses. After any significant loss, step away and review what went wrong first." },
      { heading:"Building a Trading Plan", text:"Every trade should follow a written plan: entry criteria, position size, stop-loss, target, and exit rules. If a trade doesn't meet all criteria — don't take it. Discipline separates pros from gamblers." },
    ]
  },
};

const DIFF_COLORS = { Beginner:'text-brand-bull bg-brand-bull/10', Intermediate:'text-brand-gold bg-brand-gold/10', Advanced:'text-brand-accent2 bg-brand-accent2/10' };

export default function LearningModule() {
  const [courses, setCourses]         = useState([]);
  const [quizzes, setQuizzes]         = useState([]);
  const [progress, setProgress]       = useState({}); // { courseId: { score, total, passed } }
  const [activeId, setActiveId]       = useState(null);
  const [step, setStep]               = useState('reading'); // reading | quiz | result
  const [answers, setAnswers]         = useState({});
  const [score, setScore]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [apiError, setApiError]       = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([courseAPI.getAll(), courseAPI.myProgress()]);
      setCourses(cRes.data);
      if (cRes.data.length > 0) setActiveId(cRes.data[0].course_id);

      // Build progress map from quiz results
      const prog = {};
      pRes.data.forEach(r => {
        // We only store quiz_id, not course_id in results — map via quiz list later
        if (!prog[r.quiz_id] || r.score > prog[r.quiz_id].score) {
          prog[r.quiz_id] = { score: r.score, resultId: r.result_id };
        }
      });
      setProgress(prog);
      setApiError(false);
    } catch {
      setApiError(true);
      // Fallback: use hardcoded course list
      const fallback = [1,2,3,4,5].map(id => ({
        course_id: id,
        title: ['Introduction to Trading','Candlestick Patterns','Technical Indicators','Risk Management','Trading Psychology'][id-1],
        description: ''
      }));
      setCourses(fallback);
      setActiveId(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const loadQuiz = async (courseId) => {
    setQuizLoading(true);
    try {
      const res = await courseAPI.getQuizzes(courseId);
      setQuizzes(res.data);
    } catch {
      // Fallback quiz questions if backend offline
      setQuizzes([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const switchCourse = (id) => { setActiveId(id); setStep('reading'); setAnswers({}); setScore(0); setQuizzes([]); };

  const goToQuiz = async () => { await loadQuiz(activeId); setStep('quiz'); };

  const submitQuiz = async () => {
    let s = 0;
    quizzes.forEach((q, i) => { if (String(answers[i]) === String(q.answer)) s++; });
    setScore(s);
    // Save to backend
    if (quizzes.length > 0 && !apiError) {
      try {
        await Promise.all(quizzes.map(q => courseAPI.submitResult(q.quiz_id, s)));
      } catch {}
    }
    setStep('result');
  };

  const reset = () => { setStep('reading'); setAnswers({}); setScore(0); setQuizzes([]); };

  const activeCourse = courses.find(c => c.course_id === activeId);
  const content = CONTENT[activeId] || { emoji:'📚', difficulty:'Beginner', readTime:5, blocks:[] };

  const passedCount = courses.filter(c => {
    const q = quizzes; // simplified — progress tracking is per quiz_id
    return false; // full pass tracking would require quiz_id→course_id mapping
  }).length;

  if (loading) return <div className="flex items-center justify-center h-64 text-brand-muted"><Loader className="w-6 h-6 animate-spin mr-2" /> Loading modules…</div>;

  return (
    <div className="space-y-6">
      {apiError && (
        <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-4 py-3 text-sm text-brand-gold">
          ⚠️ Backend offline — reading material works, but quiz saving requires FastAPI. Run <code>python seed.py</code> first to populate quizzes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold px-1 mb-3">Modules</p>
          {courses.map(c => {
            const ct = CONTENT[c.course_id];
            const isActive = c.course_id === activeId;
            return (
              <button key={c.course_id} onClick={() => switchCourse(c.course_id)}
                className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 ${isActive?'bg-brand-accent/10 border-brand-accent':'bg-brand-card border-brand-border hover:border-brand-muted hover:bg-brand-surface'}`}>
                <span className="text-lg leading-none mt-0.5">{ct?.emoji || '📚'}</span>
                <div className="min-w-0">
                  <p className={`font-bold truncate leading-tight ${isActive?'text-brand-accent':'text-white'}`}>{c.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DIFF_COLORS[ct?.difficulty]||''}`}>{ct?.difficulty}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded-2xl p-6 min-h-125 flex flex-col">
          {!activeCourse && <div className="text-brand-muted text-center py-12">Select a module to start learning.</div>}

          {activeCourse && step === 'reading' && (
            <div className="flex flex-col flex-1 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{content.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${DIFF_COLORS[content.difficulty]}`}>{content.difficulty}</span>
                      <span className="text-[10px] text-brand-muted flex items-center gap-1"><Clock className="w-3 h-3" />{content.readTime} min read</span>
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">{activeCourse.title}</h1>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {content.blocks.map((b, i) => (
                  <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-brand-accent text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-brand-accent/15 text-[10px] font-bold flex items-center justify-center text-brand-accent">{i+1}</span>
                      {b.heading}
                    </h3>
                    <p className="text-brand-text text-sm leading-relaxed">{b.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-brand-border">
                <button onClick={goToQuiz} className="bg-brand-accent hover:bg-sky-300 text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer">
                  Take Quiz <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeCourse && step === 'quiz' && (
            <div className="flex flex-col flex-1 gap-6">
              <div className="border-b border-brand-border pb-4">
                <div className="flex items-center gap-2 mb-1"><HelpCircle className="w-4 h-4 text-brand-gold" /><span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Quiz · {activeCourse.title}</span></div>
                {quizLoading ? (
                  <div className="flex items-center gap-2 text-brand-muted text-sm"><Loader className="w-4 h-4 animate-spin" /> Loading questions…</div>
                ) : quizzes.length === 0 ? (
                  <p className="text-sm text-brand-muted">No quiz questions found. Make sure the backend is running and seeded (<code className="text-brand-accent">python seed.py</code>).</p>
                ) : (
                  <p className="text-sm text-brand-muted">Answer all {quizzes.length} questions then submit.</p>
                )}
              </div>

              {!quizLoading && quizzes.length > 0 && (
                <>
                  <div className="space-y-6 flex-1">
                    {quizzes.map((q, qi) => (
                      <div key={q.quiz_id} className="space-y-3">
                        <h4 className="font-bold text-white text-sm">{qi+1}. {q.question}</h4>
                        <p className="text-xs text-brand-muted">(Select the option that corresponds to the correct answer index: {q.answer})</p>
                        <div className="flex flex-col gap-2">
                          {['Option A','Option B','Option C','Option D'].slice(0, 3).map((opt, oi) => {
                            const chosen = answers[qi] === oi;
                            return (
                              <button key={oi} onClick={() => setAnswers(prev => ({...prev,[qi]:oi}))}
                                className={`text-left p-3 rounded-xl border text-sm transition-all cursor-pointer ${chosen?'bg-brand-accent/10 border-brand-accent text-brand-accent font-medium':'bg-brand-surface border-brand-border text-brand-text hover:border-brand-muted hover:text-white'}`}>
                                <span className={`text-[10px] font-bold mr-2 ${chosen?'text-brand-accent':'text-brand-muted'}`}>{String.fromCharCode(65+oi)}.</span>
                                Answer option {oi+1} for: {q.question.substring(0,30)}…
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-brand-border">
                    <button onClick={() => setStep('reading')} className="text-sm text-brand-muted hover:text-white underline transition-colors">← Back to reading</button>
                    <button onClick={submitQuiz} disabled={Object.keys(answers).length < quizzes.length}
                      className="bg-brand-bull hover:bg-emerald-400 disabled:opacity-40 text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:cursor-not-allowed">
                      Submit {Object.keys(answers).length}/{quizzes.length} answered
                    </button>
                  </div>
                </>
              )}

              {!quizLoading && quizzes.length === 0 && (
                <div className="flex justify-start pt-4 border-t border-brand-border">
                  <button onClick={() => setStep('reading')} className="text-sm text-brand-muted hover:text-white underline transition-colors">← Back to reading</button>
                </div>
              )}
            </div>
          )}

          {activeCourse && step === 'result' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6 py-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${score===quizzes.length?'bg-brand-bull/10 ring-2 ring-brand-bull':score>=Math.ceil(quizzes.length/2)?'bg-brand-gold/10 ring-2 ring-brand-gold':'bg-brand-bear/10 ring-2 ring-brand-bear'}`}>
                {score===quizzes.length?'🏆':score>=Math.ceil(quizzes.length/2)?'📚':'🔄'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Quiz Complete</h2>
                <p className="text-brand-muted mt-1 text-sm">{activeCourse.title}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-black font-mono ${score===quizzes.length?'text-brand-bull':score>=Math.ceil(quizzes.length/2)?'text-brand-gold':'text-brand-bear'}`}>{score}</span>
                <span className="text-2xl text-brand-muted font-mono">/ {quizzes.length}</span>
              </div>
              {score===quizzes.length && <p className="text-brand-bull font-semibold">Perfect score! Module mastered. 🎉</p>}
              {score>=Math.ceil(quizzes.length/2)&&score<quizzes.length && <p className="text-brand-gold">Good effort — review the missed concepts.</p>}
              {score<Math.ceil(quizzes.length/2) && <p className="text-brand-bear">Review the reading material and try again.</p>}
              <div className="flex gap-3">
                <button onClick={reset} className="flex items-center gap-2 bg-brand-surface hover:bg-brand-border border border-brand-border text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
                {courses.findIndex(c=>c.course_id===activeId) < courses.length-1 && (
                  <button onClick={() => switchCourse(courses[courses.findIndex(c=>c.course_id===activeId)+1].course_id)}
                    className="flex items-center gap-2 bg-brand-accent hover:bg-sky-300 text-brand-dark px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer">
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