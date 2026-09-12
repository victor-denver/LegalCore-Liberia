import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, ExternalLink, Lightbulb } from 'lucide-react';
import { documents } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { useJurisdiction } from '../hooks/useJurisdiction';
import './ComparePage.css';

const allDocs = [...documents, ...ecowasCommunityDocs];
const exists = (id: string) => allDocs.some((d) => d.id === id);
const firstExisting = (ids: string[]): string | null => ids.find(exists) ?? null;
const titleOf = (id: string | null) => (id ? allDocs.find((d) => d.id === id)?.title ?? id : '—');

interface CompareRow {
  dim: string;
  a: string;
  b: string;
  citeA: string[];
  citeB: string[];
}
interface CompareTopic {
  id: string;
  label: string;
  intro: string;
  sideA: string[];
  sideB: string[];
  rows: CompareRow[];
}

const TOPICS: CompareTopic[] = [
  {
    id: 'land',
    label: 'Land tenure',
    intro: 'Who can own land — and how communities prove it.',
    sideA: ['stat-2018-land-rights', 'stat-2003-inheritance'],
    sideB: ['ecowas-land-guidelines'],
    rows: [
      {
        dim: 'Ownership model',
        a: 'Four statutory categories — Customary, Government, Private, Public. Communities own customary land as legal persons (Land Rights Act 2018).',
        b: 'Mixed across the region: Ghana stool/skin lands, Nigeria governor-held trust (Land Use Act 1978), francophone state-domain + titre foncier. Liberia\'s community-ownership model is the region\'s strongest.',
        citeA: ['stat-2018-land-rights'], citeB: ['ecowas-land-guidelines'],
      },
      {
        dim: 'Community consent',
        a: 'No customary land taken without free, prior and informed consent (FPIC); formalization by community self-identification.',
        b: 'FPIC is best practice region-wide (2022 Sierra Leone Customary Land Rights Act; OHADA commercial leases need title-holder consent) but rarely full ownership.',
        citeA: ['stat-2018-land-rights'], citeB: ['ecowas-land-guidelines'],
      },
      {
        dim: "Women's rights",
        a: 'Equal rights to own, use and manage land; discriminatory custom void (2018, §4). Surviving customary spouses inherit ⅓ since 2003.',
        b: 'Constitutional equality is region-wide, but enforcement in customary tenure lags most neighbours — Liberia leads on paper.',
        citeA: ['stat-2018-land-rights', 'stat-2003-inheritance'], citeB: ['ecowas-land-guidelines'],
      },
      {
        dim: 'Where to verify title',
        a: 'Liberia Land Authority (LLA) — deeds registry + customary land formalization desk.',
        b: 'Ghana Lands Commission • Nigeria state land registries • francophone Conservation Foncière (titre foncier).',
        citeA: ['stat-2018-land-rights'], citeB: ['ecowas-land-guidelines'],
      },
    ],
  },
  {
    id: 'business',
    label: 'Business formation',
    intro: 'Starting a company: common-law registry vs OHADA uniform acts.',
    sideA: ['opinion-2023-digital', 'case-2018-williams'],
    sideB: ['ohada-company-law-2014', 'ohada-general-commercial-2010'],
    rows: [
      {
        dim: 'Incorporation',
        a: 'Liberia Business Registry (LBR): name search → articles under the Business Corporations Act → TIN from LRA. Electronic agreements enforceable in principle; e-transactions statute recommended.',
        b: 'OHADA: SARL from 100,000 FCFA with model articles, registration at the RCCM confers legal personality — identical process in Senegal, Côte d\'Ivoire, Benin, Togo, Guinea, Guinea-Bissau.',
        citeA: ['opinion-2023-digital'], citeB: ['ohada-company-law-2014'],
      },
      {
        dim: 'Commercial leases',
        a: 'Contract + property law; force-majeure clauses strictly construed against the invoking party (Williams v. NPA, 2018).',
        b: 'OHADA bail à usage professionnel: 3-year minimum protection, renewal rights, eviction compensation (indemnité d\'éviction).',
        citeA: ['case-2018-williams'], citeB: ['ohada-general-commercial-2010'],
      },
      {
        dim: 'Final court for disputes',
        a: 'Commercial Court of Liberia → Supreme Court of Liberia.',
        b: 'National courts apply OHADA law; final appeal on OHADA points goes to the CCJA in Abidjan — directly enforceable in 17 states.',
        citeA: ['case-2018-williams'], citeB: ['ohada-general-commercial-2010'],
      },
    ],
  },
  {
    id: 'tax',
    label: 'Tax & cross-border trade',
    intro: 'Domestic revenue vs moving goods across ECOWAS duty-free.',
    sideA: ['stat-2016-revenue-code', 'land-lra-act'],
    sideB: ['ecowas-etls-customs'],
    rows: [
      {
        dim: 'Domestic tax',
        a: 'Revenue Code: individual 0–25%, corporate 25%, GST 10%, real-property tax; LRA (est. 2013) is sole collector.',
        b: 'Each state keeps its code (Ghana GRA/VAT, Nigeria FIRS/VAT) — but intra-ECOWAS originating goods move at 0% with ETLS approval.',
        citeA: ['stat-2016-revenue-code', 'land-lra-act'], citeB: ['ecowas-etls-customs'],
      },
      {
        dim: 'Importing from outside ECOWAS',
        a: 'Liberia applies the ECOWAS Common External Tariff: 0 / 5 / 10 / 20 / 35% bands by category.',
        b: 'Same CET region-wide since January 2015 — one tariff wall, one market of 400M+ people.',
        citeA: ['stat-2016-revenue-code'], citeB: ['ecowas-etls-customs'],
      },
      {
        dim: 'Investor tip',
        a: 'Register with LRA for a TIN first; ETLS Certificate of Origin is what unlocks duty-free export to Ghana/Nigeria.',
        b: 'Origin rule: wholly-produced, or ≥30% community content / 35% value added.',
        citeA: ['land-lra-act'], citeB: ['ecowas-etls-customs'],
      },
    ],
  },
  {
    id: 'cyber',
    label: 'Cybercrime',
    intro: 'New digital offences, harmonised from one ECOWAS directive.',
    sideA: ['stat-2024-cybercrime'],
    sideB: ['ecowas-criminal-cooperation'],
    rows: [
      {
        dim: 'Core offences',
        a: 'Unauthorized access (≤3 yrs), computer fraud incl. phishing (≤5 yrs), data interference, cyber harassment; digital evidence admissible with chain of custody.',
        b: 'ECOWAS Directive C/DIR.1/08/11 required all states to criminalise the same family: unlawful access, data interference, fraud, child pornography + expedited preservation powers.',
        citeA: ['stat-2024-cybercrime'], citeB: ['ecowas-criminal-cooperation'],
      },
      {
        dim: 'Cross-border help',
        a: 'New LNP Cybercrime Unit; MLA requests via the 1992 ECOWAS Convention + WACAP prosecutor network.',
        b: 'GIABA (Dakar) sets AML/CFT standards; asset recovery cooperation is Treaty-backed.',
        citeA: ['stat-2024-cybercrime'], citeB: ['ecowas-criminal-cooperation'],
      },
    ],
  },
  {
    id: 'courts',
    label: 'Courts & enforcement',
    intro: 'Due process at home, human-rights remedy in Abuja.',
    sideA: ['case-1988-cabral', 'land-1986-art20'],
    sideB: ['ecowas-court-protocol', 'ecowas-revised-treaty-1993'],
    rows: [
      {
        dim: 'Fair-trial floor',
        a: 'Article 20 due process: notice, hearing, impartial tribunal, confrontation (Cabral v. Republic, 1988).',
        b: 'ECOWAS Court hears human-rights claims against member states directly — no exhaustion of local remedies, 3-year filing window.',
        citeA: ['case-1988-cabral', 'land-1986-art20'], citeB: ['ecowas-court-protocol'],
      },
      {
        dim: 'Enforcement',
        a: 'Supreme Court judgments bind all Liberian courts.',
        b: 'ECOWAS Court judgments enforce in member states as superior-court judgments; CCJA judgments self-executing in OHADA states.',
        citeA: ['case-1988-cabral'], citeB: ['ecowas-court-protocol', 'ecowas-revised-treaty-1993'],
      },
    ],
  },
];

