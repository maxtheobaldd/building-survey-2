import {
  draftSummary,
  findings,
  groupWording,
  key,
  overallProgress,
  photoRefs,
  propertyDescription,
  questionWording,
  roomWording,
  sectionProgress,
  suggestedAssessment,
  suggestedRating,
  visibleQuestions,
} from '@/survey/engine';
import { CLIENT_STATEMENT, EXTERNAL, ROOF, ROOM_QUESTIONS } from '@/survey/schema';
import { sampleInspection } from '@/survey/sample';
import type { Inspection } from '@/survey/types';

const sample = () => sampleInspection('i1', 'HM-2610-0001', 'Alex Surveyor');

function blank(): Inspection {
  const s = sample();
  return { ...s, answers: {}, rooms: [], outbuildings: [], groupNotes: {}, tier: 'bronze' };
}

describe('property description', () => {
  it('writes the description from the profile dropdowns', () => {
    expect(propertyDescription(sample())).toBe(
      'The subject property is a two-storey semi-detached house, believed to date from the inter-war period, of cavity masonry construction beneath a hipped roof covered in natural slate. External walls are rendered and the property has uPVC double-glazed windows. The accommodation includes three bedrooms. At the time of inspection the property was occupied and the weather was dry.',
    );
  });

  it('is empty until the first profile answer, then grows', () => {
    const i = blank();
    expect(propertyDescription(i)).toBe('');
    i.answers[key('profile', 'propertyType')] = { value: 'office' };
    expect(propertyDescription(i)).toBe('The subject property is an office building.');
    i.answers[key('profile', 'storeys')] = { value: '2' };
    expect(propertyDescription(i)).toBe('The subject property is a two-storey office building.');
  });

  it('reads naturally before the property type is chosen', () => {
    const i = blank();
    i.answers[key('profile', 'walls')] = { value: 'render' };
    i.answers[key('profile', 'windows')] = { value: 'upvc-dg' };
    expect(propertyDescription(i)).toBe('External walls are rendered and the property has uPVC double-glazed windows.');
    i.answers[key('profile', 'construction')] = { value: 'stone' };
    expect(propertyDescription(i)).toMatch(/^The subject property is of natural stone construction\./);
  });

  it('describes flats within their building', () => {
    const i = blank();
    i.answers[key('profile', 'propertyType')] = { value: 'flat' };
    i.answers[key('profile', 'storeys')] = { value: '3' };
    expect(propertyDescription(i)).toBe('The subject property is a flat within a three-storey building.');
  });
});

describe('wording', () => {
  it('puts the group subject into condition wording', () => {
    const q = ROOF.questions.find((x) => x.id === 'condition')!;
    expect(questionWording(q, { value: 'good' }, ROOF.subject)).toMatch(/^The roof coverings appeared to be in generally good condition/);
  });

  it('adds the template storm-readiness paragraph for fair-or-worse conditions only', () => {
    const gutters = EXTERNAL.find((g) => g.id === 'gutters')!;
    expect(groupWording(gutters, { condition: { value: 'good' } }, 'domestic')).not.toContain('Rainwater goods need');
    expect(groupWording(gutters, { condition: { value: 'poor' } }, 'domestic')).toContain('Rainwater goods need');
  });

  it('joins multi-select finishes into one sentence', () => {
    const ceiling = ROOM_QUESTIONS.find((q) => q.id === 'ceiling')!;
    expect(questionWording(ceiling, { value: ['plaster-smooth', 'coving', 'rose'] })).toBe(
      'The ceiling comprises a smooth plastered finish, a ceiling rose and coving.',
    );
  });

  it('adds the asbestos caveat for textured ceilings', () => {
    const ceiling = ROOM_QUESTIONS.find((q) => q.id === 'ceiling')!;
    expect(questionWording(ceiling, { value: ['textured'] })).toContain('may contain asbestos');
  });

  it('builds a room paragraph', () => {
    const room = sample().rooms[0];
    const text = roomWording(room, 'domestic');
    expect(text).toContain('The floor is finished with solid wood flooring.');
    expect(text).toContain('patch repair');
  });
});

