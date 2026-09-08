import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, User, Copy, Check, ExternalLink, Lightbulb, FileText, Gavel, BookOpen, ScrollText, Search, Trash2, ShieldCheck, Scale, Volume2, VolumeX, Mic, Cpu, Globe2, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import { documents, type LegalDocument } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { JURISDICTIONS, getJurisdiction } from '../data/jurisdictions';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { getWebEngine, ensureEngineTrained, type TrainingStats } from '../ai/webEngine';
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
    'How do I register a SARL company under OHADA in Senegal?',
    'What penalties apply for domestic violence in Liberia?',
    'How do I register a business and get a concession in Liberia?',
    'What is customary land and how do I formalize it?',
    'Explain the role of the TRC and war crimes court debate',
  ];
  if (j.language === 'fr') return [
    "Qu'est-ce que l'Acte uniforme OHADA sur le droit commercial général ?",
    'Comment créer une SARL sous l\'OHADA ?',
    'Un Libérien peut-il entrer sans visa pour 90 jours ?',
    'Comment saisir la Cour de justice de la CEDEAO ?',
    'Quelles formalités au RCCM pour immatriculer une société ?',
    'Que dit le tarif extérieur commun (TEC) de la CEDEAO ?',
    'Comparer le foncier coutumier au Liberia et en droit OHADA',
    'Quelles peines pour le blanchiment selon les normes GIABA ?',
  ];
  if (j.language === 'pt') return [
    'O que é o Ato Uniforme da OHADA sobre direito comercial geral?',
    'Como constituir uma SARL segundo a OHADA?',
    'Um liberiano pode entrar sem visto por 90 dias?',
    'Como recorrer ao Tribunal de Justiça da CEDEAO?',
    'Que formalidades para registar uma sociedade?',
    'O que diz a Tarifa Externa Comum da CEDEAO?',
  ];
  return [
    `Can ${who} enter Liberia visa-free for 90 days under ECOWAS?`,
    `How do I register a business in ${j.name}?`,
    'How do I file a human-rights case at the ECOWAS Community Court?',
    'What duties apply under the ECOWAS Common External Tariff?',
    `Compare land tenure in ${j.name} vs Liberia`,
    'What is the OHADA Uniform Act on General Commercial Law?',
    'Explain free movement: entry, residence and establishment',
    'What are the penalties for money laundering under GIABA standards?',
  ];
}

function placeholderFor(code: string, koloquaActive: boolean): string {
  const j = getJurisdiction(code);
  if (koloquaActive) return 'Ask in Koloqua — e.g. Wetin Land Rights Act tok?';
  if (j.language === 'fr') return 'Posez votre question — ex. Créer une SARL OHADA ?';
  if (j.language === 'pt') return 'Pergunte — ex. Constituição de SARL OHADA?';
  if (code === 'LR') return 'Ask anything — e.g. Land Rights Act 2018';
  return `Ask about ${j.name} — e.g. business registration in ${j.capital}?`;
}

// ── KOLOQUA TRANSFORM — Liberian English with ATTITUDE (Liberia only) ──
function toKoloqua(text: string): string {
  let t = text;
  const hasKoloqua = t.includes('Eh my man') || t.includes('Ya hear') || t.includes('Listen well');
  if (!hasKoloqua) {
    const intros = [
      `Eh my man! Listen well o! 🇱🇷 Ya hear me?`,
      `My ma, make I burst your brain small! 🇱🇷`,
      `Look here my man — I go lay am for you clean clean o! 🇱🇷`,
    ];
    const pick = intros[Math.floor(Math.random() * intros.length)];
    const outros = [
      `\n\nSo na so e be for true o! Da correct law be dat. You get am? If you wan make I break am down more simple, just tell me — I deh here, no stress!`,
      `\n\nYa hear me so? Trust me, na so the law tok. You wan try another question? Shoot am!`,
      `\n\nI swear, na so e be o! No guess-guess, na real Liberia law be this. You want me to talk am again?`,
    ];
    const outro = outros[Math.floor(Math.random() * outros.length)];
    t = `${pick}\n\n` + t + outro;
  }
  t = t
    .replace(/\bYou should\b/g, 'Yu should')
    .replace(/\byou should\b/g, 'yu should')
    .replace(/\bYou can\b/g, 'Yu can')
    .replace(/\byou can\b/g, 'yu can')
    .replace(/\bYou will\b/g, 'Yu go')
    .replace(/\byou will\b/g, 'yu go')
    .replace(/\bYou are\b/g, 'Yu na')
    .replace(/\byou are\b/g, 'yu na')
    .replace(/\bDo not\b/g, 'No try')
    .replace(/\bdo not\b/g, 'no try')
    .replace(/\bcannot\b/g, "can't")
    .replace(/\bPlease\b/g, 'Abeg')
    .replace(/\bplease\b/g, 'abeg')
    .replace(/\bunderstand\b/gi, 'get am')
    .replace(/\bimportant\b/gi, 'big deal');
  return t;
}