function CiteLinks({ ids }: { ids: string[] }) {
  const live = ids.map((id) => ({ id, ok: exists(id) })).filter((x) => x.ok);
  if (!live.length) return null;
  return (
    <span className="cmp-cites">
      {live.map((x) => (
        <Link key={x.id} to={`/document/${x.id}`} title={titleOf(x.id)}>§ {titleOf(x.id).slice(0, 42)}{(titleOf(x.id).length > 42 ? '…' : '')}</Link>
      ))}
    </span>
  );
}

export default function ComparePage() {
  const { active } = useJurisdiction();
  const [topicId, setTopicId] = useState(TOPICS[0].id);
  const topic = useMemo(() => TOPICS.find((t) => t.id === topicId) ?? TOPICS[0], [topicId]);
  const sideADoc = firstExisting(topic.sideA);
  const sideBDoc = firstExisting(topic.sideB);

  return (
    <div className="cmp">
      <div className="cmp__inner">
        <header className="cmp-head">
          <span className="cmp-eyebrow"><GitCompare size={12} /> Compare • Liberia vs ECOWAS / OHADA</span>
          <h1>One question, two systems.</h1>
          <p>Side-by-side packs for investors, students and counsel — every cell cites the instrument. Viewing as <strong>{active.name}</strong>.</p>
          <div className="cmp-topics">
            {TOPICS.map((t) => (
              <button key={t.id} className={t.id === topicId ? 'on' : ''} onClick={() => setTopicId(t.id)}>{t.label}</button>
            ))}
          </div>
        </header>

        <p className="cmp-intro"><Lightbulb size={13} /> {topic.intro}</p>
          <div className="cmp-cols">
            <div className="cmp-col cmp-col--a">
              <span className="cmp-side">Side A • Liberia {sideADoc && <Link to={`/document/${sideADoc}`}><ExternalLink size={11} /></Link>}</span>
              <strong>{titleOf(sideADoc)}</strong>
            </div>
            <div className="cmp-col cmp-col--b">
              <span className="cmp-side">Side B • ECOWAS / OHADA {sideBDoc && <Link to={`/document/${sideBDoc}`}><ExternalLink size={11} /></Link>}</span>
              <strong>{titleOf(sideBDoc)}</strong>
            </div>
          </div>

          <div className="cmp-rows">
            {topic.rows.map((r) => (
              <div key={r.dim} className="cmp-row">
                <h4>{r.dim}</h4>
                <div className="cmp-cells">
                  <div className="cmp-cell cmp-cell--a"><p>{r.a}</p><CiteLinks ids={r.citeA} /></div>
                  <div className="cmp-cell cmp-cell--b"><p>{r.b}</p><CiteLinks ids={r.citeB} /></div>
                </div>
              </div>
            ))}
          </div>
          <p className="cmp-note">Free for everyone — every cell cites the instrument. <Link to="/ai">Ask the AI to go deeper →</Link></p>
      </div>
    </div>
  );
}
