/**
 * Plans & the Pro roadmap.
 *
 * Everything the site does today is FREE and stays free — reading the law is a public
 * good. Revenue comes from *workflow* features professionals will pay for. Each Pro
 * feature below ships to the /plans page with an "I'd pay for this" button; votes land
 * in `feature_interest` so we build what has demand, in order.
 *
 * `paywall_enabled` (app_config) is the single switch that turns Pro gating on later.
 */

export type Audience = 'lawyer' | 'firm' | 'student' | 'business' | 'government' | 'developer';

export interface ProFeature {
  key: string;
  title: string;
  blurb: string;
  /** The pain it removes — say it the way the customer would. */
  problem: string;
  audience: Audience[];
  /** Rough monthly value anchor, USD. Used for copy only — pricing is decided later. */
  anchorUsd: number;
  status: 'planned' | 'building' | 'beta';
}

export const FREE_FEATURES = [
  'Full-text search across every instrument, misspellings included',
  'Every law, case and opinion — read, copy, print, PDF',
  'AI assistant trained per country (English / French / Portuguese)',
  'Compare provisions across ECOWAS states',
  'Saved library & brief builder, synced across devices when signed in',
  'Report a correction on any document',
  'Courts map and jurisdiction guide',
];

export const PRO_FEATURES: ProFeature[] = [
  {
    key: 'citation_alerts',
    title: 'Citation & amendment alerts',
    blurb: 'Get emailed the day a law you rely on is amended, repealed, or cited in a new judgment.',
    problem: 'I filed a brief citing a section that had been amended two months earlier.',
    audience: ['lawyer', 'firm', 'government'], anchorUsd: 15, status: 'planned',
  },
  {
    key: 'team_library',
    title: 'Firm workspace',
    blurb: 'Shared libraries, briefs and annotations for your whole chambers, with roles.',
    problem: 'Every associate re-researches the same authorities from scratch.',
    audience: ['firm'], anchorUsd: 49, status: 'planned',
  },
  {
    key: 'memo_drafting',
    title: 'AI memo & pleading drafts with pinned citations',
    blurb: 'Turn a brief into a first-draft memorandum where every proposition links to the exact section.',
    problem: 'Drafting the first version of a legal memo takes me a full day.',
    audience: ['lawyer', 'firm', 'student'], anchorUsd: 25, status: 'planned',
  },
  {
    key: 'offline_pack',
    title: 'Offline country pack',
    blurb: 'Download an entire jurisdiction to your phone or laptop. Works in court basements and upcountry.',
    problem: 'No signal at the courthouse; I need the statute now.',
    audience: ['lawyer', 'student', 'government'], anchorUsd: 8, status: 'planned',
  },
  {
    key: 'letterhead_export',
    title: 'Branded exports (Word & PDF)',
    blurb: 'Export briefs and authorities on your firm letterhead, in Word, with a table of authorities.',
    problem: 'I copy-paste into Word and rebuild the formatting every time.',
    audience: ['lawyer', 'firm'], anchorUsd: 10, status: 'planned',
  },
  {
    key: 'compliance_checklists',
    title: 'Business compliance checklists',
    blurb: 'Per-country checklists: registering a company, tax filings, labour law, licences — with the source law linked.',
    problem: "I'm opening in Ghana and Liberia and don't know what I'm required to file.",
    audience: ['business'], anchorUsd: 29, status: 'planned',
  },
  {
    key: 'api_access',
    title: 'Developer API',
    blurb: 'Search, retrieve and cite West African law programmatically. Build legal-tech on top of LegalCore.',
    problem: 'We want to embed statute lookup into our own product.',
    audience: ['developer', 'firm'], anchorUsd: 99, status: 'planned',
  },
  {
    key: 'exam_mode',
    title: 'Student exam mode',
    blurb: 'Flashcards, past-question drills and case summaries per course, generated from the actual law.',
    problem: 'Law school materials are photocopies of photocopies.',
    audience: ['student'], anchorUsd: 5, status: 'planned',
  },
  {
    key: 'court_calendar',
    title: 'Court rules & deadline calculator',
    blurb: 'Compute filing deadlines from the applicable rules of court and add them to your calendar.',
    problem: 'Missed a limitation period because I counted days wrong.',
    audience: ['lawyer', 'firm'], anchorUsd: 12, status: 'planned',
  },
];

export const AUDIENCE_LABEL: Record<Audience, string> = {
  lawyer: 'Lawyers', firm: 'Law firms', student: 'Students', business: 'Businesses', government: 'Government', developer: 'Developers',
};
