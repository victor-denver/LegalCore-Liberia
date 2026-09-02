import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Check, ExternalLink, Lightbulb, FileText, Gavel, BookOpen, ScrollText, Search, Trash2, ShieldCheck, Scale, Volume2, VolumeX, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import { documents, type LegalDocument } from '../data/legalData';
import './AIAssistant.css';

interface Message { id:string; role:'user'|'assistant'; content:string; sources?:LegalDocument[]; timestamp:Date; }

const suggestions=[
  'What are the key provisions of the Land Rights Act of 2018?',
  'Explain due process rights under the 1986 Constitution Article 20',
  'What penalties apply for domestic violence in Liberia?',
  'How do I register a business and get a concession in Liberia?',
  'What is customary land and how do I formalize it?',
  'Explain the role of the TRC and war crimes court debate',
];

const typeIcons:Record<string,any>={ statute:ScrollText, case:Gavel, opinion:FileText, constitution:BookOpen };

const synonyms: Record<string,string[]> = {
  land: ['property','customary','land rights','deeds','tenure'],
  property: ['land','customary','deeds','estate'],
  constitution: ['article','fundamental rights','supreme law','1986'],
  business: ['commercial','corporation','investment','concession','company'],
  company: ['business','corporation','commercial'],
  criminal: ['penal','offense','crime','felony','misdemeanor'],
  court: ['judiciary','supreme court','circuit court','magistrate','trial'],
  marriage: ['family','customary marriage','divorce','custody'],
  tax: ['revenue','LRA','customs','duty','GST'],
  health: ['public health','Ebola','quarantine','hospital'],
  school: ['education','teacher','university','NCHE'],
  environment: ['forest','mining','EPA','EIA','climate'],
  maritime: ['shipping','vessel','LiMA','port','flag'],
  rights: ['human rights','TRC','discrimination','equality'],
};

function expandTerms(raw: string[]): string[] {
  const out = new Set<string>(raw);
  raw.forEach(t=>{
    Object.entries(synonyms).forEach(([k, vals])=>{
      if (t.includes(k) || vals.some(v=> t.includes(v))) {
        vals.forEach(v=> out.add(v));
        out.add(k);
      }
    });
  });
  return [...out];
}

