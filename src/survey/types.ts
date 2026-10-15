export type Tier = 'bronze' | 'silver' | 'gold';
export type Sector = 'domestic' | 'commercial';

/** 1 — Immediate, 2 — Urgent, 3 — Planned, 4 — Routine (template Section 8 scale). */
export type Priority = 1 | 2 | 3 | 4;

/** Drives colour and whether an answer counts against the property. */
export type Tone = 'good' | 'fair' | 'poor' | 'bad' | 'neutral';

export interface FindingSpec {
  priority: Priority;
  /** Wording for the further-investigation schedule. Never recommends — states what would be required. */
  text: string;
  /** Counts towards "key storm vulnerabilities" in the summary. */
  storm?: boolean;
}

export interface Option {
  id: string;
  label: string;
  /** Report wording inserted when this option is chosen. `{subject}` is replaced with the group subject. */
  wording?: string;
  /** Short noun phrase used when several options of a multi-select are joined into one sentence. */
  phrase?: string;
  tone?: Tone;
  finding?: FindingSpec;
  sectors?: Sector[];
}

export type QuestionType = 'single' | 'multi' | 'yesno' | 'condition' | 'number' | 'text';

export interface ShowIf {
  questionId: string;
  equals: string | string[];
}

export interface Question {
  id: string;
  label: string;
  /** Full question as asked on site, e.g. "Are there slipped, cracked or missing slates?" */
  prompt?: string;
  type: QuestionType;
  options?: Option[];
  unit?: string;
  placeholder?: string;
  help?: string;
  sectors?: Sector[];
  showIf?: ShowIf;
  /** Sent to the AI scan so it can suggest an answer from photos. */
  ai?: boolean;
  /** Multi-select sentence frame, e.g. "The ceiling comprises {list}." */
  frame?: string;
}

export interface Group {
  id: string;
  title: string;
  /** Lower-case subject used inside wording, e.g. "rainwater goods". */
  subject: string;
  icon: string;
  intro?: string;
  questions: Question[];
  photoPrompt?: string;
  minPhotos?: number;
  /** Template Section 7 element paragraph, added when condition is Fair or worse. */
  elementWording?: string;
  storm?: boolean;
  sectors?: Sector[];
}

export type SectionId =
  | 'details'
  | 'roof'
  | 'external'
  | 'outbuildings'
  | 'rooms'
  | 'internal'
  | 'assessment'
  | 'findings'
  | 'summary';

export interface SectionDef {
  id: SectionId;
  title: string;
  short: string;
  icon: string;
  blurb: string;
  tiers: Tier[];
}

// ─── Stored data ────────────────────────────────────────────────────────────

export type AnswerValue = string | string[] | number | null;

export interface Answer {
  value: AnswerValue;
  note?: string;
  /** Set when the value came from an AI scan and has not been changed since. */
  ai?: { confidence: 'high' | 'medium' | 'low'; reason: string };
}

export type Answers = Record<string, Answer>;

export type PhotoOwner =
  | { kind: 'group'; id: string }
  | { kind: 'room'; id: string }
  | { kind: 'outbuilding'; id: string }
  | { kind: 'general' };

export interface Photo {
  id: string;
  /** Relative to the photos directory: `<inspectionId>/<photoId>.jpg`. */
  file: string;
  /** Smaller copy used inside the PDF. */
  reportFile: string;
  width: number;
  height: number;
  caption: string;
  owner: PhotoOwner;
  takenAt: number;
}

export type Severity = 'minor' | 'moderate' | 'significant';

export interface Defect {
  id: string;
  description: string;
  location: string;
  severity: Severity;
  source: 'ai' | 'manual';
}

export interface Room {
  id: string;
  name: string;
  type: string;
  level: string;
  length?: number;
  width?: number;
  height?: number;
  answers: Answers;
  defects: Defect[];
  observations: string;
  aiScannedAt?: number;
  aiWarning?: string | null;
}

export type ElementCondition = 'good' | 'fair' | 'poor' | 'defective' | 'not-visible' | 'na';
export type OverallCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'unsatisfactory' | 'na';

export interface Outbuilding {
  id: string;
  type: string;
  label: string;
  length?: number;
  width?: number;
  height?: number;
  roof?: ElementCondition;
  walls?: ElementCondition;
  condition?: OverallCondition;
  description: string;
}

export interface ActionItem {
  id: string;
  priority: Priority;
  area: string;
  action: string;
  evidence: string;
}

export interface FindingOverride {
  priority?: Priority;
  dismissed?: boolean;
}

export interface Instruction {
  claimNumber: string;
  policyNumber: string;
  client: string;
  policyholderName: string;
  policyholderPhone: string;
  policyholderEmail: string;
  addressLine1: string;
  addressLine2: string;
  town: string;
  postcode: string;
  inspectionDate: string; // ISO yyyy-mm-dd
  inspector: string;
}

export type Rating = 'excellent' | 'good' | 'fair' | 'poor' | 'unsatisfactory';

export interface Summary {
  rating?: Rating;
  keyVulnerabilities?: string;
  priorityActions?: string;
  inspectorSummary?: string;
  signedBy?: string;
  signedAt?: number;
  /** SVG path data of the drawn signature, in a 300×120 box. */
  signature?: string;
}

export type InspectionStatus = 'in_progress' | 'complete';

export interface Inspection {
  id: string;
  ref: string;
  tier: Tier;
  sector: Sector;
  status: InspectionStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  instruction: Instruction;
  /** Keyed `${groupId}.${questionId}`. */
  answers: Answers;
  groupNotes: Record<string, string>;
  /** AI observations per external group. */
  groupObservations: Record<string, string>;
  photos: Photo[];
  rooms: Room[];
  outbuildings: Outbuilding[];
  actions: ActionItem[];
  findingOverrides: Record<string, FindingOverride>;
  summary: Summary;
}
