import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Scale, AlertTriangle } from 'lucide-react';
import { documents, type LegalDocument } from '../data/legalData';
import './AIAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions = [
  'What are the key provisions of the Land Rights Act of 2018?',
  'Explain due process rights under the 1986 Constitution',
  'What penalties apply for domestic violence in Liberia?',
  'Summarize Liberia\'s maritime registration laws',
  'What is the process for registering customary land?',
  'Explain the role of the Truth and Reconciliation Commission',
];

function isGreeting(query: string): boolean {
  return /^(hi|hello|hey|good (morning|afternoon|evening)|what's up|yo)$/i.test(query.trim());
}

function searchDocuments(query: string): LegalDocument[] {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return [];

  const score = (doc: LegalDocument) => {
    let total = 0;
    const haystack = `${doc.title} ${doc.summary} ${doc.body}`.toLowerCase();
    terms.forEach((term) => {
      if (haystack.includes(term)) total += 2;
      if (doc.tags.some((tag) => tag.includes(term))) total += 1;
      if (doc.citations.some((citation) => citation.toLowerCase().includes(term))) total += 1;
    });
    if (doc.category.includes(terms[0])) total += 1;
    return total;
  };

  return documents
    .map((doc) => ({ doc, score: score(doc) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ doc }) => doc);
}

function formatDocumentResponse(results: LegalDocument[], query: string): string {
  if (results.length === 0) {
    return `I couldn't find a close match in the Liberian legal library for "${query}".

Try asking about a law, court case, or specific legal topic like "Land Rights Act 2018", "due process rights", or "maritime registration".`;
  }

  const items = results
    .map((doc) => `**${doc.title}** (${doc.date})\n${doc.summary}`)
    .join('\n\n');

  return `Here are the most relevant Liberian legal documents I found for your question:\n\n${items}\n\nIf you want, I can summarize one of these results in more detail.`;
}

function getAIResponse(query: string): string {
  const trimmed = query.trim();
  if (isGreeting(trimmed)) {
    return `Hi there! I'm LegalCore AI, your Liberian law assistant. Ask me about statutes, court cases, or legal topics such as land rights, due process, maritime law, or customary law, and I'll search the library for the best matches.`;
  }

  const results = searchDocuments(query);
  return formatDocumentResponse(results, query);
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  return (
    <div className="ai-page">
      <div className="ai-page__inner">
        {messages.length === 0 ? (
          <div className="ai-empty">
            <div className="ai-empty__icon">
              <Sparkles size={32} />
            </div>
            <h1 className="ai-empty__title">Legal AI Assistant</h1>
            <p className="ai-empty__text">
              Ask questions about Liberian law. I can help you understand statutes,
              explain case rulings, and summarize legal opinions.
            </p>

            <div className="ai-empty__disclaimer">
              <AlertTriangle size={14} />
              <span>AI-generated responses are for informational purposes only and do not constitute legal advice.</span>
            </div>

            <div className="ai-suggestions">
              {suggestions.map((s) => (
                <button key={s} className="ai-suggestion" onClick={() => sendMessage(s)}>
                  <Scale size={14} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-msg ai-msg--${msg.role}`}>
                <div className="ai-msg__avatar">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="ai-msg__content">
                  <div className="ai-msg__role">
                    {msg.role === 'user' ? 'You' : 'LegalCore AI'}
                  </div>
                  <div className="ai-msg__text" dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-msg ai-msg--assistant">
                <div className="ai-msg__avatar"><Bot size={16} /></div>
                <div className="ai-msg__content">
                  <div className="ai-msg__role">LegalCore AI</div>
                  <div className="ai-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="ai-input-area">
          <div className="ai-input-wrap">
            <input
              type="text"
              className="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about Liberian law..."
            />
            <button className="ai-send" onClick={() => sendMessage(input)} disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