/** Voice profile per respect-area country — the AI speaks YOUR area. */
function voiceProfile(code: string, koloquaActive: boolean): { match: (v: SpeechSynthesisVoice) => boolean; lang: string; rate: number; pitch: number } {
  const has = (...needles: string[]) => (v: SpeechSynthesisVoice) => {
    const s = `${v.lang} ${v.name}`.toLowerCase();
    return needles.some((n) => s.includes(n));
  };
  if (code === 'LR') return {
    match: has('en-lr', 'liberia', 'en-sl', 'sierra leone', 'en-gh', 'ghana'),
    lang: 'en-LR', rate: koloquaActive ? 0.88 : 0.98, pitch: koloquaActive ? 1.06 : 1.0,
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

export default function AIAssistant() {
  const { code: jurisdiction, active: activeJ, setCode: setJurisdictionCode } = useJurisdiction();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [stream, setStream] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [koloqua, setKoloqua] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [trainStats, setTrainStats] = useState<TrainingStats | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  const isLR = jurisdiction === 'LR';
  // Koloqua attitude is a Liberia thing — auto-off everywhere else.
  const koloquaActive = koloqua && isLR;
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

  const speak = (text: string, id: string, forceCode?: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
      window.speechSynthesis.cancel();
      const code = forceCode ?? jurisdiction;
      const prof = voiceProfile(code, koloquaActive);
      const plain = stripMarkdown(koloquaActive && code === 'LR' ? toKoloqua(text) : text);
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
      const out = koloquaActive && result.jurisdiction === 'LR' ? toKoloqua(result.content) : result.content;
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
          if (koloquaActive && result.jurisdiction === 'LR') setTimeout(() => speak(out, aiMsg.id, result.jurisdiction), 400);
        } else setStream(out.slice(0, idx));
      }, 16);
    } catch {
      setTyping(false); setStream('');
      setMessages(m => [...m, { id: Date.now().toString(), role: 'assistant', content: koloquaActive ? toKoloqua(`I deh here! Something small go wrong, but try again — e.g. "Land Rights Act 2018".`) : `Something went wrong, but I'm still here. Try again!`, timestamp: new Date() }]);
    }
  };

  const talkLabel = isLR ? (koloqua ? 'Talk in Koloqua 🇱🇷' : 'Talk') : `Listen (${activeJ.languageLabel})`;
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
            {isLR ? (
              <button className={`ai-koloqua-toggle ${koloqua ? 'ai-koloqua-toggle--on' : ''}`} onClick={() => { setKoloqua(v => !v); stopSpeak(); }} title="Koloqua Liberia accent">
                <Mic size={12} /> {koloqua ? 'Koloqua ON' : 'Koloqua OFF'}
              </button>
            ) : (
              <span className="ai-lang-badge" title={`AI answers in ${activeJ.languageLabel}`}><Languages size={12} /> {activeJ.languageLabel}</span>
            )}
            <button className="ai-clear" onClick={() => { setMessages([]); stopSpeak(); }}><Trash2 size={14} /> Clear</button>
          </div>
        </div>

        {/* ── OWN ENGINE: jurisdiction (respect-area country) + training status ── */}
        <div className="ai-engine">
          <span className="ai-engine__badge"><Cpu size={12} /> Own WebEngine v1</span>
          <label className="ai-engine__juris">
            <Globe2 size={12} />
            <img src={`https://flagcdn.com/w40/${activeJ.flag}.png`} alt={activeJ.name} className="ai-engine__flag" loading="lazy" />
            <select
              value={jurisdiction}
              onChange={e => setJurisdictionCode(e.target.value)}
              aria-label="Respect-area country — engine trains on this jurisdiction"
              title="Respect-area country — the engine trains its index on this jurisdiction"
            >
              {JURISDICTIONS.filter(j => j.code !== 'ECOWAS').map(j => (
                <option key={j.code} value={j.code}>
                  {j.name} — {j.status === 'active' ? 'LIVE' : j.status === 'next' ? 'Next • Phase 1' : `Queued • ${j.phase}`} ({j.languageLabel})
                </option>
              ))}
            </select>
          </label>
          <span className="ai-engine__stats" title={trainStats ? `Trained ${new Date(trainStats.trainedAt).toLocaleString()}` : 'Training…'}>
            {trainStats
              ? <>trained: <strong>{trainStats.totalIndexed}</strong> docs ({trainStats.primaryDocs} {jurisdiction} + {trainStats.communityDocs} ECOWAS{trainStats.comparativeDocs ? ` + ${trainStats.comparativeDocs} comparative` : ''})</>
              : 'training engine…'}
          </span>
        </div>

        <div className="ai-helper">
          <Lightbulb size={14} />
          {isLR ? (
            <span><strong>Liberia voice o!</strong> {koloqua ? 'Koloqua ON — I go answer in Liberian Koloqua and I can talk out loud. Tap 🔊 to hear me.' : 'Toggle Koloqua ON to hear me in Liberian accent.'} Tap a country above to re-train me on that area.</span>
          ) : (
            <span><strong>{activeJ.name} mode.</strong> I'm trained on {activeJ.name} + ECOWAS community law and answer in <strong>{activeJ.languageLabel}</strong> ({activeJ.traditionLabel}). Tap 🔊 to hear my voice. Switch country above anytime.</span>
          )}
        </div>

        {!isLR && (
          <div className="ai-juris-note">
            <Globe2 size={12} />
            <span>You&apos;re viewing <strong>{FLAG_EMOJI[jurisdiction] ?? ''} {activeJ.name}</strong> — Liberia content appears only when you pick Liberia.</span>
            <button onClick={() => setJurisdictionCode('LR')}>Back to Liberia 🇱🇷</button>
          </div>
        )}

        <div className="ai-trust">
          <span><ShieldCheck size={12} /> Grounded</span><span><Scale size={12} /> Cited</span><span><FileText size={12} />{documents.length + ecowasCommunityDocs.length} sources</span><span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}><img src={flagSrc} alt="" style={{ width: 18, height: 12, objectFit: 'cover', borderRadius: 2 }} /> {activeJ.name} • {activeJ.traditionLabel}</span>
        </div>

        {!hasMessages ? (
          <div className="ai-empty">
            <div className="ai-empty__icon"><img src={flagSrc} alt={activeJ.name} style={{ width: 32, height: 20, objectFit: 'cover', borderRadius: 3 }} /></div>
            <h1>
              {isLR ? 'Ask Liberian law — I go answer you in Koloqua o!'
                : activeJ.language === 'fr' ? `Interrogez le droit — je réponds en français !`
                : activeJ.language === 'pt' ? `Pergunte sobre direito — respondo em português!`
                : `Ask ${activeJ.name} law — cited answers, zero guessing.`}
            </h1>
            <p>Our own WebEngine v1 is trained on {trainStats?.totalIndexed ?? '…'} instruments for <strong>{activeJ.name}</strong> + ECOWAS community law. Every answer cited. Tap 🔊 to hear my {activeJ.languageLabel} voice.</p>
            <div className="ai-suggestions">
              {suggestions.map(s => (
                <button key={s} className="ai-suggestion" onClick={() => send(s)}>
                  <Lightbulb size={14} /><span>{s}</span><ExternalLink size={12} />
                </button>
              ))}
            </div>
            <p className="ai-empty__note">
              {isLR ? 'Try Koloqua: “Wetin da Land Rights Act say about customary land?” — or cross-border: “Can a Liberian work visa-free in Ghana?”'
                : activeJ.language === 'fr' ? 'Essayez : « Comment créer une SARL sous l\'OHADA ? » — ou transfrontalier : « Libre circulation CEDEAO ? »'
                : activeJ.language === 'pt' ? 'Tente: «Como constituir uma SARL segundo a OHADA?»'
                : `Try: "Can I enter Liberia visa-free?" — or name any country ("…in ${activeJ.name}?") and I answer from that area.`}
            </p>
          </div>
        ) : (
          <div className="ai-messages">
            {messages.map(m => (
              <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
                {m.role === 'assistant' ? <LawAvatar size={36} speaking={speakingId === m.id} /> : <span className="ai-msg__avatar"><User size={14} /></span>}
                <div className="ai-msg__bubble">
                  <div className="ai-msg__text" dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
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
                  {stream ? <div className="ai-msg__text" dangerouslySetInnerHTML={{ __html: stream.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} /> : <div className="ai-typing"><span /><span /><span /> WebEngine searching {trainStats?.totalIndexed ?? documents.length} {activeJ.name} instruments…</div>}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        <div className="ai-input">
          <div className="ai-input__field">
            <Search size={16} className="ai-input__icon" />
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder={placeholderFor(jurisdiction, koloquaActive)} aria-label="Ask AI" />
            <button className="ai-input__send" onClick={() => send(input)} disabled={!input.trim() || typing}><Send size={16} /><span>Send</span></button>
          </div>
          <p className="ai-input__helper">Press <strong>Enter</strong> to send • Engine trained on <strong>{activeJ.name}</strong> + ECOWAS{isLR ? ' • Toggle Koloqua for Liberia accent' : ` • Answers in ${activeJ.languageLabel}`} • {FLAG_EMOJI[jurisdiction] ?? ''} {activeJ.name}</p>
        </div>
      </div>
    </div>
  );
}
