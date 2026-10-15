import type { FindingSpec, Option, Priority, Question, ShowIf, Tone } from './types';

interface OptSpec {
  wording?: string;
  tone?: Tone;
  finding?: FindingSpec;
}

/** Shorthand for an answer that adds an item to the further-investigation schedule. */
export function flag(priority: Priority, text: string, storm = false): FindingSpec {
  return { priority, text, storm };
}

/** Phrase the client asked for in place of a recommendation (the firm is not FCA-registered). */
export const FURTHER = 'would require further investigation, further checking and potentially repairs';

export function yesNo(
  id: string,
  label: string,
  prompt: string,
  spec: {
    yes?: OptSpec;
    no?: OptSpec;
    /** Pass a string for custom N/A wording, or false to hide the N/A button. */
    na?: OptSpec | false;
    ai?: boolean;
    showIf?: ShowIf;
    help?: string;
  },
): Question {
  const options: Option[] = [
    { id: 'yes', label: 'Yes', tone: 'neutral', ...spec.yes },
    { id: 'no', label: 'No', tone: 'neutral', ...spec.no },
  ];
  if (spec.na !== false) {
    options.push({ id: 'na', label: 'N/A', tone: 'neutral', ...(spec.na ?? {}) });
  }
  return {
    id,
    label,
    prompt,
    type: 'yesno',
    options,
    ai: spec.ai ?? true,
    showIf: spec.showIf,
    help: spec.help,
  };
}

/** Element condition scale from the Word template (Good → Not applicable), with Section 7 wording. */
export const ELEMENT_CONDITIONS: Option[] = [
  {
    id: 'good',
    label: 'Good',
    tone: 'good',
    wording:
      'The {subject} appeared to be in generally good condition at the time of inspection, with no significant visible defects noted within the limitations of a visual inspection.',
  },
  {
    id: 'fair',
    label: 'Fair',
    tone: 'fair',
    wording:
      'The {subject} appeared serviceable but showed signs of age, wear or minor deterioration. Further checking would be required to establish the extent of preventative maintenance needed to reduce the likelihood of future damage.',
  },
  {
    id: 'poor',
    label: 'Poor',
    tone: 'poor',
    wording:
      `The {subject} showed visible deterioration and/or defects that may reduce its ability to perform effectively during adverse weather and ${FURTHER}.`,
  },
  {
    id: 'defective',
    label: 'Defective',
    tone: 'bad',
    wording:
      'A visible defect was identified to the {subject} which may compromise its performance and increase vulnerability to weather-related damage. Further investigation would be required and repair or replacement may potentially be necessary.',
  },
  {
    id: 'not-visible',
    label: 'Not visible',
    tone: 'neutral',
    wording:
      'The {subject} could not be fully viewed at the time of inspection and no comment can be made on its condition.',
  },
  { id: 'na', label: 'N/A', tone: 'neutral', wording: 'Not applicable to this property.' },
];

/** Overall condition scale (rooms, outbuildings, final rating). */
export const OVERALL_CONDITIONS: Option[] = [
  { id: 'excellent', label: 'Excellent', tone: 'good' },
  { id: 'good', label: 'Good', tone: 'good' },
  { id: 'fair', label: 'Fair', tone: 'fair' },
  { id: 'poor', label: 'Poor', tone: 'poor' },
  { id: 'unsatisfactory', label: 'Unsatisfactory', tone: 'bad' },
  { id: 'na', label: 'N/A', tone: 'neutral' },
];

export function conditionQuestion(label = 'Condition', prompt?: string): Question {
  return { id: 'condition', label, prompt, type: 'condition', options: ELEMENT_CONDITIONS, ai: true };
}
