import React, { useState, useEffect } from 'react';
import { Notebook, Calendar, Tag, FileText, AlertTriangle, Plus, Trash2, TrendingUp, TrendingDown, Filter } from 'lucide-react';

const MISTAKE_TAGS = [
  { value: 'NONE', label: 'No Mistake', color: 'text-brand-bull bg-brand-bull/10 border-brand-bull/20' },
  { value: 'FOMO', label: 'FOMO Entry', color: 'text-brand-bear bg-brand-bear/10 border-brand-bear/20' },
  { value: 'STOP_CHASE', label: 'Moved Stop Loss', color: 'text-brand-bear bg-brand-bear/10 border-brand-bear/20' },
  { value: 'OVER_LEVER', label: 'Over-Leveraged', color: 'text-brand-gold bg-brand-gold/10 border-brand-gold/20' },
  { value: 'EARLY_EXIT', label: 'Exited Too Early', color: 'text-brand-gold bg-brand-gold/10 border-brand-gold/20' },
  { value: 'NO_PLAN', label: 'No Trade Plan', color: 'text-brand-accent2 bg-brand-accent2/10 border-brand-accent2/20' },
  { value: 'REVENGE', label: 'Revenge Trade', color: 'text-brand-bear bg-brand-bear/10 border-brand-bear/20' },
  { value: 'NEWS_TRADE', label: 'Impulsive News Trade', color: 'text-brand-gold bg-brand-gold/10 border-brand-gold/20' },
];

const OUTCOMES = [
  { value: 'WIN', label: 'Win', icon: '✅' },
  { value: 'LOSS', label: 'Loss', icon: '❌' },
  { value: 'BREAKEVEN', label: 'Breakeven', icon: '➖' },
];

const EMOTIONS = ['Confident', 'Anxious', 'Greedy', 'Fearful', 'Neutral', 'Excited', 'Frustrated'];

