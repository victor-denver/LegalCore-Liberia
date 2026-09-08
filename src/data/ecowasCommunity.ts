/**
 * ECOWAS Community-law corpus.
 * Trained into the WebEngine alongside the national corpus so the engine can
 * answer cross-border / community questions TODAY, before full per-country
 * corpora land (Phase 1–3). All docs carry jurisdiction='ECOWAS'.
 */
import type { LegalDocument } from './legalData';

export type CommunityDocument = LegalDocument & { jurisdiction: string };

export const ecowasCommunityDocs: CommunityDocument[] = [
  {
    id: 'ecowas-revised-treaty-1993',
    title: 'ECOWAS Revised Treaty (1993) — Community Legal Order',
    type: 'constitution',
    category: 'constitutional',
    date: 'July 24, 1993',
    year: 1993,
    jurisdiction: 'ECOWAS',
    summary:
      'Founding community constitution of ECOWAS: free movement of persons, goods and capital, customs union, community citizenship, and supremacy of community acts in their field. Applies in all 12 member states including Liberia.',
    body: `REVISED TREATY OF THE ECONOMIC COMMUNITY OF WEST AFRICAN STATES (ECOWAS)
Signed Cotonou, July 24, 1993.

CHAPTER II — ESTABLISHMENT AND OBJECTIVES
Article 3. The aims of the Community are to promote cooperation and integration, leading to the establishment of an economic union in West Africa.

CHAPTER IV — FREE MOVEMENT
Article 59. Citizens of the Community shall have the right of entry, residence and establishment in the territory of Member States (three-phase protocol: entry, residence, establishment).

CHAPTER V — COMMUNITY ACTS
Supplementary Acts, Regulations (directly applicable), Directives (binding as to result), Decisions and Recommendations. Community law takes precedence in its field of competence.

CHAPTER VI — COMMUNITY COURT OF JUSTICE
Articles 76–77. The Court ensures observance of law and principles of equity in interpretation of the Treaty. Individuals may seize the Court for human-rights violations after exhaustion guidance per Protocol A/P.1/7/91 as amended.`,
    citations: ['ECOWAS Revised Treaty 1993', 'Protocol A/P.1/7/91 on Community Court'],
    tags: ['ecowas', 'revised treaty', 'free movement', 'community law', 'customs union', 'treaty'],
  },
  {
    id: 'ecowas-court-protocol',
    title: 'Protocol on the ECOWAS Community Court of Justice (1991, as amended 2005)',
    type: 'statute',
    category: 'human-rights',
    date: 'July 6, 1991 (amended 2005)',
    year: 2005,
    jurisdiction: 'ECOWAS',
    summary:
      'Establishes the ECOWAS Court in Abuja. Since the 2005 Supplementary Protocol, individuals and corporations have direct access for human-rights claims against member states — no exhaustion of local remedies required.',
    body: `PROTOCOL A/P.1/7/91 ON THE COMMUNITY COURT OF JUSTICE (AS AMENDED BY SUPPLEMENTARY PROTOCOL A/SP.1/01/05)

Article 2. The Court is the principal legal organ of the Community, seated in Abuja, Nigeria.

Article 4. Jurisdiction: interpretation of Treaty, Protocols and Conventions; legality of Community acts; disputes between Member States; liability of Community; human-rights violations occurring in any Member State.

Article 10(d) (2005 amendment). Access: individuals and corporate bodies may bring human-rights cases directly. Application must not be anonymous, must not be pending before another international court, and must be filed within three years of the cause of action.

Remedies: declaratory relief, compensation, orders to cease violations. Judgments are binding and enforceable in Member States as foreign judgments of superior courts.`,
    citations: ['ECOWAS Revised Treaty Art. 76-77', 'Supplementary Protocol A/SP.1/01/05'],
    tags: ['ecowas court', 'community court', 'human rights', 'abuja', 'direct access', 'protocol'],
  },
  {
    id: 'ecowas-free-movement',
    title: 'ECOWAS Free Movement Protocols — Entry, Residence, Establishment',
    type: 'statute',
    category: 'human-rights',
    date: '1979–1990 (three phases)',
    year: 1990,
    jurisdiction: 'ECOWAS',
    summary:
      'Phase I (visa-free 90-day entry with ECOWAS passport/ID), Phase II (right of residence), Phase III (right of establishment for business). A Liberian can enter Ghana, Nigeria or Senegal visa-free for 90 days.',
    body: `ECOWAS FREE MOVEMENT REGIME

Protocol A/P.1/5/79 (Phase I — Entry): Community citizens may enter any Member State visa-free for up to 90 days with valid travel document (passport or biometric ID).

Supplementary Protocol A/SP.1/7/86 (Phase II — Residence): right to reside and take employment, subject to national immigration registration.

Supplementary Protocol A/SP.2/5/90 (Phase III — Establishment): right to establish economic activity, acquire property for business, and be treated no less favourably than nationals.

Safeguards: expulsion only on grounds of national security, public order or morality with due process and notification. ECOWAS Brown Card covers motor-vehicle third-party liability across the region.`,
    citations: ['ECOWAS Revised Treaty Art. 59', 'Protocol A/P.1/5/79'],
    tags: ['free movement', 'visa-free', 'residence', 'establishment', 'ecowas passport', 'brown card'],
  },
  {
    id: 'ohada-general-commercial-2010',
    title: 'OHADA Uniform Act on General Commercial Law (2010, revised)',
    type: 'statute',
    category: 'commercial',
    date: 'December 15, 2010',
    year: 2010,
    jurisdiction: 'ECOWAS',
    summary:
      'Directly applicable business law in the 6 OHADA member states of ECOWAS (Senegal, Côte d’Ivoire, Benin, Togo, Guinea, Guinea-Bissau). Governs traders, commercial register (RCCM), leases, commercial agents, and sale of goods. CCJA in Abidjan is the final court.',
    body: `OHADA UNIFORM ACT ON GENERAL COMMERCIAL LAW (AUDCG, revised December 15, 2010)

BOOK I — TRADER STATUS. Any natural or legal person habitually carrying out commercial acts is a trader; must register in the Registre du Commerce et du Crédit Mobilier (RCCM). Registration creates rebuttable presumption of trader status.

BOOK II — COMMERCIAL REGISTER (RCCM). National registers feed the regional file; registration number required on business documents.

BOOK III — COMMERCIAL LEASE (bail à usage professionnel). Minimum 3-year protection for tenants, renewal rights, eviction compensation (indemnité d’éviction).

BOOK IV — COMMERCIAL INTERMEDIARIES AND SALE. Rules on commission agents, commercial agents, and commercial sale including delivery, conformity, and prescription (2 years for sale disputes).

JURISDICTION: National courts apply OHADA law; final appeal on OHADA matters goes to the Common Court of Justice and Arbitration (CCJA) in Abidjan, whose judgments are directly enforceable in all 17 OHADA states.`,
    citations: ['OHADA Treaty (Port-Louis 1993, revised Quebec 2008)', 'CCJA Rules of Procedure'],
    tags: ['ohada', 'uniform act', 'commercial', 'RCCM', 'commercial lease', 'CCJA', 'francophone'],
  },
  {
    id: 'ohada-company-law-2014',
    title: 'OHADA Uniform Act on Commercial Companies & EIG (2014)',
    type: 'statute',
    category: 'commercial',
    date: 'January 30, 2014',
    year: 2014,
    jurisdiction: 'ECOWAS',
    summary:
      'Company forms for francophone/lusophone ECOWAS: SARL, SA, SAS, SNC, SCS, GIE. SARL minimum capital 100,000 FCFA. Streamlined SARL creation with model articles. Applies in Senegal, Côte d’Ivoire, Benin, Togo, Guinea, Guinea-Bissau.',
    body: `OHADA UNIFORM ACT ON COMMERCIAL COMPANIES AND ECONOMIC INTEREST GROUPS (AUSCGIE, revised January 30, 2014)

FORMS: Société en nom collectif (SNC), Société en commandite simple (SCS), SARL, SA, SAS, GIE.

SARL: 1+ members, minimum capital 100,000 FCFA (may be reduced by national law), model articles permitted, manager (gérant) liable for management faults.

SA: minimum capital 10,000,000 FCFA (public offering) / 1,000,000 FCFA (private), board + statutory auditor (commissaire aux comptes) mandatory above thresholds.

SAS: maximum contractual freedom — president + freely defined governance; increasingly used for startups and subsidiaries.

FORMALITIES: registration at RCCM gives legal personality; publication in legal gazette; ultimate beneficial ownership declaration per national AML rules.`,
    citations: ['OHADA Treaty', 'OHADA Uniform Act on General Commercial Law'],
    tags: ['ohada', 'company', 'SARL', 'SA', 'SAS', 'RCCM', 'incorporation', 'francophone'],
  },
  {
    id: 'ecowas-etls-customs',
    title: 'ECOWAS Trade Liberalisation Scheme (ETLS) & Customs Union',
    type: 'statute',
    category: 'tax-revenue',
    date: '1979 (ETLS) — CET since 2015',
    year: 2015,
    jurisdiction: 'ECOWAS',
    summary:
      'Duty-free movement of originating goods between member states (ETLS certificate of origin) plus the 5-band Common External Tariff (0/5/10/20/35%) on imports from outside ECOWAS. A Liberian exporter to Ghana pays 0% duty with ETLS approval.',
    body: `ECOWAS TRADE LIBERALISATION SCHEME & COMMON EXTERNAL TARIFF

ETLS: wholly-produced goods and manufactured goods with ≥30% community raw-material content (or ≥35% value added) circulate duty-free. Exporter obtains ETLS Certificate of Origin from national approval committee; goods travel with certificate + origin declaration.

CET (in force January 2015): five bands — 0% (essential social goods), 5% (raw materials), 10% (intermediate goods), 20% (finished goods), 35% (specific goods for economic development). Import Declaration Form + ASYCUDA/UNIPASS processing at borders (e.g., Bo Waterside Liberia–Sierra Leone, Elubo Ghana–Côte d’Ivoire).

SAFEGUARDS: safeguard tax, infant-industry protection, and anti-dumping measures permitted under WTO-consistent rules.`,
    citations: ['ECOWAS Revised Treaty Art. 35-40', 'CET Regulation C/REG.1/09/13'],
    tags: ['ETLS', 'customs', 'CET', 'trade', 'certificate of origin', 'duty-free', 'tariff'],
  },
  {
    id: 'ecowas-land-guidelines',
    title: 'ECOWAS / AU Guidance on Land Tenure — Comparative Note for Liberia',
    type: 'opinion',
    category: 'property',
    date: '2023',
    year: 2023,
    jurisdiction: 'ECOWAS',
    summary:
      'Comparative explainer: Liberia’s Land Rights Act 2018 (customary land as full ownership) vs Ghana stool/skin lands, Sierra Leone provincial vs Western Area tenure, Nigeria Land Use Act 1978, and OHADA/francophone state-domain systems. Why Liberia’s model is the region’s strongest community-rights model.',
    body: `COMPARATIVE LAND TENURE NOTE — ECOWAS REGION (2023)

LIBERIA (Land Rights Act 2018): four categories — Customary, Government, Private, Public. Communities own customary land as legal persons; free prior informed consent (FPIC) required; women have equal rights. Strongest statutory community ownership in the region.

GHANA: stool/skin lands (customary) vested in stools, administered by Lands Commission; 1992 Constitution Art. 267. Foreigners limited to ≤50-year leases.

SIERRA LEONE: Western Area (freehold under English conveyancing) vs Provinces (customary tenure under Paramount Chiefs; 1927 Protectorate Land Ordinance; 2022 Customary Land Rights Act strengthens community consent).

NIGERIA: Land Use Act 1978 — all land vested in State Governors in trust; statutory vs customary rights of occupancy; Governor consent required for alienation.

FRANCOPHONE (SN/CI/BJ/TG/GN) + LUSOPHONE (CV/GW): domaine national / state-domain systems; private title mainly via immatriculation (titre foncier); customary use recognised but weaker than Liberia’s ownership model; OHADA governs commercial leases, not rural tenure.

PRACTICAL TAKEAWAY: always verify title at the national registry (Liberia Land Authority; Ghana Lands Commission; Nigeria state land registry; francophone Conservation Foncière) and obtain community consent where customary interests exist.`,
    citations: ['Liberia Land Rights Act 2018', 'Ghana Constitution Art. 267', 'Nigeria Land Use Act 1978', 'OHADA Uniform Act on General Commercial Law'],
    tags: ['land', 'customary', 'comparative', 'ghana', 'nigeria', 'sierra leone', 'ohada', 'tenure'],
  },
  {
    id: 'ecowas-criminal-cooperation',
    title: 'ECOWAS Mutual Legal Assistance & Anti-Money-Laundering (GIABA)',
    type: 'statute',
    category: 'criminal',
    date: '1992 Convention, GIABA 2000',
    year: 2000,
    jurisdiction: 'ECOWAS',
    summary:
      'Cross-border criminal cooperation: 1992 MLA Convention (extradition/service of process), WACAP prosecution network, and GIABA AML/CFT standards. Cybercrime handled under the 2011 ECOWAS Directive on Cybercrime transposed nationally (e.g., Liberia Cybercrime Act 2024).',
    body: `ECOWAS CRIMINAL COOPERATION FRAMEWORK

1992 Convention on Mutual Assistance in Criminal Matters: service of documents, taking of evidence, search/seizure, transfer of proceedings, and extradition for offenses punishable ≥2 years in both states (dual criminality), excluding political offenses.

WACAP (West African Network of Central Authorities and Prosecutors): practitioner channel for fast MLA requests.

GIABA (est. 2000, Dakar): FATF-style regional body — mutual evaluations, typologies, asset-recovery support. Member states criminalise money laundering and terrorist financing; financial intelligence units file STRs.

CYBERCRIME: ECOWAS Directive C/DIR.1/08/11 on Fighting Cybercrime — unlawful access, data interference, computer fraud, child pornography, and procedural powers (expedited preservation, search of stored data). Transposed in Liberia as the Cybercrime and Digital Evidence Act 2024; in Ghana as the Cybersecurity Act 2020; in Nigeria as the Cybercrimes Act 2015 (amended 2024).`,
    citations: ['ECOWAS Convention on MLA 1992', 'ECOWAS Cybercrime Directive C/DIR.1/08/11', 'Liberia Cybercrime Act 2024'],
    tags: ['extradition', 'MLA', 'GIABA', 'money laundering', 'cybercrime', 'WACAP'],
  },
];
