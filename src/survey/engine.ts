/**
 * Turns answers into report content: live property description, per-element wording, progress,
 * the further-investigation schedule, suggested assessments/rating and the drafted summary.
 * Pure functions — no React, no storage — so it is unit-tested directly.
 */
import { FURTHER } from './builders';
import {
  ASSESSMENT,
  CLIENT_STATEMENT,
  EXTERNAL,
  INTERNAL,
  PROFILE,
  ROOF,
  ROOM_QUESTIONS,
  SECTIONS,
  TIERS,
} from './schema';
import type {
  Answer,
  Answers,
  Group,
  Inspection,
  Option,
  Priority,
  Question,
  Rating,
  Room,
  SectionDef,
  SectionId,
  Sector,
  Tier,
  Tone,
} from './types';

// ─── Answer access ──────────────────────────────────────────────────────────

export const key = (groupId: string, questionId: string) => `${groupId}.${questionId}`;

/** Answers for one group, keyed by question id. */
export function groupAnswers(inspection: Inspection, groupId: string): Answers {
  const out: Answers = {};
  const prefix = `${groupId}.`;
  for (const [k, v] of Object.entries(inspection.answers)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  }
  return out;
}

export function isAnswered(a: Answer | undefined): boolean {
  if (!a) return false;
  const v = a.value;
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function single(a: Answer | undefined): string | undefined {
  return a && typeof a.value === 'string' ? a.value : undefined;
}

export function inSector<T extends { sectors?: Sector[] }>(item: T, sector: Sector) {
  return !item.sectors || item.sectors.includes(sector);
}

export function visibleQuestions(questions: Question[], answers: Answers, sector: Sector): Question[] {
  return questions.filter((q) => {
    if (!inSector(q, sector)) return false;
    if (!q.showIf) return true;
    const v = single(answers[q.showIf.questionId]);
    if (v === undefined) return false;
    return Array.isArray(q.showIf.equals) ? q.showIf.equals.includes(v) : q.showIf.equals === v;
  });
}

export function optionsFor(q: Question, sector: Sector): Option[] {
  return (q.options ?? []).filter((o) => inSector(o, sector));
}

export function selectedOptions(q: Question, a: Answer | undefined): Option[] {
  if (!a || !q.options) return [];
  const ids = Array.isArray(a.value) ? a.value : typeof a.value === 'string' ? [a.value] : [];
  return q.options.filter((o) => ids.includes(o.id));
}

// ─── Wording ────────────────────────────────────────────────────────────────

export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const fill = (text: string, subject: string) => text.replaceAll('{subject}', subject);

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** The report sentence(s) a single answer contributes. */
export function questionWording(q: Question, a: Answer | undefined, subject = 'element'): string {
  if (!isAnswered(a)) return '';
  if (q.type === 'number' || q.type === 'text') {
    return q.frame ? q.frame.replace('{value}', String(a!.value)) : '';
  }
  const chosen = selectedOptions(q, a);
  if (q.type === 'multi') {
    const phrases = chosen.map((o) => o.phrase ?? o.label.toLowerCase());
    const lead = q.frame && phrases.length ? q.frame.replace('{list}', joinList(phrases)) : '';
    const extra = chosen.map((o) => o.wording).filter(Boolean) as string[];
    return [lead, ...extra].join(' ').trim();
  }
  return chosen
    .map((o) => (o.wording ? capitalise(fill(o.wording, subject)) : ''))
    .filter(Boolean)
    .join(' ');
}

export function worstTone(tones: Tone[]): Tone {
  const order: Tone[] = ['bad', 'poor', 'fair', 'good', 'neutral'];
  for (const t of order) if (tones.includes(t)) return t;
  return 'neutral';
}

/** Full paragraph for a group: condition, element storm-readiness text, checks, note. */
export function groupWording(group: Group, answers: Answers, sector: Sector): string {
  const qs = visibleQuestions(group.questions, answers, sector);
  const parts: string[] = [];
  for (const q of qs) {
    const w = questionWording(q, answers[q.id], group.subject);
    if (w) parts.push(w);
    if (q.type === 'condition' && group.elementWording) {
      const c = single(answers[q.id]);
      if (c === 'fair' || c === 'poor' || c === 'defective') parts.push(group.elementWording);
    }
  }
  return parts.join(' ');
}

export function roomWording(room: Room, sector: Sector): string {
  const qs = visibleQuestions(ROOM_QUESTIONS, room.answers, sector);
  const parts: string[] = [];
  const finishes = qs.filter((q) => q.type === 'multi');
  const rest = qs.filter((q) => q.type !== 'multi');
  for (const q of finishes) {
    const w = questionWording(q, room.answers[q.id]);
    if (w) parts.push(w);
  }
  for (const q of rest) {
    const w = questionWording(q, room.answers[q.id]);
    if (w) parts.push(w);
  }
  return parts.join(' ');
}

export function roomArea(r: { length?: number; width?: number }): number | undefined {
  if (!r.length || !r.width) return undefined;
  return Math.round(r.length * r.width * 100) / 100;
}

// ─── Property description ───────────────────────────────────────────────────

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function article(word: string) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

/** "The subject property is a two-storey semi-detached house…" — rebuilt live as dropdowns change. */
export function propertyDescription(inspection: Inspection): string {
  const a = groupAnswers(inspection, PROFILE.id);
  const w = (id: string) => {
    const q = PROFILE.questions.find((x) => x.id === id)!;
    return selectedOptions(q, a[id])[0]?.wording;
  };
  const type = w('propertyType');
  const storeys = w('storeys');
  const age = w('age');
  const construction = w('construction');
  const roofForm = w('roofForm');
  const covering = w('roofCovering');
  const walls = w('walls');
  const windows = w('windows');
  const occupancy = w('occupancy');
  const weather = w('weather');

  const sentences: string[] = [];
  const predicates = [
    construction ? `of ${construction} construction` : '',
    roofForm ? `beneath ${roofForm}${covering ? ` covered in ${covering}` : ''}` : covering ? `with a roof covered in ${covering}` : '',
  ].filter(Boolean);

  if (type || storeys) {
    let subject: string;
    const noun = type ?? 'building';
    if (single(a.propertyType) === 'flat' && storeys) {
      subject = `a flat within ${article(storeys)} ${storeys} building`;
    } else {
      const phrase = storeys ? `${storeys} ${noun}` : noun;
      subject = `${article(phrase)} ${phrase}`;
    }
    let s1 = `The subject property is ${subject}`;
    if (age) s1 += `, ${age}${predicates.length ? ',' : ''}`;
    if (predicates.length) s1 += ` ${predicates.join(' ')}`;
    sentences.push(`${s1}.`);
  } else if (predicates.length) {
    sentences.push(`The subject property${age ? `, ${age},` : ''} is ${predicates.join(' ')}.`);
  } else if (age) {
    sentences.push(`The subject property is ${age}.`);
  }

  if (walls && windows) sentences.push(`External walls are ${walls} and the property has ${windows}.`);
  else if (walls) sentences.push(`External walls are ${walls}.`);
  else if (windows) sentences.push(`The property has ${windows}.`);

  const beds = a.bedrooms?.value;
  if (inspection.sector === 'domestic' && typeof beds === 'number' && beds > 0) {
    const n = beds <= 10 ? NUMBER_WORDS[beds] : String(beds);
    sentences.push(`The accommodation includes ${n} bedroom${beds === 1 ? '' : 's'}.`);
  }

  if (occupancy && weather) {
    sentences.push(`At the time of inspection the property was ${occupancy} and the weather was ${weather}.`);
  } else if (occupancy) {
    sentences.push(`At the time of inspection the property was ${occupancy}.`);
  } else if (weather) {
    sentences.push(`The weather at the time of inspection was ${weather}.`);
  }
  return sentences.join(' ');
}

// ─── Sections & progress ────────────────────────────────────────────────────

export function sectionsFor(tier: Tier): SectionDef[] {
  return SECTIONS.filter((s) => s.tiers.includes(tier));
}

export function tierIncludes(tier: Tier, section: SectionId): boolean {
  return SECTIONS.find((s) => s.id === section)!.tiers.includes(tier);
}

export interface Progress {
  done: number;
  total: number;
}

const REQUIRED_INSTRUCTION = [
  'policyholderName',
  'addressLine1',
  'postcode',
  'inspectionDate',
  'inspector',
] as const;

function groupProgress(group: Group, inspection: Inspection, photosNeeded = 0): Progress {
  const a = groupAnswers(inspection, group.id);
  const qs = visibleQuestions(group.questions, a, inspection.sector);
  let done = qs.filter((q) => isAnswered(a[q.id])).length;
  let total = qs.length;
  if (photosNeeded > 0) {
    total += 1;
    const n = inspection.photos.filter((p) => p.owner.kind === 'group' && p.owner.id === group.id).length;
    if (n >= photosNeeded) done += 1;
  }
  return { done, total };
}

function sum(ps: Progress[]): Progress {
  return ps.reduce((acc, p) => ({ done: acc.done + p.done, total: acc.total + p.total }), { done: 0, total: 0 });
}

export function sectionProgress(inspection: Inspection, section: SectionId): Progress {
  switch (section) {
    case 'details': {
      const ins = REQUIRED_INSTRUCTION.filter((k) => inspection.instruction[k].trim()).length;
      const p = groupProgress(PROFILE, inspection);
      const refs = inspection.instruction.claimNumber.trim() || inspection.instruction.policyNumber.trim() ? 1 : 0;
      return { done: ins + refs + p.done, total: REQUIRED_INSTRUCTION.length + 1 + p.total };
    }
    case 'roof':
      return groupProgress(ROOF, inspection, ROOF.minPhotos);
    case 'external':
      return sum(EXTERNAL.map((g) => groupProgress(g, inspection)));
    case 'internal':
      return sum(INTERNAL.map((g) => groupProgress(g, inspection)));
    case 'assessment':
      return groupProgress(ASSESSMENT, inspection);
    case 'outbuildings': {
      if (inspection.answers['outbuildings.none']?.value === 'yes') return { done: 1, total: 1 };
      const n = inspection.outbuildings.length;
      if (!n) return { done: 0, total: 1 };
      return { done: inspection.outbuildings.filter((o) => o.condition).length, total: n };
    }
    case 'rooms': {
      const n = inspection.rooms.length;
      if (!n) return { done: 0, total: 1 };
      return { done: inspection.rooms.filter((r) => isAnswered(r.answers.condition)).length, total: n };
    }
    case 'findings':
      return { done: 1, total: 1 };
    case 'summary': {
      const s = inspection.summary;
      return { done: (s.signedBy && s.signature ? 1 : 0) + (s.rating ? 1 : 0), total: 2 };
    }
  }
}

export function overallProgress(inspection: Inspection): number {
  const ps = sectionsFor(inspection.tier)
    .filter((s) => s.id !== 'findings')
    .map((s) => sectionProgress(inspection, s.id));
  const fractions = ps.map((p) => (p.total ? p.done / p.total : 1));
  return fractions.reduce((a, b) => a + b, 0) / fractions.length;
}

// ─── Findings: the further-investigation schedule ───────────────────────────

export interface Finding {
  key: string;
  priority: Priority;
  defaultPriority: Priority;
  area: string;
  text: string;
  storm: boolean;
  auto: boolean;
  dismissed: boolean;
  evidence: string;
}

function groupsInTier(tier: Tier): Group[] {
  const gs: Group[] = [ROOF];
  if (tier !== 'bronze') gs.push(...EXTERNAL);
  if (tier === 'gold') gs.push(...INTERNAL);
  return gs;
}

const CONDITION_FINDING: Record<string, Priority | undefined> = { poor: 2, defective: 1 };
const OVERALL_FINDING: Record<string, Priority | undefined> = { poor: 2, unsatisfactory: 1 };
const SEVERITY_PRIORITY: Record<string, Priority> = { significant: 2, moderate: 3, minor: 4 };

export function autoFindings(inspection: Inspection): Omit<Finding, 'priority' | 'dismissed'>[] {
  const out: Omit<Finding, 'priority' | 'dismissed'>[] = [];
  const sector = inspection.sector;

  for (const g of groupsInTier(inspection.tier)) {
    const a = groupAnswers(inspection, g.id);
    const qs = visibleQuestions(g.questions, a, sector);
    const before = out.length;
    for (const q of qs) {
      for (const o of selectedOptions(q, a[q.id])) {
        if (o.finding) {
          out.push({
            key: key(g.id, q.id),
            defaultPriority: o.finding.priority,
            area: g.title,
            text: o.finding.text,
            storm: !!o.finding.storm,
            auto: true,
            evidence: a[q.id]?.note ?? '',
          });
        }
      }
    }
    const cond = single(a.condition);
    const p = cond ? CONDITION_FINDING[cond] : undefined;
    if (p && out.length === before && qs.some((q) => q.id === 'condition')) {
      out.push({
        key: key(g.id, 'condition'),
        defaultPriority: p,
        area: g.title,
        text: `${capitalise(g.subject)} assessed as ${cond} — ${FURTHER}.`,
        storm: !!g.storm,
        auto: true,
        evidence: inspection.groupNotes[g.id] ?? '',
      });
    }
  }

  if (inspection.tier !== 'bronze') {
    for (const o of inspection.outbuildings) {
      const bad =
        (o.condition && OVERALL_FINDING[o.condition]) ||
        (o.roof && CONDITION_FINDING[o.roof]) ||
        (o.walls && CONDITION_FINDING[o.walls]);
      if (bad) {
        out.push({
          key: `outbuilding.${o.id}`,
          defaultPriority: bad,
          area: o.label || o.type,
          text: `${o.label || o.type} in ${o.condition ?? 'poor'} condition — ${FURTHER}.`,
          storm: true,
          auto: true,
          evidence: o.description,
        });
      }
    }
  }

  if (inspection.tier === 'gold') {
    for (const r of inspection.rooms) {
      const qs = visibleQuestions(ROOM_QUESTIONS, r.answers, sector);
      const before = out.length;
      for (const q of qs) {
        for (const o of selectedOptions(q, r.answers[q.id])) {
          if (o.finding) {
            out.push({
              key: `room.${r.id}.${q.id}`,
              defaultPriority: o.finding.priority,
              area: r.name,
              text: o.finding.text,
              storm: false,
              auto: true,
              evidence: r.answers[q.id]?.note ?? '',
            });
          }
        }
      }
      for (const d of r.defects) {
        out.push({
          key: `room.${r.id}.defect.${d.id}`,
          defaultPriority: SEVERITY_PRIORITY[d.severity],
          area: r.name,
          text: `${d.description}${d.location ? ` (${d.location})` : ''}`,
          storm: false,
          auto: true,
          evidence: d.source === 'ai' ? 'Identified by photo scan, confirmed on site' : '',
        });
      }
      const cond = single(r.answers.condition);
      const p = cond ? OVERALL_FINDING[cond] : undefined;
      if (p && out.length === before) {
        out.push({
          key: `room.${r.id}.condition`,
          defaultPriority: p,
          area: r.name,
          text: `Room assessed as ${cond} — ${FURTHER}.`,
          storm: false,
          auto: true,
          evidence: '',
        });
      }
    }
  }
  return out;
}

export function findings(inspection: Inspection, includeDismissed = false): Finding[] {
  const auto = autoFindings(inspection).map((f): Finding => {
    const o = inspection.findingOverrides[f.key];
    return { ...f, priority: o?.priority ?? f.defaultPriority, dismissed: !!o?.dismissed };
  });
  const manual = inspection.actions.map(
    (a): Finding => ({
      key: `action.${a.id}`,
      priority: a.priority,
      defaultPriority: a.priority,
      area: a.area,
      text: a.action,
      storm: false,
      auto: false,
      dismissed: false,
      evidence: a.evidence,
    }),
  );
  return [...auto, ...manual]
    .filter((f) => includeDismissed || !f.dismissed)
    .map((f, i) => ({ f, i }))
    .sort((x, y) => x.f.priority - y.f.priority || x.i - y.i)
    .map(({ f }) => f);
}

// ─── Suggestions ────────────────────────────────────────────────────────────

/** Enough answers to say anything about the property (otherwise the rating shows as pending). */
export function canRate(inspection: Inspection): boolean {
  if (autoFindings(inspection).length || inspection.actions.length) return true;
  const answered = groupsInTier(inspection.tier).reduce((n, g) => {
    const a = groupAnswers(inspection, g.id);
    return n + g.questions.filter((q) => isAnswered(a[q.id])).length;
  }, 0);
  return answered + inspection.rooms.filter((r) => isAnswered(r.answers.condition)).length >= 3;
}

export function suggestedRating(inspection: Inspection): Rating {
  const fs = findings(inspection);
  const c = (p: Priority) => fs.filter((f) => f.priority === p).length;
  if (c(1) >= 3) return 'unsatisfactory';
  if (c(1) >= 1 || c(2) >= 3) return 'poor';
  if (c(2) >= 1 || c(3) >= 3) return 'fair';
  if (fs.length > 0) return 'good';
  const conds = [ROOF, ...EXTERNAL]
    .map((g) => single(inspection.answers[key(g.id, 'condition')]))
    .filter(Boolean);
  return conds.length >= 3 && conds.every((x) => x === 'good') ? 'excellent' : 'good';
}

export function suggestedAssessment(inspection: Inspection): Record<string, string | undefined> {
  const fs = findings(inspection);
  const storm = fs.filter((f) => f.storm);
  const minP = fs.reduce<number>((m, f) => Math.min(m, f.priority), 5);
  const yes = (k: string) => inspection.answers[k]?.value === 'yes';
  const roomDamp = inspection.rooms.some((r) => r.answers.damp?.value === 'yes');

  let ingress: string | undefined;
  if (yes('services.leaks')) ingress = 'active';
  else if (yes('loft.ingress') || yes('damp.rising') || roomDamp) ingress = 'moisture';
  else if (inspection.tier === 'gold') ingress = 'none';

  return {
    storm: storm.some((f) => f.priority === 1)
      ? 'immediate'
      : storm.filter((f) => f.priority === 2).length >= 2
        ? 'high'
        : storm.length
          ? 'moderate'
          : 'low',
    defects:
      fs.filter((f) => f.priority === 1).length >= 3 || fs.length >= 10
        ? 'extensive'
        : minP <= 2 || fs.length >= 5
          ? 'significant'
          : fs.length
            ? 'minor'
            : 'none',
    priority: minP === 1 ? 'immediate' : minP === 2 ? 'urgent' : minP === 3 ? 'season' : 'routine',
    maintenance:
      fs.length === 0 ? 'well' : fs.length <= 2 && minP >= 3 ? 'generally' : fs.length <= 6 ? 'required' : 'poor',
    ingress,
  };
}

export const RATING_LABEL: Record<Rating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  unsatisfactory: 'Unsatisfactory',
};

