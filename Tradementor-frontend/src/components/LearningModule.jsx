import React, { useState } from 'react';
import { BookOpen, CheckCircle, HelpCircle, Award, ArrowRight, RotateCcw } from 'lucide-react';

const COURSE_DATA = [
  {
    id: 'intro',
    title: 'Introduction to Trading Mechanics',
    description: 'Master order books, stock bid/ask spreads, and foundational financial vocabulary.',
    content: [
      "Trading is the act of buying and selling financial instruments to capture structural price changes. Unlike long-term investing, trading focuses on short-term market momentum.",
      "The Bid Price represents the highest price a buyer is willing to pay for an asset. The Ask Price represents the lowest price a seller is willing to accept.",
      "The Difference between these two prices is known as the Spread. Highly liquid assets (like AAPL) feature tight spreads, reducing structural transaction friction."
    ],
    quiz: [
      {
        question: "What does the market 'Ask Price' represent?",
        options: [
          "The highest price an active buyer is offering",
          "The lowest price an active seller is willing to accept",
          "The absolute historical average price of the asset",
          "The commission fee charged by execution brokers"
        ],
        correctIndex: 1
      },
      {
        question: "Which characteristic is typically true of highly liquid assets?",
        options: [
          "They feature wide, volatile bid-ask spreads",
          "They are extremely difficult to sell quickly",
          "They feature narrow, tight bid-ask spreads",
          "They are not tracked by regulatory frameworks"
        ],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'risk',
    title: 'Risk Management Protocols',
    description: 'Learn how to implement stop-losses and calculate risk-to-reward ratios.',
    content: [
      "Risk Management is the most vital pillar of capital preservation. Without strict rules, sequence-of-returns risk can destroy a trading portfolio.",
      "A Stop-Loss order is an automated instruction sent to a broker to liquidate a position once it breaches a specific price boundary, strictly capping downside risk.",
      "Professional traders aim for a minimum Risk-to-Reward ratio of 1:2, meaning they risk $100 to target a structural profit target of $200."
    ],
    quiz: [
      {
        question: "What is the primary function of a Stop-Loss execution order?",
        options: [
          "To secure automated profit points at market peaks",
          "To freeze accounts during severe regulatory events",
          "To automatically limit potential downside capital losses",
          "To compound margin leverage parameters"
        ],
        correctIndex: 2
      }
    ]
  }
];

export default function LearningModule() {
  const [activeCourseIdx, setActiveCourseIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState('reading'); // 'reading' | 'quiz' | 'result'
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);
  const [completedCourses, setCompletedCourses] = useState([]);

  const currentCourse = COURSE_DATA[activeCourseIdx];

  const handleOptionSelect = (qIdx, optIdx) => {
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    currentCourse.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) score++;
    });
    setQuizScore(score);
    setCurrentStep('result');
    
    if (score === currentCourse.quiz.length) {
      if (!completedCourses.includes(currentCourse.id)) {
        setCompletedCourses([...completedCourses, currentCourse.id]);
      }
    }
  };

  const handleResetModule = () => {
    setSelectedAnswers({});
    setQuizScore(0);
    setCurrentStep('reading');
  };

  const handleNextModule = () => {
    if (activeCourseIdx < COURSE_DATA.length - 1) {
      setActiveCourseIdx(prev => prev + 1);
      handleResetModule();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Course Catalog Selector */}
      <div className="lg:col-span-1 bg-brand-card p-4 rounded-xl border border-slate-800 h-fit space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Course Modules</h3>
        <div className="space-y-1">
          {COURSE_DATA.map((course, idx) => {
            const isSelected = idx === activeCourseIdx;
            const isPassed = completedCourses.includes(course.id);
            return (
              <button key={course.id} onClick={() => { setActiveCourseIdx(idx); handleResetModule(); }} className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-2 border ${isSelected ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'bg-brand-dark/30 border-transparent text-slate-300 hover:bg-slate-800'}`}>
                {isPassed ? <CheckCircle className="w-4 h-4 text-brand-bull shrink-0 mt-0.5" /> : <BookOpen className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
                <div>
                  <span className="font-bold block leading-tight">{course.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Educational Module Workspace */}
      <div className="lg:col-span-3 bg-brand-card p-6 rounded-xl border border-slate-800 min-h-112.5 flex flex-col justify-between">
        
        {/* READING LAYOUT WORKSPACE */}
        {currentStep === 'reading' && (
          <div className="space-y-6 flex-1">
            <div>
              <span className="text-xs font-bold text-brand-accent tracking-widest uppercase">Module Context</span>
              <h1 className="text-2xl font-bold text-slate-100">{currentCourse.title}</h1>
              <p className="text-sm text-slate-400 mt-1">{currentCourse.description}</p>
            </div>
            
            <div className="space-y-4 border-l-2 border-slate-800 pl-4">
              {currentCourse.content.map((paragraph, idx) => (
                <p key={idx} className="text-slate-300 text-sm leading-relaxed">{paragraph}</p>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button onClick={() => setCurrentStep('quiz')} className="bg-brand-accent hover:bg-sky-400 text-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer">
                Enter Competency Quiz <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE ASSESSMENT QUIZ LAYER */}
        {currentStep === 'quiz' && (
          <div className="space-y-6 flex-1">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-brand-bear tracking-widest uppercase flex items-center gap-1"><HelpCircle className="w-3 h-3"/> Active Assessment</span>
              <h2 className="text-xl font-bold">{currentCourse.title} Quiz</h2>
            </div>

            <div className="space-y-6">
              {currentCourse.quiz.map((q, qIdx) => (
                <div key={qIdx} className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-200">{qIdx + 1}. {q.question}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedAnswers[qIdx] === optIdx;
                      return (
                        <button key={optIdx} onClick={() => handleOptionSelect(qIdx, optIdx)} className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${isChosen ? 'bg-brand-accent/10 border-brand-accent text-brand-accent font-medium' : 'bg-brand-dark/50 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
              <button onClick={() => setCurrentStep('reading')} className="text-xs text-slate-400 hover:text-slate-200 underline font-medium">Back to Reading</button>
              <button onClick={handleSubmitQuiz} disabled={Object.keys(selectedAnswers).length < currentCourse.quiz.length} className="bg-brand-bull hover:bg-emerald-400 disabled:opacity-40 text-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer">
                Submit Assessment
              </button>
            </div>
          </div>
        )}

        {/* ASSESSMENT RESULT REVIEW LAYER */}
        {currentStep === 'result' && (
          <div className="space-y-6 text-center py-8 flex flex-col items-center justify-center my-auto">
            <div className={`p-4 rounded-full ${quizScore === currentCourse.quiz.length ? 'bg-brand-bull/10 text-brand-bull animate-pulse' : 'bg-brand-bear/10 text-brand-bear'}`}>
              <Award className="w-12 h-12" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Module Evaluation Complete</h2>
              <p className="text-sm text-slate-400 font-mono">
                Scored: <span className="font-bold text-white text-lg">{quizScore}</span> / {currentCourse.quiz.length} Correct
              </p>
            </div>

            {quizScore === currentCourse.quiz.length ? (
              <p className="text-sm text-brand-bull max-w-sm">Flawless score! You have successfully mastered the principles of this conceptual training track.</p>
            ) : (
              <p className="text-sm text-brand-bear max-w-sm">Some responses missed the threshold. Review the material to fix your mechanical understanding.</p>
            )}

            <div className="flex gap-4 pt-4">
              <button onClick={handleResetModule} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5"/> Retry Module
              </button>
              {activeCourseIdx < COURSE_DATA.length - 1 && quizScore === currentCourse.quiz.length && (
                <button onClick={handleNextModule} className="bg-brand-accent hover:bg-sky-400 text-slate-900 text-xs px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                  Advance Course <ArrowRight className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}