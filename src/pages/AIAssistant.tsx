import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, User, Copy, Check, ExternalLink, Lightbulb, FileText, Gavel, BookOpen, ScrollText, Search, Trash2, Volume2, VolumeX, Cpu, Globe2, Languages, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { documents, type LegalDocument } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { JURISDICTIONS, getJurisdiction } from '../data/jurisdictions';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { getWebEngine, ensureEngineTrained, type TrainingStats } from '../ai/webEngine';
import { track } from '../lib/analytics';
import { ProvenanceBadge } from '../components/Provenance';
import LawAvatar from '../components/LawAvatar';
import './AIAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: LegalDocument[];
  timestamp: Date;
  meta?: { confidence: number; latencyMs: number; jurisdiction: string; isComparative: boolean };
}

const typeIcons: Record<string, any> = { statute: ScrollText, case: Gavel, opinion: FileText, constitution: BookOpen };

const FLAG_EMOJI: Record<string, string> = {
  LR: '🇱🇷', SL: '🇸🇱', GH: '🇬🇭', GM: '🇬🇲', NG: '🇳🇬',
  SN: '🇸🇳', CI: '🇨🇮', BJ: '🇧🇯', TG: '🇹🇬', GN: '🇬🇳',
  CV: '🇨🇻', GW: '🇬🇼', ECOWAS: '🌍',
};

/** Example questions tuned to the active respect-area country + language. */
function suggestionsFor(code: string): string[] {
  const j = getJurisdiction(code);
  const demonym: Record<string, string> = {
    SL: 'Sierra Leonean', GH: 'Ghanaian', GM: 'Gambian', NG: 'Nigerian',
  };
  const who = demonym[code] ? `a ${demonym[code]}` : `a ${j.name} citizen`;
  if (code === 'LR') return [
    'What are the key provisions of the Land Rights Act of 2018?',
    'Explain due process rights under the 1986 Constitution Article 20',
    'Can a Liberian enter Ghana visa-free for 90 days under ECOWAS?',
    'How do I register a business and get a concession in Liberia?',
  ];
  if (j.language === 'fr') return [
    "Qu'est-ce que l'Acte uniforme OHADA sur le droit commercial général ?",
    'Comment créer une SARL sous l\'OHADA ?',
    'Un Libérien peut-il entrer sans visa pour 90 jours ?',
    'Comment saisir la Cour de justice de la CEDEAO ?',
  ];
  if (j.language === 'pt') return [
    'O que é o Ato Uniforme da OHADA sobre direito comercial geral?',
    'Como constituir uma SARL segundo a OHADA?',
    'Um liberiano pode entrar sem visto por 90 dias?',
    'Como recorrer ao Tribunal de Justiça da CEDEAO?',
  ];
  return [
    `Can ${who} enter Liberia visa-free for 90 days under ECOWAS?`,
    `How do I register a business in ${j.name}?`,
    'How do I file a human-rights case at the ECOWAS Community Court?',
    'What is the OHADA Uniform Act on General Commercial Law?',
  ];
}

function placeholderFor(code: string): string {
  const j = getJurisdiction(code);
  if (j.language === 'fr') return 'Posez votre question — ex. Créer une SARL OHADA ?';
  if (j.language === 'pt') return 'Pergunte — ex. Constituição de SARL OHADA?';
  if (code === 'LR') return 'Ask anything — e.g. Land Rights Act 2018';
  return `Ask about ${j.name} — e.g. business registration in ${j.capital}?`;
}

