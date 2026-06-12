import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Explain Candlestick Charts",
  "What is a Stop-Loss execution order?",
  "Analyze my asset risk approach"
];

export default function AiAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I am your TradeMentor AI Assistant. Ask me questions about active technical indicators, chart formations, or trading strategies." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (userText) => {
    if (!userText.trim()) return;

    const nextMessages = [...messages, { role: 'user', text: userText }];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    // Simulated streaming response generation matching LLM engine contexts
    setTimeout(() => {
      setIsTyping(false);
      setMessages([...nextMessages, {
        role: 'assistant',
        text: `Here is a breakdown analyzing "${userText}": In trading environments, understanding technical mechanics underpins proper management of financial capital. Always protect entry thresholds with structured stop thresholds.`
      }]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Toggle Trigger Button Button */}
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-brand-accent text-slate-900 p-4 rounded-full shadow-2xl hover:scale-105 hover:bg-sky-400 transition-all cursor-pointer z-40 flex items-center gap-2 font-bold text-sm">
        <MessageSquare className="w-5 h-5" />
        <span>Ask AI Assistant</span>
      </button>

      {/* Slide-out Backdrop Sheet Layer Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity z-40" onClick={() => setIsOpen(false)} />}

      {/* Main Container Core Slideout Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-107.5 bg-brand-card border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header Layout block */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-brand-dark/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-accent/10 text-brand-accent"><Sparkles className="w-4 h-4"/></div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">TradeMentor Coach AI</h3>
              <p className="text-xs text-brand-bull">Gemini Knowledge Core Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"><X className="w-5 h-5"/></button>
        </div>

        {/* Central Live Dialogue Messaging Stream Arena */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-accent text-slate-900 font-medium rounded-tr-none' : 'bg-brand-dark/80 text-slate-100 border border-slate-800 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-brand-dark/80 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Input Area + Suggested Prompt Matrix Pills */}
        <div className="p-4 border-t border-slate-800 bg-brand-dark/20 space-y-3">
          {messages.length === 1 && !isTyping && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 px-1">Suggested Starting Points</span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button key={i} onClick={() => handleSendMessage(prompt)} className="text-left text-xs bg-brand-dark hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex gap-2 items-center">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Query technical indicators or trading patterns..." className="flex-1 bg-brand-dark border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-accent font-sans" />
            <button type="submit" disabled={!input.trim()} className="p-2.5 bg-brand-accent disabled:opacity-40 disabled:hover:bg-brand-accent text-slate-900 rounded-xl hover:bg-sky-400 transition-colors cursor-pointer shrink-0">
              <Send className="w-4 h-4"/>
            </button>
          </form>
        </div>

      </div>
    </>
  );
}