export default function TradingJournal() {
  const [journals, setJournals] = useState(() => {
    const stored = localStorage.getItem('tm_journal');
    return stored ? JSON.parse(stored) : [
      {
        id: 1717027200000,
        date: '2026-06-10',
        symbol: 'TSLA',
        outcome: 'LOSS',
        mistake: 'FOMO',
        emotion: 'Anxious',
        entry: '248.50',
        exit: '241.20',
        notes: 'Chased the breakout candle without waiting for confirmation. Price immediately reversed after my entry, hitting my stop. Need to wait for the candle to close before entering.',
      }
    ];
  });

  const [form, setForm] = useState({ symbol: '', outcome: 'WIN', mistake: 'NONE', emotion: 'Neutral', entry: '', exit: '', notes: '' });
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const save = (journals) => {
    setJournals(journals);
    localStorage.setItem('tm_journal', JSON.stringify(journals));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.symbol.trim() || !form.notes.trim()) return;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...form,
      symbol: form.symbol.toUpperCase().trim(),
    };
    save([entry, ...journals]);
    setForm({ symbol: '', outcome: 'WIN', mistake: 'NONE', emotion: 'Neutral', entry: '', exit: '', notes: '' });
  };

  const deleteEntry = (id) => {
    if (!confirm('Delete this journal entry?')) return;
    save(journals.filter(j => j.id !== id));
  };

  const filtered = journals.filter(j => filter === 'ALL' || j.outcome === filter)
    .sort((a, b) => sortBy === 'newest' ? b.id - a.id : a.id - b.id);

  const wins = journals.filter(j => j.outcome === 'WIN').length;
  const losses = journals.filter(j => j.outcome === 'LOSS').length;
  const winRate = journals.length > 0 ? Math.round((wins / journals.length) * 100) : 0;

  const mistakeFreq = {};
  journals.forEach(j => { if (j.mistake !== 'NONE') mistakeFreq[j.mistake] = (mistakeFreq[j.mistake] || 0) + 1; });
  const topMistake = Object.entries(mistakeFreq).sort((a, b) => b[1] - a[1])[0];

  const getMistakeTag = (val) => MISTAKE_TAGS.find(t => t.value === val) || MISTAKE_TAGS[0];

  const pnl = journals.reduce((sum, j) => {
    if (j.entry && j.exit) {
      return sum + (parseFloat(j.exit) - parseFloat(j.entry));
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: journals.length, color: 'text-white' },
          { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'text-brand-bull' : 'text-brand-bear' },
          { label: 'Wins / Losses', value: `${wins} / ${losses}`, color: 'text-white' },
          { label: 'Top Mistake', value: topMistake ? getMistakeTag(topMistake[0]).label : 'None yet', color: 'text-brand-gold', small: true },
        ].map(({ label, value, color, small }) => (
          <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-4">
            <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">{label}</p>
            <p className={`font-bold font-mono mt-1 ${color} ${small ? 'text-sm' : 'text-2xl'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-2xl p-5 h-fit">
          <h3 className="font-bold text-white flex items-center gap-2 mb-5 pb-3 border-b border-brand-border">
            <Plus className="w-4 h-4 text-brand-accent" /> Log a Trade
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Symbol + Outcome */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Symbol</label>
                <input type="text" placeholder="AAPL" required value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted font-mono uppercase focus:outline-none focus:border-brand-accent text-sm" />
              </div>
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Outcome</label>
                <div className="flex gap-1">
                  {OUTCOMES.map(o => (
                    <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, outcome: o.value }))}
                      className={`flex-1 text-center py-2 rounded-xl text-xs font-bold border transition-all ${form.outcome === o.value ? (o.value === 'WIN' ? 'bg-brand-bull text-brand-dark border-brand-bull' : o.value === 'LOSS' ? 'bg-brand-bear text-white border-brand-bear' : 'bg-brand-muted text-white border-brand-muted') : 'bg-brand-surface border-brand-border text-brand-muted hover:text-white'}`}>
                      {o.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Entry / Exit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Entry $</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.entry} onChange={e => setForm(f => ({ ...f, entry: e.target.value }))}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted font-mono focus:outline-none focus:border-brand-accent text-sm" />
              </div>
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Exit $</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.exit} onChange={e => setForm(f => ({ ...f, exit: e.target.value }))}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted font-mono focus:outline-none focus:border-brand-accent text-sm" />
              </div>
            </div>

            {/* Emotion */}
            <div>
              <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Emotional State</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOTIONS.map(e => (
                  <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emotion: e }))}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${form.emotion === e ? 'bg-brand-accent2/15 border-brand-accent2 text-brand-accent2' : 'bg-brand-surface border-brand-border text-brand-muted hover:text-white'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Mistake tag */}
            <div>
              <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Mistake Tag</label>
              <select value={form.mistake} onChange={e => setForm(f => ({ ...f, mistake: e.target.value }))}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-accent text-sm">
                {MISTAKE_TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Observations & Notes</label>
              <textarea rows="4" placeholder="What was your setup? What did you learn? How will you improve?" required value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted focus:outline-none focus:border-brand-accent text-sm leading-relaxed resize-none" />
            </div>

            <button type="submit" className="w-full bg-brand-accent hover:bg-sky-300 text-brand-dark font-bold py-2.5 rounded-xl text-sm tracking-wide transition-colors cursor-pointer">
              Save Entry
            </button>
          </form>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Notebook className="w-4 h-4 text-brand-accent" /> Trade Log
            </h3>
            <div className="flex gap-2">
              <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-brand-surface border border-brand-border text-brand-text rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-accent">
                <option value="ALL">All</option>
                <option value="WIN">Wins</option>
                <option value="LOSS">Losses</option>
                <option value="BREAKEVEN">Breakeven</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-brand-surface border border-brand-border text-brand-text rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-accent">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-10 text-center">
              <Notebook className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-30" />
              <p className="text-brand-muted text-sm">No journal entries yet. Log your first trade!</p>
            </div>
          )}

          {filtered.map(log => {
            const mistakeTag = getMistakeTag(log.mistake);
            const pnl = log.entry && log.exit ? parseFloat(log.exit) - parseFloat(log.entry) : null;
            const outcomeColors = { WIN: 'border-brand-bull/40 bg-brand-bull/5', LOSS: 'border-brand-bear/40 bg-brand-bear/5', BREAKEVEN: 'border-brand-muted/40' };

            return (
              <div key={log.id} className={`bg-brand-card border rounded-2xl p-5 space-y-3.5 fade-in ${outcomeColors[log.outcome]}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-brand-accent text-base bg-brand-surface border border-brand-border px-3 py-1 rounded-xl">{log.symbol}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${log.outcome === 'WIN' ? 'text-brand-bull bg-brand-bull/10 border-brand-bull/20' : log.outcome === 'LOSS' ? 'text-brand-bear bg-brand-bear/10 border-brand-bear/20' : 'text-brand-muted bg-brand-surface border-brand-border'}`}>
                        {OUTCOMES.find(o => o.value === log.outcome)?.icon} {log.outcome}
                      </span>
                      {log.mistake !== 'NONE' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${mistakeTag.color}`}>
                          <AlertTriangle className="w-2.5 h-2.5" /> {mistakeTag.label}
                        </span>
                      )}
                      {log.emotion && (
                        <span className="text-[10px] text-brand-accent2 bg-brand-accent2/10 border border-brand-accent2/20 px-2 py-0.5 rounded-lg font-semibold">{log.emotion}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pnl !== null && (
                      <span className={`font-mono font-bold text-sm ${pnl >= 0 ? 'text-brand-bull' : 'text-brand-bear'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs text-brand-muted flex items-center gap-1"><Calendar className="w-3 h-3" />{log.date}</span>
                    <button onClick={() => deleteEntry(log.id)} className="text-brand-muted hover:text-brand-bear transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {(log.entry || log.exit) && (
                  <div className="flex gap-4 text-xs font-mono">
                    {log.entry && <span className="text-brand-muted">Entry: <span className="text-white">${parseFloat(log.entry).toFixed(2)}</span></span>}
                    {log.exit && <span className="text-brand-muted">Exit: <span className="text-white">${parseFloat(log.exit).toFixed(2)}</span></span>}
                  </div>
                )}

                <p className="text-brand-text text-sm leading-relaxed flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-brand-muted shrink-0 mt-0.5" />
                  <span>{log.notes}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}