/** Voice profile per respect-area country — the AI speaks YOUR area. */
function voiceProfile(code: string): { match: (v: SpeechSynthesisVoice) => boolean; lang: string; rate: number; pitch: number } {
  const has = (...needles: string[]) => (v: SpeechSynthesisVoice) => {
    const s = `${v.lang} ${v.name}`.toLowerCase();
    return needles.some((n) => s.includes(n));
  };
  if (code === 'LR') return {
    match: has('en-lr', 'liberia', 'en-sl', 'sierra leone', 'en-gh', 'ghana'),
    lang: 'en-LR', rate: 0.98, pitch: 1.0,
  };
  if (code === 'SL') return { match: has('en-sl', 'sierra leone', 'en-lr', 'liberia', 'en-gh'), lang: 'en-SL', rate: 0.95, pitch: 1.0 };
  if (code === 'GH') return { match: has('en-gh', 'ghana', 'en-ng', 'en-us'), lang: 'en-GH', rate: 0.98, pitch: 1.0 };
  if (code === 'GM') return { match: has('en-gm', 'gambia', 'en-gh', 'en-sl', 'en-us'), lang: 'en-GM', rate: 0.98, pitch: 1.0 };
  if (code === 'NG') return { match: has('en-ng', 'nigeria', 'en-gh', 'en-us'), lang: 'en-NG', rate: 0.98, pitch: 1.0 };
  const j = getJurisdiction(code);
  if (j.language === 'fr') return { match: has('fr-fr', 'francais', 'français', 'french', 'fr-'), lang: 'fr-FR', rate: 0.98, pitch: 1.0 };
  if (j.language === 'pt') return { match: has('pt-pt', 'portugu', 'pt-'), lang: 'pt-PT', rate: 0.98, pitch: 1.0 };
  return { match: has('en-us', 'en-gb', 'english'), lang: 'en-US', rate: 0.98, pitch: 1.0 };
}

function stripMarkdown(s: string) { return s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\n/g, ' ').replace(/<[^>]*>/g, ''); }

function formatAiHtml(s: string) {
  return s
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n/g, '<br/>');
}