export function formatDate(iso: string | number | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'number' ? new Date(iso) : new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function addressLine(inspection: Inspection): string {
  const i = inspection.instruction;
  return [i.addressLine1, i.addressLine2, i.town, i.postcode].map((s) => s.trim()).filter(Boolean).join(', ');
}

export interface SummaryDraft {
  keyVulnerabilities: string;
  priorityActions: string;
  inspectorSummary: string;
}

export function draftSummary(inspection: Inspection): SummaryDraft {
  const fs = findings(inspection);
  const storm = fs.filter((f) => f.storm);
  const urgent = fs.filter((f) => f.priority <= 2);
  const rating = inspection.summary.rating ?? suggestedRating(inspection);
  const tier = TIERS[inspection.tier];

  const keyVulnerabilities = storm.length
    ? storm.map((f) => `• ${f.area}: ${f.text}`).join('\n')
    : 'No significant storm vulnerabilities were identified within the limitations of this visual inspection.';

  const priorityActions = urgent.length
    ? urgent.map((f) => `• ${f.area} (priority ${f.priority}): ${f.text}`).join('\n')
    : 'No immediate or urgent matters were identified.';

  const where = addressLine(inspection) || 'the subject property';
  const when = formatDate(inspection.instruction.inspectionDate);
  const scope =
    inspection.tier === 'bronze'
      ? 'a roof inspection supported by drone photography'
      : inspection.tier === 'silver'
        ? 'an inspection of the external fabric, roof, drainage, boundaries and outbuildings'
        : 'an inspection of the external fabric, roof, outbuildings and each internal room';

  const parts: string[] = [];
  parts.push(
    `A ${tier.name} Home MOT inspection of ${where} was carried out${when ? ` on ${when}` : ''}, comprising ${scope}.`,
  );
  const desc = propertyDescription(inspection);
  if (desc) parts.push(desc);
  parts.push(`Overall, the property was assessed as being in ${RATING_LABEL[rating].toLowerCase()} condition.`);
  if (fs.length) {
    const p1 = fs.filter((f) => f.priority === 1).length;
    parts.push(
      `${capitalise(NUMBER_WORDS[fs.length] ?? String(fs.length))} matter${fs.length === 1 ? ' was' : 's were'} identified that would require further investigation, further checking and potentially repairs${p1 ? `, ${NUMBER_WORDS[p1] ?? p1} of which ${p1 === 1 ? 'is' : 'are'} considered immediate` : ''}. These are set out in the further investigation schedule.`,
    );
    parts.push(CLIENT_STATEMENT);
  } else {
    parts.push('No matters requiring further investigation were identified within the limitations of this visual inspection.');
  }
  return { keyVulnerabilities, priorityActions, inspectorSummary: parts.join(' ') };
}

// ─── Photo references ───────────────────────────────────────────────────────

/** Report order: roof, external groups, outbuildings, rooms, internal groups, general → P01, P02… */
export function photoRefs(inspection: Inspection): Map<string, string> {
  const order: string[] = [];
  const push = (pred: (p: Inspection['photos'][number]) => boolean) =>
    inspection.photos.filter(pred).forEach((p) => order.push(p.id));
  const byGroup = (id: string) => (p: Inspection['photos'][number]) => p.owner.kind === 'group' && p.owner.id === id;

  push(byGroup(ROOF.id));
  if (inspection.tier !== 'bronze') {
    EXTERNAL.forEach((g) => push(byGroup(g.id)));
    inspection.outbuildings.forEach((o) => push((p) => p.owner.kind === 'outbuilding' && p.owner.id === o.id));
  }
  if (inspection.tier === 'gold') {
    inspection.rooms.forEach((r) => push((p) => p.owner.kind === 'room' && p.owner.id === r.id));
    INTERNAL.forEach((g) => push(byGroup(g.id)));
  }
  push((p) => p.owner.kind === 'general');

  return new Map(order.map((id, i) => [id, `P${String(i + 1).padStart(2, '0')}`]));
}

export function photosFor(inspection: Inspection, owner: Inspection['photos'][number]['owner']) {
  return inspection.photos.filter(
    (p) => p.owner.kind === owner.kind && ('id' in owner ? 'id' in p.owner && p.owner.id === owner.id : true),
  );
}
