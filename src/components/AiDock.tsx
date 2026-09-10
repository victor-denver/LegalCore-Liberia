import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Maximize2, Send, X } from 'lucide-react';
import { documents } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { ensureEngineTrained, getWebEngine } from '../ai/webEngine';
import './AiDock.css';

const AI_AVATAR = '/avatar/4231e846-2f39-4ead-8f30-2be6701be53e.png';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export default function AiDock() {
  const loc = useLocation();
  const { active } = useJurisdiction();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const engine = useMemo(() => getWebEngine(), []);

  useEffect(() => {
    ensureEngineTrained(documents, ecowasCommunityDocs, active.code);
  }, [engine, active.code]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, open]);

  if (loc.pathname === '/ai') return null;

  const send = (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setInput('');
    setMessages((m) => [...m, { id: String(Date.now()), role: 'user', content: q }]);
    setTyping(true);
    const result = engine.query(q);
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: String(Date.now() + 1), role: 'assistant', content: result.content }]);
      setTyping(false);
    }, 280);
  };

  return (
    <div className={`ai-dock ${open ? 'ai-dock--open' : ''}`}>
      {open && (
        <div className="ai-dock__panel" role="dialog" aria-label="LegalCore AI">
          <div className="ai-dock__head">
            <div className="ai-dock__brand">
              <img src={AI_AVATAR} alt="" className="ai-dock__avatar" />
              <div>
                <strong>LegalCore AI</strong>
                <span>{active.name} · ask anything</span>
              </div>
            </div>
            <div className="ai-dock__head-actions">
              <Link to="/ai" className="ai-dock__icon" title="Open full AI" onClick={() => setOpen(false)}>
                <Maximize2 size={15} />
              </Link>
              <button className="ai-dock__icon" onClick={() => setOpen(false)} aria-label="Close AI">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="ai-dock__body">
            {messages.length === 0 && (
              <p className="ai-dock__empty">Ask a legal question. Answers are cited from the live corpus.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`ai-dock__msg ai-dock__msg--${m.role}`}>
                {m.content}
              </div>
            ))}
            {typing && <div className="ai-dock__msg ai-dock__msg--assistant">Thinking…</div>}
            <div ref={endRef} />
          </div>

          <form
            className="ai-dock__form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the law…"
              autoFocus
            />
            <button type="submit" disabled={!input.trim() || typing} aria-label="Send">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        className="ai-dock__fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI' : 'Open LegalCore AI'}
      >
        {open ? <X size={22} /> : <img src={AI_AVATAR} alt="" className="ai-dock__fab-img" />}
      </button>
    </div>
  );
}