export default function AIAssistant() {
  const { code: jurisdiction, active: activeJ, setCode: setJurisdictionCode } = useJurisdiction();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [stream, setStream] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [trainStats, setTrainStats] = useState<TrainingStats | null>(null);
  const [jurisOpen, setJurisOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const jurisRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  const isLR = jurisdiction === 'LR';
  const suggestions = useMemo(() => suggestionsFor(jurisdiction), [jurisdiction]);

  // ── OWN AI WEBENGINE: train the database on the respect-area country ──
  const engine = useMemo(() => getWebEngine(), []);
  useEffect(() => {
    const { stats } = ensureEngineTrained(documents, ecowasCommunityDocs, jurisdiction);
    setTrainStats(stats);
  }, [engine, jurisdiction]);

  // Fresh thread when the user switches country — no mixed-context confusion.
  const prevJuris = useRef(jurisdiction);
  useEffect(() => {
    if (prevJuris.current !== jurisdiction) {
      prevJuris.current = jurisdiction;
      setMessages([]);
      stopSpeak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jurisdiction]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, stream, typing]);
  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  }, []);
  useEffect(() => {
    if (!jurisOpen) return;
    const close = (e: MouseEvent) => {
      if (jurisRef.current && !jurisRef.current.contains(e.target as Node)) setJurisOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [jurisOpen]);

  const speak = (text: string, id: string, forceCode?: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
      window.speechSynthesis.cancel();
      const code = forceCode ?? jurisdiction;
      const prof = voiceProfile(code);
      const plain = stripMarkdown(text);
      const utter = new SpeechSynthesisUtterance(plain);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(prof.match) ?? voices.find((v) => v.lang.toLowerCase().startsWith(prof.lang.slice(0, 2)));
      if (preferred) utter.voice = preferred;
      utter.lang = preferred ? preferred.lang : prof.lang;
      utter.rate = prof.rate;
      utter.pitch = prof.pitch;
      utter.volume = 1;
      utter.onstart = () => setSpeakingId(id);
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const vs = window.speechSynthesis.getVoices();
          const p2 = vs.find(prof.match);
          if (p2) utter.voice = p2;
          window.speechSynthesis.speak(utter);
        };
      } else {
        window.speechSynthesis.speak(utter);
      }
    } catch { /* noop */ }
  };

  const stopSpeak = () => { try { window.speechSynthesis.cancel(); setSpeakingId(null); } catch { /* noop */ } };

  const send = (text: string) => {
    try {
      if (!text.trim() || typing) return;
      stopSpeak();
      const user: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), timestamp: new Date() };
      setMessages(m => [...m, user]);
      setInput(''); setTyping(true); setStream('');
      // ── Query OUR engine (trained per-country), not an external API ──
      const result = engine.query(text);
      track('ai_query', { q: text.trim(), confidence: result.confidence, sources: result.sources?.length ?? 0, jurisdiction: result.jurisdiction, comparative: result.isComparative });
      const out = result.content;
      let idx = 0;
      const iv = setInterval(() => {
        idx += Math.ceil(out.length / 30);
        if (idx >= out.length) {
          clearInterval(iv);
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(), role: 'assistant', content: out,
            sources: result.sources, timestamp: new Date(),
            meta: { confidence: result.confidence, latencyMs: result.latencyMs, jurisdiction: result.jurisdiction, isComparative: result.isComparative },
          };
          setMessages(m => [...m, aiMsg]);
          setStream(''); setTyping(false);
        } else setStream(out.slice(0, idx));
      }, 16);
    } catch {
      setTyping(false); setStream('');
      setMessages(m => [...m, { id: Date.now().toString(), role: 'assistant', content: `Something went wrong. Try again — e.g. "Land Rights Act 2018".`, timestamp: new Date() }]);
    }
  };

  const talkLabel = `Listen (${activeJ.languageLabel})`;
  const flagSrc = isLR ? '/liberiaFlag.png' : `https://flagcdn.com/w80/${activeJ.flag}.png`;

  return (
    <div className="ai-page">
      <div className="ai-page__inner">
        <div className="ai-header">
          <div className="ai-header__left">
            <span className="ai-header__icon"><img src={flagSrc} alt={activeJ.name} style={{ width: 22, height: 14, objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(0,0,0,0.1)' }} /></span>
            <div>
              <span className="ai-header__title">LegalCore AI — {activeJ.name} {FLAG_EMOJI[jurisdiction] ?? ''}</span>
              <span className="ai-header__sub">{documents.length + ecowasCommunityDocs.length} instruments • {activeJ.languageLabel} • Own WebEngine v1</span>
            </div>
          </div>
          <div className="ai-header__right">
            <span className="ai-lang-badge" title={`AI answers in ${activeJ.languageLabel}`}><Languages size={12} /> {activeJ.languageLabel}</span>
            <button className="ai-clear" onClick={() => { setMessages([]); stopSpeak(); }}><Trash2 size={14} /> Clear</button>
          </div>
        </div>

        {/* ── OWN ENGINE: jurisdiction (respect-area country) + training status ── */}
        <div className="ai-engine">
          <span className="ai-engine__badge"><Cpu size={12} /> Own WebEngine v1</span>
          <div className="ai-engine__juris" ref={jurisRef}>
            <Globe2 size={12} />
            <button
              type="button"
              className="ai-engine__juris-btn"
              aria-haspopup="listbox"
              aria-expanded={jurisOpen}
              aria-label="Country — engine trains on this jurisdiction"
              onClick={() => setJurisOpen((v) => !v)}
            >
              <img src={`https://flagcdn.com/w40/${activeJ.flag}.png`} alt="" className="ai-engine__flag" />
              <span>{activeJ.name} — {activeJ.status === 'active' ? 'LIVE' : activeJ.phase} ({activeJ.languageLabel})</span>
              <ChevronDown size={14} />
            </button>
            {jurisOpen && (
              <ul className="ai-engine__menu" role="listbox">
                {JURISDICTIONS.filter((j) => j.code !== 'ECOWAS').map((j) => (
                  <li key={j.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={j.code === jurisdiction}
                      className={j.code === jurisdiction ? 'on' : ''}
                      onClick={() => { setJurisdictionCode(j.code); setJurisOpen(false); }}
                    >
                      <img src={`https://flagcdn.com/w40/${j.flag}.png`} alt="" />
                      <span>
                        <strong>{j.name}</strong>
                        <small>{j.status === 'active' ? 'LIVE' : j.status === 'next' ? 'Next · Phase 1' : `Queued · ${j.phase}`} · {j.languageLabel}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span className="ai-engine__stats" title={trainStats ? `Trained ${new Date(trainStats.trainedAt).toLocaleString()}` : 'Training…'}>
            {trainStats
              ? <>trained: <strong>{trainStats.totalIndexed}</strong> docs ({trainStats.primaryDocs} {jurisdiction} + {trainStats.communityDocs} ECOWAS{trainStats.comparativeDocs ? ` + ${trainStats.comparativeDocs} comparative` : ''})</>
              : 'training engine…'}
          </span>
        </div>

        {!hasMessages ? (
          <div className="ai-empty">
            <h1>
              {activeJ.language === 'fr' ? 'Interrogez le droit.'
                : activeJ.language === 'pt' ? 'Pergunte sobre o direito.'
                : 'Ask the law.'}
            </h1>
            <p>Cited answers from {trainStats?.totalIndexed ?? '…'} instruments for <strong>{activeJ.name}</strong> and ECOWAS community law.</p>
            <div className="ai-suggestions">
              {suggestions.map(s => (
                <button key={s} className="ai-suggestion" onClick={() => send(s)}>
                  <Lightbulb size={14} /><span>{s}</span><ExternalLink size={12} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-messages">
            {messages.map(m => (
              <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
                {m.role === 'assistant' ? <LawAvatar size={36} speaking={speakingId === m.id} /> : <span className="ai-msg__avatar"><User size={14} /></span>}
                <div className="ai-msg__bubble">
                  <div className="ai-msg__text" dangerouslySetInnerHTML={{ __html: formatAiHtml(m.content) }} />
                  {m.meta && m.role === 'assistant' && (
                    <div className="ai-meta">
                      <span><Cpu size={10} /> WebEngine v1</span>
                      <span><Globe2 size={10} /> {m.meta.jurisdiction === 'ECOWAS' ? 'ECOWAS' : getJurisdiction(m.meta.jurisdiction).name}</span>
                      <span>confidence {Math.round(m.meta.confidence * 100)}%</span>
                      <span>{m.meta.latencyMs} ms</span>
                      {m.meta.isComparative && <span className="ai-meta__warn">comparative reference — confirm locally</span>}
                    </div>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="ai-sources">
                      <span className="ai-sources__label">Sources — tap to read full text:</span>
                      <div className="ai-sources__grid">
                        {m.sources.map(doc => {
                          const Icon = typeIcons[doc.type] || FileText;
                          const jcode = (doc as any).jurisdiction as string | undefined;
                          return (
                            <Link key={doc.id} to={`/document/${doc.id}`} className="ai-source">
                              <span className={`ai-source__tag ai-source__tag--${doc.type}`}><Icon size={11} />{doc.type} • {doc.year}{jcode ? ` • ${jcode}` : ''}</span>
                              <strong>{doc.title}</strong>
                              <span><ProvenanceBadge doc={doc} /></span>
                              <span>{doc.summary.slice(0, 90)}…</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {m.role === 'assistant' && (
                    <div className="ai-msg__actions">
                      <button className="ai-copy" onClick={async () => { await navigator.clipboard.writeText(m.content); setCopied(m.id); setTimeout(() => setCopied(null), 1200); }}>
                        {copied === m.id ? <Check size={12} /> : <Copy size={12} />}{copied === m.id ? 'Copied' : 'Copy'}
                      </button>
                      <button className={`ai-speak ${speakingId === m.id ? 'ai-speak--active' : ''}`} onClick={() => speak(m.content, m.id, m.meta?.jurisdiction)} title={talkLabel}>
                        {speakingId === m.id ? <VolumeX size={12} /> : <Volume2 size={12} />}{speakingId === m.id ? 'Stop' : talkLabel}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="ai-msg ai-msg--assistant">
                <LawAvatar size={36} thinking />
                <div className="ai-msg__bubble">
                  {stream ? <div className="ai-msg__text" dangerouslySetInnerHTML={{ __html: formatAiHtml(stream) }} /> : <div className="ai-typing"><span /><span /><span /> WebEngine searching {trainStats?.totalIndexed ?? documents.length} {activeJ.name} instruments…</div>}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        <form className="ai-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <div className="ai-input__field">
            <Search size={16} className="ai-input__icon" />
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholderFor(jurisdiction)} aria-label="Ask AI" />
            <button type="submit" className="ai-input__send" disabled={!input.trim() || typing}><Send size={16} /><span>Send</span></button>
          </div>
          <p className="ai-input__helper">Enter to send · Trained on <strong>{activeJ.name}</strong> + ECOWAS · Answers in {activeJ.languageLabel}</p>
        </form>
      </div>
    </div>
  );
}
