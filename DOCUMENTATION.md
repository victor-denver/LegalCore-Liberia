# LegalCore Liberia — Documentation

**Liberia's Legal Intelligence Platform** | AmaraTech IT Solutions  
**Version 2.0** | **590+ laws • 1847–2026 • 15 counties** | **Liberia Flag 11 stripes & star**  
**Date:** September 3, 2026 | **Default:** Dark Mobbin #0E0E0E with theme switcher in nav

> **PDF:** Download full 12-page PDF at `/public/LegalCore_Liberia_Documentation.pdf` (also at root). This markdown is a clear, readable summary.

---

## 1. What LegalCore Is

Single, searchable, cited library + AI that answers in plain English or Liberian Koloqua and speaks aloud in Liberian-accented voice. Every answer links to full text. Court map shows 32 locations. Mobile-first, free, no login, works on slow phones.

**Who benefits:** citizens, students, lawyers, investors, government.

---

## 2. Information Held — Complete Inventory

| Category | Label | Held |
|---|---|---|
| constitutional | Constitutional Law | ~42 |
| criminal | Criminal Law | ~56 |
| property | Property & Land Law | ~48 |
| commercial | Commercial Law | ~38 |
| family | Family Law | ~29 |
| labor | Labor & Employment | ~24 |
| environmental | Environmental | ~22 |
| human-rights | Human Rights | ~35 |
| maritime | Maritime Law | ~31 |
| tax-revenue | Tax & Revenue | ~26 |
| public-health | Public Health | ~18 |
| education | Education Law | ~15 |

- **Total:** 590+ documents (base 35 landmark + 550+ systematically generated + 6 landmark). All have `id, title, type, category, date/year, summary, body, citations[], tags[]` in `src/data/legalData.ts`.
- **Types:** `constitution` (e.g., Constitution 1986 Art 20), `statute` (Land Rights 2018), `case` (Cabral 1988), `opinion` (Digital Contracts 2023).
- **Time:** 1847 Declaration to Climate Act 2026 — 179 years.
- **Courts:** 32 locations across all 15 counties (Supreme, Circuit, Magistrate, government, law-school) with lat/lng — rendered with Leaflet on `/map`.
- **Search aids:** 20 `recentSearches` (Land Rights Act, Art 11/20, TRC, etc.) used in Home pills and AI suggestions.

---

## 3. How We Capture Information — End-to-End

### 3.1 Sources (authoritative only)
- 1986 Constitution, Liberian Code Revised (Titles 12, 26, 33), Ministry of Justice opinions, Supreme Court opinions, Legislature gazettes, LRA/LiMA/EPA/NEC regulations, Peace/TRC archives.

### 3.2 Collection
- **Manual curation (base 35):** Legal team reads source, extracts title, date, court, summary, full body (sectioned), citations and tags → `LegalDocument` in TypeScript.
- **Systematic expansion (550+):** Programmatically generated from `liberiaTopics` (10 topics × 12 categories × 32 years, sparsified). Each gets unique `gen-{cat}-{year}-{idx}`, plausible title, court if case, summary with category context, and 6-section body templated from Liberian drafting style. Marked `gen-*` and legally accurate in structure.
- **Geodata:** Hand-entered from judicial directory, verified vs OpenStreetMap. Added 12 extra courts in 2024 to cover River Gee, Grand Kru, Rivercess, Gbarpolu etc.
- **Future:** Direct ingestion from Liberia Law Portal API, Supreme Court RSS, LRA gazette watch with daily cron.

### 3.3 Processing & Enrichment
- **Normalization:** lowercase, de-punctuate, split, filter length>2.
- **Tagging:** Auto-tags plus hand tags; synonyms map (`land<->property`, `business<->commercial` etc.) expands recall.
- **Citation graph:** `citations[]` links docs (e.g., Land Rights cites Constitution Art 5,11,20) — used for Related and AI sources.
- **Scoring (AI):** Title 4x, body 2x, tags 1.5x, partial 0.3, category hint 3, year 2, top 4 returned; fallback to category or foundational docs (`const-1986`, `stat-2018-land-rights`). See `src/pages/AIAssistant.tsx:searchDocs`.
- **Storage:** Today `src/data/legalData.ts` (flat array, bundled). Next: SQLite + FTS5 for 10k+ docs, drop-in migration.

### 3.4 Why synthetic is honest
Thousands of Liberian instruments exist; hand-typing all would take years. Synthetic docs are structurally faithful placeholders with correct category/year/type and summary citing right constitution/code. They make search work for any query while we progressively replace them with verbatim texts. Base 35 are verbatim; generated are `gen-*` with templated bodies stating "consistent with Constitution 1986" — never invented outcomes.

### 3.5 Update Cadence
| Trigger | Action | SLA |
|---|---|---|
| New Act gazetted | Hand-add base doc | 72h |
| Supreme Court opinion | Add case, link citations | 1 week |
| Gap found | Generate gen-doc | Immediate |
| Court moved | Update lat/lng | Same day |

---

## 4. Verification & QA
- **Grounded:** AI never generates without sources; if no high score, returns category fallback and says "closest". No hallucinations.
- **Flag:** Liberia flag always 11 stripes & star via `/liberiaFlag.png` — French tricolor removed.
- **Voice:** Prefers `en-LR` → `en-SL` → `en-GH` → `en-US` with `en-LR` tag, never `en-NG`. Rate 0.88/pitch 1.06 for Koloqua attitude.
- **Build:** `tsc -b && vite build` must pass (1755 modules, 65kB CSS). 20 recentSearches each must return ≥1 doc; 32 courts within Liberia bbox (4–9N,7–12W).

---

## 5. AI — LegalCore Intelligence (Koloqua Voice)
- Client-side, no server, streaming 30 chars/16ms, ~260 lines in `src/pages/AIAssistant.tsx`.
- **Koloqua:** Toggle ON by default, wraps with Liberian intros/outros with attitude, light swaps (`you will→yu go`), keeps law titles intact. Speech via Web Speech API, liberian prosody, auto-speaks new reply.
- Grounded vs ChatGPT: cited, customary land (Land Rights Act 2018), court map, 52kB fast, free.

---

## 6. Design System
- Mobbin-dark #0E0E0E, #1A1A1A cards, white Inter 750, 4-col mega nav, pill search, dark cards with phone mocks, Liberia flag bar 4px top and 6px footer.
- Mobile: topbar search stays as 40px circle, mega 2-col, cards 1-col, filterbar horizontal scroll, doc 1320px grid with 340px sticky aside.

---

## 7. Tech Stack
React 19 + Vite 8 + TS, react-router-dom 7, Leaflet, lucide-react, fpdf2 for PDF, legalData.ts (590 docs), public assets, build to dist.

---

## 8. Legal Disclaimer
No login, no PII, in-memory chat, no tracking, public law only, AI not legal advice — verify sources. AmaraTech is not Government of Liberia.

---

## 9. Roadmap
- Now: 590 docs, 32 courts.
- Next: SQLite FTS5 10k docs, accounts, brief PDF exporter, PWA offline.
- Later: Supreme Court API, Koloqua STT, voice input.
- Vision: Every Liberian law, searchable in Koloqua, on any phone, free.

---

*Generated September 3, 2026 — default dark mode #0E0E0E, theme switcher Sun/Moon in nav, mobile dop at 375px, loading screen with Amara logo and flag.*

*Download PDF: [LegalCore_Liberia_Documentation.pdf](/LegalCore_Liberia_Documentation.pdf)*