function searchDocs(q: string): LegalDocument[] {
  const raw = q.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2);
  if(!raw.length) return [];
  const terms = expandTerms(raw);
  const catHint = (()=> {
    const s = q.toLowerCase();
    if (s.includes('land')||s.includes('property')||s.includes('customary')) return 'property';
    if (s.includes('business')||s.includes('company')||s.includes('concession')||s.includes('commercial')) return 'commercial';
    if (s.includes('crime')||s.includes('criminal')||s.includes('penal')||s.includes('rape')||s.includes('theft')) return 'criminal';
    if (s.includes('constitution')||s.includes('article')||s.includes('rights')) return 'constitutional';
    if (s.includes('family')||s.includes('marriage')||s.includes('custody')||s.includes('divorce')) return 'family';
    if (s.includes('tax')||s.includes('revenue')||s.includes('customs')) return 'tax-revenue';
    if (s.includes('health')||s.includes('Ebola')) return 'public-health';
    if (s.includes('school')||s.includes('education')) return 'education';
    if (s.includes('environment')||s.includes('forest')||s.includes('mining')) return 'environmental';
    if (s.includes('maritime')||s.includes('shipping')||s.includes('vessel')) return 'maritime';
    if (s.includes('labor')||s.includes('worker')||s.includes('wage')) return 'labor';
    return '';
  })();
  const scored = documents.map(doc=>{
    let s=0;
    const hay = `${doc.title} ${doc.summary} ${doc.body}`.toLowerCase();
    const title = doc.title.toLowerCase();
    const tags = doc.tags.join(' ').toLowerCase();
    terms.forEach(t=>{
      if (title.includes(t)) s+=4;
      if (hay.includes(t)) s+=2;
      if (tags.includes(t)) s+=1.5;
      if (t.length>4 && (title.includes(t.slice(0,4)) || hay.includes(t.slice(0,4)))) s+=0.3;
    });
    if (catHint && doc.category===catHint) s+=3;
    if (q.toLowerCase().includes(String(doc.year))) s+=2;
    return { doc, score:s };
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if (scored.length===0 && catHint) return documents.filter(d=>d.category===catHint).slice(0,3);
  if (scored.length===0) return documents.filter(d=>['const-1986','stat-2018-land-rights','stat-1948-maritime','case-1988-cabral'].includes(d.id));
  return scored.slice(0,4).map(x=>x.doc);
}

function getGeneralAnswer(q: string): { content: string, sources: LegalDocument[] } | null {
  const s = q.toLowerCase();
  if (s.includes('capital') && s.includes('liberia')) {
    return { content: `**Monrovia** is the capital of Liberia, as established under the administrative structure in the 1986 Constitution (Article 2). The Legislature sits at the Capitol Building and the Supreme Court at the Temple of Justice — both on Capitol Hill, Monrovia.`, sources: searchDocs('Constitution 1986 Article 2') };
  }
  if (s.includes('how to') && (s.includes('register')||s.includes('business')||s.includes('company'))) {
    return { content: `To **register a business in Liberia**:\n\n1. **Name search** at Liberia Business Registry (LBR)\n2. **Incorporate** under Business Corporations Act — file articles\n3. **Tax registration** with LRA — get TIN\n4. **Concession** (if mining/forest) — community consent under Land Rights Act 2018 + EIA from EPA\n5. **Licenses** — Ministry of Commerce + sector permits`, sources: searchDocs('business registration commercial concession') };
  }
  if (s.includes('how to') && s.includes('file') && s.includes('case')) {
    return { content: `To **file a case in Liberia**:\n\n1. Identify jurisdiction — **Magistrate** (minor), **Circuit** (major), **Commercial** (business), **Supreme Court** (constitutional)\n2. File at Clerk of Court in relevant county (see Court Map)\n3. Pay fees, serve other party\n4. Due process under **Article 20** guarantees notice & hearing`, sources: searchDocs('court filing circuit supreme') };
  }
  return null;
}

// ── KOLOQUA TRANSFORM — Liberian English with ATTITUDE ──
function toKoloqua(text: string): string {
  let t = text;
  const hasKoloqua = t.includes('Eh my man') || t.includes('Ya hear') || t.includes('Listen well');
  if (!hasKoloqua) {
    // Liberian attitude: confident, warm, direct, small sass — NOT Nigerian
    // Keep law titles intact, wrap with Koloqua framing
    const intros = [
      `Eh my man! Listen well o! 🇱🇷 Ya hear me?`,
      `My ma, make I burst your brain small! 🇱🇷`,
      `Look here my man — I go lay am for you clean clean o! 🇱🇷`,
    ];
    const pick = intros[Math.floor(Math.random()*intros.length)];
    const outros = [
      `\n\nSo na so e be for true o! Da correct law be dat. You get am? If you wan make I break am down more simple, just tell me — I deh here, no stress!`,
      `\n\nYa hear me so? Trust me, na so the law tok. You wan try another question? Shoot am!`,
      `\n\nI swear, na so e be o! No guess-guess, na real Liberia law be this. You want me to talk am again?`,
    ];
    const outro = outros[Math.floor(Math.random()*outros.length)];
    t = `${pick}\n\n` + t + outro;
  }
  // Light, attitude-filled word swaps — keep legal terms untouched
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
  // Add small interjections for rhythm — keep it Liberian, not Naija
  // We keep it subtle: add "o" and "eh" at end of some sentences already via intro/outro
  return t;
}

function stripMarkdown(s: string){ return s.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\n/g,' ').replace(/<[^>]*>/g,''); }

