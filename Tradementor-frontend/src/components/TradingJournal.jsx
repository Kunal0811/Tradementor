import React, { useState, useEffect, useCallback } from 'react';
import { Notebook, Calendar, FileText, AlertTriangle, Plus, Trash2, Loader, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { journalAPI, aiAPI } from '../services/api';

const MISTAKE_TAGS = [
  { value:'NONE',       label:'No Mistake',           color:'text-brand-bull bg-brand-bull/10 border-brand-bull/20' },
  { value:'FOMO',       label:'FOMO Entry',           color:'text-brand-bear bg-brand-bear/10 border-brand-bear/20' },
  { value:'STOP_CHASE', label:'Moved Stop Loss',      color:'text-brand-bear bg-brand-bear/10 border-brand-bear/20' },
  { value:'OVER_LEVER', label:'Over-Leveraged',       color:'text-brand-gold bg-brand-gold/10 border-brand-gold/20' },
  { value:'EARLY_EXIT', label:'Exited Too Early',     color:'text-brand-gold bg-brand-gold/10 border-brand-gold/20' },
  { value:'NO_PLAN',    label:'No Trade Plan',        color:'text-brand-accent2 bg-brand-accent2/10 border-brand-accent2/20' },
  { value:'REVENGE',    label:'Revenge Trade',        color:'text-brand-bear bg-brand-bear/10 border-brand-bear/20' },
  { value:'NEWS_TRADE', label:'Impulsive News Trade', color:'text-brand-gold bg-brand-gold/10 border-brand-gold/20' },
];
const OUTCOMES = [
  { value:'WIN',       label:'Win',       icon:'✅' },
  { value:'LOSS',      label:'Loss',      icon:'❌' },
  { value:'BREAKEVEN', label:'Breakeven', icon:'➖' },
];
const EMOTIONS = ['Confident','Anxious','Greedy','Fearful','Neutral','Excited','Frustrated'];
const getTag = v => MISTAKE_TAGS.find(t => t.value===v) || MISTAKE_TAGS[0];

const BLANK = {
  symbol:'', outcome:'WIN', mistake_tag:'NONE', emotion:'Neutral',
  entry_price:'', exit_price:'', entry_reason:'', followed_plan:true, notes:''
};

export default function TradingJournal() {
  const [entries, setEntries]         = useState([]);
  const [form, setForm]               = useState(BLANK);
  const [filter, setFilter]           = useState('ALL');
  const [sort, setSort]               = useState('newest');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [stats, setStats]             = useState({ total_entries:0, wins:0, losses:0, win_rate:0, mistake_frequency:{}, emotion_frequency:{} });
  const [apiError, setApiError]       = useState(false);
  const [psychModal, setPsychModal]   = useState(null);  // { entryId, loading, result }
  const [expandedId, setExpandedId]   = useState(null);
  const [showPsychFields, setShowPsychFields] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [eRes, sRes] = await Promise.all([journalAPI.getAll(), journalAPI.stats()]);
      setEntries(eRes.data); setStats(sRes.data); setApiError(false);
    } catch { setApiError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.notes.trim()) return;
    setSaving(true);
    try {
      await journalAPI.create({
        stock_symbol:  form.symbol.toUpperCase().trim() || null,
        outcome:       form.outcome,
        mistake_tag:   form.mistake_tag,
        emotion:       form.emotion,
        entry_price:   form.entry_price ? parseFloat(form.entry_price) : null,
        exit_price:    form.exit_price  ? parseFloat(form.exit_price)  : null,
        entry_reason:  form.entry_reason || null,
        followed_plan: form.followed_plan,
        notes:         form.notes,
      });
      await loadAll(); setForm(BLANK);
    } catch { alert('Could not save — is the backend running?'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try { await journalAPI.delete(id); await loadAll(); } catch { alert('Delete failed.'); }
  };

  const analyzePsychology = async (entry) => {
    setPsychModal({ entryId: entry.journal_id, loading: true, result: null });
    try {
      const res = await aiAPI.psychology({
        entry_reason:  entry.entry_reason || entry.notes.slice(0,100),
        followed_plan: entry.followed_plan,
        outcome:       entry.outcome,
        emotion:       entry.emotion || 'Neutral',
        notes:         entry.notes,
      });
      setPsychModal({ entryId: entry.journal_id, loading: false, result: res.data.reply });
    } catch {
      setPsychModal({ entryId: entry.journal_id, loading: false, result: 'AI analysis unavailable — check backend + GEMINI_API_KEY.' });
    }
  };

  const filtered = entries
    .filter(e => filter==='ALL' || e.outcome===filter)
    .sort((a,b) => sort==='newest' ? new Date(b.created_at)-new Date(a.created_at) : new Date(a.created_at)-new Date(b.created_at));

  const topEmotion = Object.entries(stats.emotion_frequency||{}).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const topMistake = Object.entries(stats.mistake_frequency||{}).sort((a,b)=>b[1]-a[1])[0];

  return (
    <div className="space-y-6">
      {apiError && (
        <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-4 py-2.5 text-xs text-brand-gold">
          ⚠️ Backend offline — journal requires FastAPI at <code>localhost:8000</code>.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Entries', value:stats.total_entries, color:'text-white' },
          { label:'Win Rate', value:`${stats.win_rate}%`, color:stats.win_rate>=50?'text-brand-bull':'text-brand-bear' },
          { label:'Wins / Losses', value:`${stats.wins} / ${stats.losses}`, color:'text-white' },
          { label:'Top Mistake', value:topMistake ? getTag(topMistake[0]).label : 'None yet', color:'text-brand-gold', small:true },
        ].map(({label,value,color,small}) => (
          <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-4">
            <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">{label}</p>
            <p className={`font-bold font-mono mt-1 ${color} ${small?'text-sm':'text-2xl'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Emotion insight */}
      {topEmotion && (
        <div className="bg-brand-accent2/5 border border-brand-accent2/20 rounded-xl px-4 py-3 text-xs text-brand-accent2 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 shrink-0"/>
          <span>Your most frequent trading emotion is <strong>{topEmotion}</strong>.
            {topEmotion==='Greedy'&&' Greed often leads to holding winners too long or oversizing. Set fixed targets.'}
            {topEmotion==='Anxious'&&' Anxiety causes early exits. Trust your stop-loss and plan.'}
            {topEmotion==='Fearful'&&' Fear prevents taking valid setups. Focus on risk-first thinking.'}
            {topEmotion==='Excited'&&' Excitement leads to impulsive entries. Slow down and wait for confirmation.'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-2xl p-5 h-fit">
          <h3 className="font-bold text-white flex items-center gap-2 mb-5 pb-3 border-b border-brand-border">
            <Plus className="w-4 h-4 text-brand-accent"/> Log a Trade
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Symbol</label>
                <input type="text" placeholder="AAPL" value={form.symbol} onChange={e=>setForm(f=>({...f,symbol:e.target.value}))}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted font-mono uppercase focus:outline-none focus:border-brand-accent text-sm"/>
              </div>
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Outcome</label>
                <div className="flex gap-1">
                  {OUTCOMES.map(o => (
                    <button key={o.value} type="button" onClick={()=>setForm(f=>({...f,outcome:o.value}))}
                      className={`flex-1 text-center py-2 rounded-xl text-xs font-bold border transition-all ${form.outcome===o.value?(o.value==='WIN'?'bg-brand-bull text-brand-dark border-brand-bull':o.value==='LOSS'?'bg-brand-bear text-white border-brand-bear':'bg-brand-muted text-white border-brand-muted'):'bg-brand-surface border-brand-border text-brand-muted hover:text-white'}`}>
                      {o.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Entry $</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.entry_price} onChange={e=>setForm(f=>({...f,entry_price:e.target.value}))}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted font-mono focus:outline-none focus:border-brand-accent text-sm"/>
              </div>
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Exit $</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.exit_price} onChange={e=>setForm(f=>({...f,exit_price:e.target.value}))}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted font-mono focus:outline-none focus:border-brand-accent text-sm"/>
              </div>
            </div>

            <div>
              <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Emotional State</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOTIONS.map(em => (
                  <button key={em} type="button" onClick={()=>setForm(f=>({...f,emotion:em}))}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${form.emotion===em?'bg-brand-accent2/15 border-brand-accent2 text-brand-accent2':'bg-brand-surface border-brand-border text-brand-muted hover:text-white'}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Mistake Tag</label>
              <select value={form.mistake_tag} onChange={e=>setForm(f=>({...f,mistake_tag:e.target.value}))}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-accent text-sm">
                {MISTAKE_TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Psychology Analyzer fields — collapsible */}
            <div>
              <button type="button" onClick={()=>setShowPsychFields(p=>!p)}
                className="flex items-center gap-1.5 text-xs text-brand-accent2 hover:text-white transition-colors">
                <Brain className="w-3 h-3"/>
                Psychology Analyzer {showPsychFields ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
              </button>
              {showPsychFields && (
                <div className="mt-3 space-y-3 p-3 bg-brand-surface border border-brand-border rounded-xl">
                  <div>
                    <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1">Why did you enter?</label>
                    <input type="text" placeholder="Breakout above resistance, MACD crossover…" value={form.entry_reason} onChange={e=>setForm(f=>({...f,entry_reason:e.target.value}))}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white placeholder-brand-muted focus:outline-none focus:border-brand-accent text-xs"/>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-brand-muted">Followed your plan?</label>
                    <div className="flex gap-2">
                      {[['Yes',true],['No',false]].map(([l,v]) => (
                        <button key={l} type="button" onClick={()=>setForm(f=>({...f,followed_plan:v}))}
                          className={`text-xs px-3 py-1 rounded-lg border transition-colors ${form.followed_plan===v?'bg-brand-accent/20 border-brand-accent text-brand-accent':'bg-brand-dark border-brand-border text-brand-muted'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-brand-muted uppercase tracking-wider block mb-1.5">Observations & Notes *</label>
              <textarea rows="4" required placeholder="What was your setup? What did you learn? What will you do differently?" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-white placeholder-brand-muted focus:outline-none focus:border-brand-accent text-sm leading-relaxed resize-none"/>
            </div>

            <button type="submit" disabled={saving||apiError}
              className="w-full bg-brand-accent hover:bg-sky-300 disabled:opacity-50 text-brand-dark font-bold py-2.5 rounded-xl text-sm tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2">
              {saving && <Loader className="w-3.5 h-3.5 animate-spin"/>}
              Save Entry
            </button>
          </form>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2"><Notebook className="w-4 h-4 text-brand-accent"/> Trade Log</h3>
            <div className="flex gap-2">
              <select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-brand-surface border border-brand-border text-brand-text rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-accent">
                <option value="ALL">All</option><option value="WIN">Wins</option><option value="LOSS">Losses</option><option value="BREAKEVEN">Breakeven</option>
              </select>
              <select value={sort} onChange={e=>setSort(e.target.value)} className="bg-brand-surface border border-brand-border text-brand-text rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand-accent">
                <option value="newest">Newest First</option><option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {loading && <div className="text-center py-12 text-brand-muted"><Loader className="w-6 h-6 animate-spin mx-auto"/></div>}
          {!loading && filtered.length===0 && (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-10 text-center">
              <Notebook className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-30"/>
              <p className="text-brand-muted text-sm">No journal entries yet. Log your first trade!</p>
            </div>
          )}

          {filtered.map(log => {
            const tag = getTag(log.mistake_tag);
            const pnl = log.entry_price && log.exit_price ? parseFloat(log.exit_price)-parseFloat(log.entry_price) : null;
            const OC = { WIN:'border-brand-bull/40 bg-brand-bull/5', LOSS:'border-brand-bear/40 bg-brand-bear/5', BREAKEVEN:'border-brand-muted/40' };
            const isExpanded = expandedId===log.journal_id;
            const psychResult = psychModal?.entryId===log.journal_id ? psychModal : null;

            return (
              <div key={log.journal_id} className={`bg-brand-card border rounded-2xl p-5 space-y-3 fade-in ${OC[log.outcome]}`}>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.stock_symbol && <span className="font-mono font-black text-brand-accent text-base bg-brand-surface border border-brand-border px-3 py-1 rounded-xl">{log.stock_symbol}</span>}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${log.outcome==='WIN'?'text-brand-bull bg-brand-bull/10 border-brand-bull/20':log.outcome==='LOSS'?'text-brand-bear bg-brand-bear/10 border-brand-bear/20':'text-brand-muted bg-brand-surface border-brand-border'}`}>
                      {OUTCOMES.find(o=>o.value===log.outcome)?.icon} {log.outcome}
                    </span>
                    {log.mistake_tag!=='NONE' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${tag.color}`}>
                        <AlertTriangle className="w-2.5 h-2.5"/>{tag.label}
                      </span>
                    )}
                    {log.emotion && <span className="text-[10px] text-brand-accent2 bg-brand-accent2/10 border border-brand-accent2/20 px-2 py-0.5 rounded-lg font-semibold">{log.emotion}</span>}
                    {log.followed_plan===false && <span className="text-[10px] text-brand-bear bg-brand-bear/10 border border-brand-bear/20 px-2 py-0.5 rounded-lg font-semibold">⚠️ Deviated from plan</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {pnl!=null && <span className={`font-mono font-bold text-sm ${pnl>=0?'text-brand-bull':'text-brand-bear'}`}>{pnl>=0?'+':''}${pnl.toFixed(2)}</span>}
                    <span className="text-xs text-brand-muted flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(log.created_at).toLocaleDateString()}</span>
                    <button onClick={()=>setExpandedId(isExpanded?null:log.journal_id)} className="text-brand-muted hover:text-brand-accent transition-colors p-1">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                    </button>
                    <button onClick={()=>handleDelete(log.journal_id)} className="text-brand-muted hover:text-brand-bear transition-colors p-1"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>

                {(log.entry_price||log.exit_price) && (
                  <div className="flex gap-4 text-xs font-mono">
                    {log.entry_price && <span className="text-brand-muted">Entry: <span className="text-white">${parseFloat(log.entry_price).toFixed(2)}</span></span>}
                    {log.exit_price  && <span className="text-brand-muted">Exit: <span className="text-white">${parseFloat(log.exit_price).toFixed(2)}</span></span>}
                  </div>
                )}

                <p className="text-brand-text text-sm leading-relaxed flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-brand-muted shrink-0 mt-0.5"/><span>{log.notes}</span>
                </p>

                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t border-brand-border fade-in">
                    {log.entry_reason && (
                      <div className="text-xs bg-brand-surface border border-brand-border rounded-xl p-3">
                        <span className="text-brand-muted font-semibold">Entry Reason: </span>
                        <span className="text-brand-text">{log.entry_reason}</span>
                      </div>
                    )}
                    {log.psychology_note && (
                      <div className="text-xs bg-brand-accent2/5 border border-brand-accent2/20 rounded-xl p-3">
                        <p className="text-brand-accent2 font-semibold mb-1 flex items-center gap-1"><Brain className="w-3 h-3"/> Auto-detected Pattern</p>
                        <p className="text-brand-text">{log.psychology_note}</p>
                      </div>
                    )}
                    <button onClick={()=>analyzePsychology(log)} disabled={psychResult?.loading}
                      className="w-full flex items-center justify-center gap-2 text-xs bg-brand-accent2/10 hover:bg-brand-accent2/20 border border-brand-accent2/30 text-brand-accent2 py-2 rounded-xl transition-colors disabled:opacity-50">
                      {psychResult?.loading ? <Loader className="w-3 h-3 animate-spin"/> : <Brain className="w-3 h-3"/>}
                      {psychResult?.loading ? 'Analyzing…' : 'AI Psychology Analysis'}
                    </button>
                    {psychResult?.result && (
                      <div className="text-xs bg-brand-surface border border-brand-border rounded-xl p-3 text-brand-text leading-relaxed fade-in">
                        <p className="text-brand-accent2 font-semibold mb-1">AI Analysis</p>
                        <p className="whitespace-pre-wrap">{psychResult.result}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}