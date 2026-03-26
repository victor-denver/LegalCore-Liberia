import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Scale, AlertTriangle } from 'lucide-react';
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

const mockResponses: Record<string, string> = {
  'land rights': `**Land Rights Act of 2018 — Key Provisions:**

The Land Rights Act of 2018 is one of the most transformative pieces of legislation in Liberian history. Here are its core provisions:

**1. Four Categories of Land Ownership:**
- **Customary Land** — owned by communities based on traditional practices
- **Government Land** — owned by the Government of Liberia
- **Private Land** — owned by individuals or entities
- **Public Land** — held in trust for public use

**2. Community Land Rights:**
- Communities can own customary land as a legal entity (first time in Liberian history)
- No customary land can be taken without free, prior, and informed consent

**3. Women's Land Rights:**
- Women have equal rights to own, use, and manage land
- Discriminatory customary practices are prohibited

**4. Historical Significance:**
This Act ended over 170 years of indigenous land dispossession that began with the founding of Liberia in 1847.

*Sources: Land Rights Act of 2018, Sections 1.1–4.2*`,

  'due process': `**Due Process Rights under the 1986 Constitution:**

Article 20 of the 1986 Constitution guarantees due process. The Supreme Court in *Cabral v. Republic* (1988) established these minimum requirements:

1. **Adequate notice** of charges or claims
2. **Meaningful opportunity to be heard**
3. **Impartial tribunal**
4. **Right to present evidence** and confront witnesses
5. **Decision based on evidence** presented

The Court also held that due process is both **procedural** (fair process) and **substantive** (government cannot act arbitrarily).

Article 21 further prohibits torture and inhumane treatment.

*Sources: Constitution of Liberia (1986), Articles 20-21; Cabral v. Republic (1988)*`,

  'domestic violence': `**Domestic Violence Law in Liberia:**

The **Domestic Violence Act of 2019** provides comprehensive protections:

**Covered Acts:**
- Physical abuse (assault, battery)
- Sexual abuse (non-consensual acts)
- Psychological abuse (intimidation, threats, stalking)
- Economic abuse (withholding finances, destroying property)

**Penalties:**
- Domestic violence: up to **5 years imprisonment**
- Aggravated domestic violence: up to **10 years**
- Violation of protection order: up to **2 years**

**Protection Orders:**
- Victims can apply to Magistrate or Circuit Court
- Emergency orders can be issued without the abuser present
- Violating a protection order is a criminal offense

**Support Services:**
The Government is required to establish shelters and support services.

*Sources: Domestic Violence Act of 2019, Sections 1-5*`,

  'maritime': `**Liberia's Maritime Registration Laws:**

Liberia has one of the world's **largest ship registries** (second globally by tonnage), established by the **Maritime Law of 1948**.

**Key Points:**

1. **Open Registry System:** Any vessel owned by a Liberian corporation can register under the Liberian flag
2. **Liberia Maritime Authority (LiMA):** Sole authority for maritime administration (revised 2020)
3. **International Compliance:** All vessels must meet SOLAS, MARPOL, STCW, and MLC standards
4. **Revenue Allocation:** 60% to consolidated fund, 25% to LiMA operations, 15% to development

**Economic Impact:**
Maritime registration is one of Liberia's most significant revenue sources, generating hundreds of millions annually.

*Sources: Maritime Law of 1948; Liberia Maritime Authority Act (2020)*`,

  'default': `Thank you for your question. Based on my analysis of Liberian legal sources, here is what I can tell you:

This is a complex area of Liberian law. I recommend reviewing the relevant statutes and case law in our database for the most authoritative guidance.

**Suggested next steps:**
1. Search our database for related statutes and cases
2. Review the specific provisions referenced in the citations
3. Consult with a licensed Liberian attorney for specific legal advice

**Disclaimer:** This AI provides general legal information about Liberian law. It does not constitute legal advice. Always consult a qualified attorney for specific legal matters.

*Browse our full library of 384+ documents spanning 1847-2026.*`,
};

function getAIResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('land right')) return mockResponses['land rights'];
  if (q.includes('due process') || q.includes('constitution') && q.includes('right')) return mockResponses['due process'];
  if (q.includes('domestic violence') || q.includes('protection order')) return mockResponses['domestic violence'];
  if (q.includes('maritime') || q.includes('shipping') || q.includes('vessel')) return mockResponses['maritime'];
  return mockResponses['default'];
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