describe('conditional questions', () => {
  it('hides chimney questions when there is no stack', () => {
    const chimney = EXTERNAL.find((g) => g.id === 'chimney')!;
    expect(visibleQuestions(chimney.questions, { present: { value: 'no' } }, 'domestic').map((q) => q.id)).toEqual(['present']);
    expect(visibleQuestions(chimney.questions, { present: { value: 'yes' } }, 'domestic').length).toBe(6);
  });
});

describe('findings', () => {
  it('derives the further investigation schedule from adverse answers and defects', () => {
    const fs = findings(sample());
    const keys = fs.map((f) => f.key);
    expect(keys).toContain('roof.coverings');
    expect(keys).toContain('chimney.flashings');
    expect(keys).toContain('room.sample-living.defect.d1');
    expect(keys).toContain('room.sample-bed1.damp');
    expect(keys).toContain('outbuilding.sample-garage');
    // Sorted by priority.
    expect(fs.map((f) => f.priority)).toEqual([...fs.map((f) => f.priority)].sort());
  });

  it('respects tier: bronze only reports the roof', () => {
    const i = { ...sample(), tier: 'bronze' as const };
    expect(findings(i).every((f) => f.key.startsWith('roof.'))).toBe(true);
  });

  it('applies overrides and dismissals', () => {
    const i = sample();
    i.findingOverrides['roof.coverings'] = { priority: 4 };
    i.findingOverrides['chimney.flashings'] = { dismissed: true };
    const fs = findings(i);
    expect(fs.find((f) => f.key === 'roof.coverings')!.priority).toBe(4);
    expect(fs.find((f) => f.key === 'chimney.flashings')).toBeUndefined();
  });

  it('adds a condition finding only when no specific question flagged the element', () => {
    const i = blank();
    i.tier = 'silver';
    i.answers[key('fascia', 'condition')] = { value: 'defective' };
    expect(findings(i).map((f) => f.key)).toEqual(['fascia.condition']);
    i.answers[key('fascia', 'loose')] = { value: 'yes' };
    expect(findings(i).map((f) => f.key)).toEqual(['fascia.loose']);
  });
});

describe('suggestions and summary', () => {
  it('suggests a rating and assessments from findings', () => {
    const i = sample();
    expect(suggestedRating(i)).toBe('poor');
    const s = suggestedAssessment(i);
    expect(s.storm).toBe('high');
    expect(s.priority).toBe('urgent');
    expect(s.ingress).toBe('moisture');
  });

  it('rates a clean property excellent', () => {
    const i = blank();
    i.tier = 'silver';
    for (const g of [ROOF, ...EXTERNAL.slice(0, 3)]) i.answers[key(g.id, 'condition')] = { value: 'good' };
    expect(suggestedRating(i)).toBe('excellent');
  });

  it('drafts a summary that uses the client statement instead of recommending', () => {
    const d = draftSummary(sample());
    expect(d.inspectorSummary).toContain(CLIENT_STATEMENT);
    expect(d.inspectorSummary).toContain('Gold Home MOT inspection of 12 Acacia Avenue');
    expect(d.keyVulnerabilities).toContain('Roof survey (drone)');
  });
});

describe('progress and photo refs', () => {
  it('measures progress per section', () => {
    const i = sample();
    expect(sectionProgress(i, 'details').done).toBe(sectionProgress(i, 'details').total);
    expect(sectionProgress(i, 'roof')).toEqual({ done: 7, total: 8 }); // photos still missing
    expect(overallProgress(i)).toBeGreaterThan(0.5);
    expect(overallProgress(i)).toBeLessThan(1);
  });

  it('numbers photos in report order', () => {
    const i = sample();
    const photo = (id: string, owner: Inspection['photos'][number]['owner']) => ({
      id,
      file: `${id}.jpg`,
      reportFile: `${id}_r.jpg`,
      width: 1,
      height: 1,
      caption: id,
      owner,
      takenAt: 0,
    });
    i.photos = [
      photo('room', { kind: 'room', id: 'sample-kitchen' }),
      photo('gutter', { kind: 'group', id: 'gutters' }),
      photo('roof', { kind: 'group', id: 'roof' }),
    ];
    const refs = photoRefs(i);
    expect(refs.get('roof')).toBe('P01');
    expect(refs.get('gutter')).toBe('P02');
    expect(refs.get('room')).toBe('P03');
  });
});
