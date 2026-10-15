/**
 * Compliance guard: the client is not FCA-registered, so nothing the app writes into a report may
 * recommend or advise. Every sentence states what was seen and that it "would require further
 * investigation, further checking and potentially repairs".
 */
import { ELEMENT_CONDITIONS } from '@/survey/builders';
import {
  ALL_GROUPS,
  CLIENT_STATEMENT,
  INTERNAL_ROOM_WORDING,
  OUTBUILDING_WORDING,
  PURPOSE,
  ROOM_QUESTIONS,
} from '@/survey/schema';

const BANNED = /\b(recommend\w*|advis\w*|should|must|ought)\b/i;

function allWording(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const questions = [
    ...ALL_GROUPS.flatMap((g) => g.questions.map((q) => ({ g: g.id, q }))),
    ...ROOM_QUESTIONS.map((q) => ({ g: 'room', q })),
  ];
  for (const { g, q } of questions) {
    if (q.frame) out.push({ where: `${g}.${q.id} frame`, text: q.frame });
    for (const o of q.options ?? []) {
      if (o.wording) out.push({ where: `${g}.${q.id}=${o.id}`, text: o.wording });
      if (o.phrase) out.push({ where: `${g}.${q.id}=${o.id} phrase`, text: o.phrase });
      if (o.finding) out.push({ where: `${g}.${q.id}=${o.id} finding`, text: o.finding.text });
    }
  }
  for (const g of ALL_GROUPS) if (g.elementWording) out.push({ where: `${g.id} element`, text: g.elementWording });
  for (const o of ELEMENT_CONDITIONS) if (o.wording) out.push({ where: `condition=${o.id}`, text: o.wording });
  out.push(
    { where: 'client statement', text: CLIENT_STATEMENT },
    { where: 'purpose', text: PURPOSE },
    { where: 'outbuilding', text: OUTBUILDING_WORDING },
    { where: 'internal room', text: INTERNAL_ROOM_WORDING },
  );
  return out;
}

test('no report wording recommends or advises', () => {
  const offenders = allWording().filter((w) => BANNED.test(w.text));
  expect(offenders).toEqual([]);
});

test('every adverse finding uses the further-investigation house style', () => {
  const findings = allWording().filter((w) => w.where.endsWith('finding'));
  expect(findings.length).toBeGreaterThan(40);
  for (const f of findings) {
    expect(f.text).toMatch(/further (investigation|checking)|patch repair/);
  }
});

test('the roof survey has exactly seven questions', () => {
  const roof = ALL_GROUPS.find((g) => g.id === 'roof')!;
  expect(roof.questions).toHaveLength(7);
});

test('question ids are unique within each group', () => {
  for (const g of [...ALL_GROUPS, { id: 'room', questions: ROOM_QUESTIONS }]) {
    const ids = g.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  }
});