export default function AIAssistant(){
  const [messages,setMessages]=useState<Message[]>([]);
  const [input,setInput]=useState('');
  const [typing,setTyping]=useState(false);
  const [stream,setStream]=useState('');
  const [copied,setCopied]=useState<string|null>(null);
  const [koloqua,setKoloqua]=useState(true); // default ON as user requested Liberia accent
  const [speakingId,setSpeakingId]=useState<string|null>(null);
  const endRef=useRef<HTMLDivElement>(null);
  const hasMessages=messages.length>0;
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,stream,typing]);
  useEffect(()=>{ // preload voices
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  },[]);

  const speak = (text: string, id: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      if (speakingId===id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
      window.speechSynthesis.cancel();
      const plain = stripMarkdown(koloqua ? toKoloqua(text) : text);
      const utter = new SpeechSynthesisUtterance(plain);
      const voices = window.speechSynthesis.getVoices();
      // ── LIBERIA ONLY — never Nigeria ──
      // Try true Liberia, then Sierra Leone (closest to Liberia), then Ghana, then fallback US with Liberian prosody
      const preferred =
        voices.find(v=> v.lang.toLowerCase() === 'en-lr') ||
        voices.find(v=> v.lang.toLowerCase().includes('en-lr')) ||
        voices.find(v=> v.lang.toLowerCase() === 'en-sl') ||
        voices.find(v=> v.lang.toLowerCase().includes('en-sl')) ||
        voices.find(v=> v.name.toLowerCase().includes('liberia')) ||
        voices.find(v=> v.name.toLowerCase().includes('sierra leone')) ||
        voices.find(v=> v.lang.toLowerCase().includes('en-gh')) ||
        voices.find(v=> v.name.toLowerCase().includes('ghana')) ||
        voices.find(v=> v.lang.toLowerCase().includes('en-us') && v.name.toLowerCase().includes('natural'));
      if (preferred) utter.voice = preferred;
      // Force Liberian lang tag so browser knows — not en-NG
      utter.lang = preferred ? preferred.lang : 'en-LR';
      // Liberian Koloqua rhythm: warm, confident, slight melodic rise, not fast Naija pace
      utter.rate = koloqua ? 0.88 : 0.98; // slower, more attitude when Koloqua
      utter.pitch = koloqua ? 1.06 : 1.0; // a touch higher, lively
      utter.volume = 1;
      utter.onstart = ()=> setSpeakingId(id);
      utter.onend = ()=> setSpeakingId(null);
      utter.onerror = ()=> setSpeakingId(null);
      // Small delay to let voices load on some browsers
      if (voices.length===0) {
        window.speechSynthesis.onvoiceschanged = ()=> {
          const vs = window.speechSynthesis.getVoices();
          const p2 = vs.find(v=> v.lang.toLowerCase().includes('en-lr')) || vs.find(v=> v.lang.toLowerCase().includes('en-sl')) || vs.find(v=> v.name.toLowerCase().includes('liberia'));
          if (p2) utter.voice = p2;
          window.speechSynthesis.speak(utter);
        };
      } else {
        window.speechSynthesis.speak(utter);
      }
    } catch {}
  };

  const stopSpeak = ()=> { try{ window.speechSynthesis.cancel(); setSpeakingId(null);}catch{} };

  function buildReply(q: string, results: LegalDocument[]){
    const clean = q.trim();
    if(/^(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you|yo|what's up)\b/i.test(clean) && clean.split(/\s+/).length < 6){
      const base = `Hey! I’m **LegalCore AI** — Liberia’s law AI that knows all ${documents.length} laws (1847–2026) and cites every answer.\n\nAsk me like a person:\n• “What does Article 20 say about due process?”\n• “Explain Land Rights Act 2018 simply”\n• “How do I register customary land?”\n\nWhat do you want to know?`;
      return { content: koloqua ? toKoloqua(base) : base, sources: [] as LegalDocument[] };
    }
    const general = getGeneralAnswer(q);
    if (general) {
      const c = koloqua ? toKoloqua(general.content) : general.content;
      return { content: c, sources: general.sources };
    }
    if(results.length===0){
      const fallback = documents.slice(0,3);
      const base = `I couldn’t find an exact match for **"${q}"**, but here are foundational Liberian laws to start. Try simpler words like *land*, *constitution*, *tax* — or ask me in Koloqua!`;
      return { content: koloqua ? toKoloqua(base) : base, sources: fallback };
    }
    const header = koloqua ? `Eh my man, ya hear me! Here na wetin I find inside **Liberia real law** — all cited, no guess o:\n\n` : `Here’s what I found in **Liberia’s real laws** — grounded, cited, no guessing:\n\n`;
    const bullets=results.map(d=> `**${d.title}** — *${d.date}* (${d.type})\n${d.summary}`).join('\n\n');
    const footer = koloqua ? `\n\nTap any source below to read full text o! You wan make I break am down more simple in Koloqua? Just tell me!` : `\n\nTap any **source** below to read the full text. Want plain-English summary? Just say “summarize ${results[0].title} simply”.`;
    const full = header + bullets + footer;
    return { content: full, sources: results };
  }

  const send=(text:string)=>{
    try {
      if(!text.trim()||typing) return;
      stopSpeak();
      const user:Message={id:Date.now().toString(), role:'user', content:text.trim(), timestamp:new Date()};
      setMessages(m=>[...m,user]);
      setInput(''); setTyping(true); setStream('');
      const results=searchDocs(text);
      const payload=buildReply(text,results);
      let idx=0; const full=payload.content;
      const iv=setInterval(()=>{
        idx+=Math.ceil(full.length/30);
        if(idx>=full.length){
          clearInterval(iv);
          const aiMsg:Message={id:(Date.now()+1).toString(), role:'assistant', content:full, sources:payload.sources, timestamp:new Date()};
          setMessages(m=>[...m,aiMsg]);
          setStream(''); setTyping(false);
          // Auto-speak in Koloqua if enabled
          if (koloqua) setTimeout(()=> speak(full, aiMsg.id), 400);
        } else setStream(full.slice(0,idx));
      },16);
    } catch(e){
      setTyping(false); setStream('');
      setMessages(m=>[...m,{id:Date.now().toString(), role:'assistant', content: koloqua ? toKoloqua(`I deh here! Something small go wrong, but try again — e.g. “Land Rights Act 2018”.`) : `Something went wrong, but I’m still here. Try “Land Rights Act 2018”.`, timestamp:new Date()}]);
    }
  };

  const displayContent = (content: string) => {
    // If Koloqua off, show as is; if on and content not yet Koloqua, transform
    // Messages already stored transformed when koloqua was on, but toggle should affect display
    // For simplicity, if koloqua false and message contains Koloqua header, we leave it; user can toggle for next messages
    return content;
  };

  return (
    <div className="ai-page">
      <div className="ai-page__inner">
        <div className="ai-header">
          <div className="ai-header__left">
            <span className="ai-header__icon"><img src="/liberiaFlag.png" alt="Liberia" style={{width:22, height:14, objectFit:'cover', borderRadius:2, border:'1px solid rgba(0,0,0,0.1)'}} /></span>
            <div>
              <span className="ai-header__title">LegalCore AI — Knows all. Sees all. 🇱🇷</span>
              <span className="ai-header__sub">{documents.length} laws • 1847–2026 • Liberia Flag • Koloqua voice</span>
            </div>
          </div>
          <div className="ai-header__right">
            <button className={`ai-koloqua-toggle ${koloqua?'ai-koloqua-toggle--on':''}`} onClick={()=>{ setKoloqua(v=>!v); stopSpeak(); }} title="Koloqua Liberia accent">
              <Mic size={12}/> {koloqua ? 'Koloqua ON' : 'Koloqua OFF'}
            </button>
            <button className="ai-clear" onClick={()=>{ setMessages([]); stopSpeak(); }}><Trash2 size={14}/> Clear</button>
          </div>
        </div>

        <div className="ai-helper">
          <Lightbulb size={14}/> <strong>Liberia voice o!</strong> {koloqua ? 'Koloqua ON — I go answer in Liberian Koloqua and I can talk out loud. Tap 🔊 to hear me.' : 'Toggle Koloqua ON to hear me in Liberian accent.'} Example: “Wetin Land Rights Act tok?” → <strong>Send</strong>.
        </div>

        <div className="ai-trust">
          <span><ShieldCheck size={12}/> Grounded</span><span><Scale size={12}/> Cited</span><span><FileText size={12}/>{documents.length} sources</span><span style={{marginLeft:'auto', display:'flex', gap:6, alignItems:'center'}}><img src="/liberiaFlag.png" alt="" style={{width:18, height:12, objectFit:'cover', borderRadius:2}}/> Liberia Flag • Red White Blue with Star</span>
        </div>

        {!hasMessages ? (
          <div className="ai-empty">
            <div className="ai-empty__icon"><img src="/liberiaFlag.png" alt="Liberia" style={{width:32, height:20, objectFit:'cover', borderRadius:3}} /></div>
            <h1>Ask Liberian law — I go answer you in Koloqua o!</h1>
            <p>Every answer from real documents (1847–2026). I show sources. Tap 🔊 to hear my Liberia voice. No French flag — na <strong>Liberia Flag 🇱🇷</strong> with 11 stripes & star!</p>
            <div className="ai-suggestions">
              {suggestions.map(s=>(
                <button key={s} className="ai-suggestion" onClick={()=>send(s)}>
                  <Lightbulb size={14}/><span>{s}</span><ExternalLink size={12}/>
                </button>
              ))}
            </div>
            <p className="ai-empty__note">Try Koloqua: “Wetin da Land Rights Act say about customary land?” — I go answer and talk!</p>
          </div>
        ) : (
          <div className="ai-messages">
            {messages.map(m=>(
              <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
                <span className={`ai-msg__avatar ${m.role==='assistant'?'ai-msg__avatar--ai':''}`}>{m.role==='user'?<User size={14}/>:<Bot size={14}/>}</span>
                <div className="ai-msg__bubble">
                  <div className="ai-msg__text" dangerouslySetInnerHTML={{__html: displayContent(m.content).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/>
                  {m.sources && m.sources.length>0 && (
                    <div className="ai-sources">
                      <span className="ai-sources__label">Sources — tap to read full text:</span>
                      <div className="ai-sources__grid">
                        {m.sources.map(doc=>{
                          const Icon=typeIcons[doc.type]||FileText;
                          return (
                            <Link key={doc.id} to={`/document/${doc.id}`} className="ai-source">
                              <span className={`ai-source__tag ai-source__tag--${doc.type}`}><Icon size={11}/>{doc.type} • {doc.year}</span>
                              <strong>{doc.title}</strong>
                              <span>{doc.summary.slice(0,90)}…</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {m.role==='assistant' && (
                    <div className="ai-msg__actions">
                      <button className="ai-copy" onClick={async()=>{ await navigator.clipboard.writeText(m.content); setCopied(m.id); setTimeout(()=>setCopied(null),1200);}}>
                        {copied===m.id ? <Check size={12}/> : <Copy size={12}/>}{copied===m.id ? 'Copied' : 'Copy'}
                      </button>
                      <button className={`ai-speak ${speakingId===m.id?'ai-speak--active':''}`} onClick={()=>speak(m.content, m.id)} title={koloqua ? "Talk in Koloqua" : "Talk"}>
                        {speakingId===m.id ? <VolumeX size={12}/> : <Volume2 size={12}/>}{speakingId===m.id ? 'Stop' : 'Talk in Koloqua 🇱🇷'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="ai-msg ai-msg--assistant">
                <span className="ai-msg__avatar ai-msg__avatar--ai"><Bot size={14}/></span>
                <div className="ai-msg__bubble">
                  {stream ? <div className="ai-msg__text" dangerouslySetInnerHTML={{__html: stream.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}}/> : <div className="ai-typing"><span/><span/><span/> Reading {documents.length} Liberia laws…</div>}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
        )}

        <div className="ai-input">
          <div className="ai-input__field">
            <Search size={16} className="ai-input__icon"/>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(input)} placeholder={koloqua ? "Ask in Koloqua — e.g. Wetin Land Rights Act tok?" : "Ask anything — e.g. Land Rights Act 2018"} aria-label="Ask AI" />
            <button className="ai-input__send" onClick={()=>send(input)} disabled={!input.trim()||typing}><Send size={16}/><span>Send</span></button>
          </div>
          <p className="ai-input__helper">Press <strong>Enter</strong> to send • Toggle <strong>Koloqua</strong> for Liberia accent • Tap 🔊 to hear voice • 🇱🇷 Liberia Flag</p>
        </div>
      </div>
    </div>
  );
}
