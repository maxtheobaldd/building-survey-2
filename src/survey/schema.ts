/**
 * The Home MOT question set and wording library.
 *
 * Everything the surveyor answers — and every sentence that answer puts into the report — lives
 * here. Change wording in this file; screens and the report pick it up automatically.
 *
 * House rule: the firm is not FCA-registered, so wording never recommends or advises. It states
 * what was seen and that matters "would require further investigation, further checking and
 * potentially repairs". `__tests__/wording.test.ts` enforces this.
 */
import { conditionQuestion, flag, FURTHER, OVERALL_CONDITIONS, yesNo } from './builders';
import type { Group, Option, Priority, Question, SectionDef, Tier } from './types';

export const TIERS: Record<
  Tier,
  { name: string; strap: string; includes: string[]; colors: [string, string, string] }
> = {
  bronze: {
    name: 'Bronze',
    strap: 'Roof survey',
    includes: ['Drone / roof photographs', 'Seven roof questions', 'Storm vulnerability assessment'],
    colors: ['#E2A878', '#A8683A', '#6E3F1E'],
  },
  silver: {
    name: 'Silver',
    strap: 'Full external',
    includes: [
      'Everything in Bronze',
      'Gutters, fascias, chimney stack, walls, windows, doors',
      'Drainage & French drains, boundary walls, trees',
      'Garage & outbuildings schedule',
    ],
    colors: ['#E8EDF2', '#9AA6B2', '#5E6A76'],
  },
  gold: {
    name: 'Gold',
    strap: 'External + internal',
    includes: [
      'Everything in Silver',
      'Every room measured & photographed',
      'AI room scan: ceiling, walls, floor, features, defects',
      'Roof space, services & damp checks',
    ],
    colors: ['#F4DC8C', '#C59B32', '#7E5E12'],
  },
};

export const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold'];

export const SECTIONS: SectionDef[] = [
  {
    id: 'details',
    title: 'Instruction & property',
    short: 'Property',
    icon: 'house',
    blurb: 'Policyholder, claim and policy numbers, and the property profile that writes the description.',
    tiers: ['bronze', 'silver', 'gold'],
  },
  {
    id: 'roof',
    title: 'Roof survey',
    short: 'Roof',
    icon: 'airplane',
    blurb: 'Drone or roof-level photographs and the seven roof questions.',
    tiers: ['bronze', 'silver', 'gold'],
  },
  {
    id: 'external',
    title: 'External / storm readiness',
    short: 'External',
    icon: 'cloud.bolt.rain',
    blurb: 'Gutters, fascias, chimney stack, walls, windows, doors, drainage, boundaries and trees.',
    tiers: ['silver', 'gold'],
  },
  {
    id: 'outbuildings',
    title: 'Garage & outbuildings',
    short: 'Outbuildings',
    icon: 'car',
    blurb: 'Garages, summerhouses, sheds and workshops with dimensions and condition.',
    tiers: ['silver', 'gold'],
  },
  {
    id: 'rooms',
    title: 'Internal rooms',
    short: 'Rooms',
    icon: 'square.split.bottomrightquarter',
    blurb: 'Every room measured and photographed, with an AI scan of finishes and defects.',
    tiers: ['gold'],
  },
  {
    id: 'internal',
    title: 'Roof space, services & damp',
    short: 'Internal',
    icon: 'drop',
    blurb: 'Loft, visible services and safety devices, damp and movement indicators.',
    tiers: ['gold'],
  },
  {
    id: 'assessment',
    title: 'Defects & storm vulnerability',
    short: 'Assessment',
    icon: 'gauge.with.dots.needle.67percent',
    blurb: 'Maintenance standard, storm vulnerability, previous repairs and water ingress.',
    tiers: ['bronze', 'silver', 'gold'],
  },
  {
    id: 'findings',
    title: 'Further investigation schedule',
    short: 'Findings',
    icon: 'list.bullet.clipboard',
    blurb: 'Built automatically from your answers. Add, re-prioritise or dismiss items.',
    tiers: ['bronze', 'silver', 'gold'],
  },
  {
    id: 'summary',
    title: 'Summary & sign-off',
    short: 'Sign-off',
    icon: 'signature',
    blurb: 'Overall rating, drafted summary and your signature.',
    tiers: ['bronze', 'silver', 'gold'],
  },
];

export const PRIORITIES: Record<Priority, { label: string; short: string; tone: 'bad' | 'poor' | 'fair' | 'neutral' }> = {
  1: { label: '1 — Immediate', short: 'Immediate', tone: 'bad' },
  2: { label: '2 — Urgent', short: 'Urgent', tone: 'poor' },
  3: { label: '3 — Planned', short: 'Planned', tone: 'fair' },
  4: { label: '4 — Routine', short: 'Routine', tone: 'neutral' },
};

// ─── Section 1: property profile ────────────────────────────────────────────
// `wording` on profile options is the phrase used in the live property description.

export const PROFILE: Group = {
  id: 'profile',
  title: 'Property profile',
  subject: 'property',
  icon: 'house',
  questions: [
    {
      id: 'propertyType',
      label: 'Property type',
      type: 'single',
      options: [
        { id: 'detached', label: 'Detached house', wording: 'detached house', sectors: ['domestic'] },
        { id: 'semi', label: 'Semi-detached', wording: 'semi-detached house', sectors: ['domestic'] },
        { id: 'mid-terrace', label: 'Mid-terrace', wording: 'mid-terrace house', sectors: ['domestic'] },
        { id: 'end-terrace', label: 'End-terrace', wording: 'end-terrace house', sectors: ['domestic'] },
        { id: 'bungalow', label: 'Bungalow', wording: 'bungalow', sectors: ['domestic'] },
        { id: 'flat', label: 'Flat / maisonette', wording: 'flat', sectors: ['domestic'] },
        { id: 'office', label: 'Office', wording: 'office building', sectors: ['commercial'] },
        { id: 'retail', label: 'Retail unit', wording: 'retail unit', sectors: ['commercial'] },
        { id: 'industrial', label: 'Industrial / warehouse', wording: 'industrial unit', sectors: ['commercial'] },
        { id: 'mixed-use', label: 'Mixed use', wording: 'mixed-use building', sectors: ['commercial'] },
        { id: 'leisure', label: 'Hospitality / leisure', wording: 'hospitality building', sectors: ['commercial'] },
        { id: 'other', label: 'Other', wording: 'property' },
      ],
    },
    {
      id: 'storeys',
      label: 'Storeys',
      type: 'single',
      options: [
        { id: '1', label: '1', wording: 'single-storey' },
        { id: '2', label: '2', wording: 'two-storey' },
        { id: '3', label: '3', wording: 'three-storey' },
        { id: '4', label: '4', wording: 'four-storey' },
        { id: '5', label: '5', wording: 'five-storey' },
        { id: '6', label: '6', wording: 'six-storey' },
        { id: '7+', label: '7+', wording: 'multi-storey' },
      ],
    },
    {
      id: 'age',
      label: 'Approx. age',
      type: 'single',
      options: [
        { id: 'pre-1900', label: 'Pre-1900', wording: 'believed to date from before 1900' },
        { id: '1900-1918', label: '1900–1918', wording: 'believed to date from the early twentieth century' },
        { id: '1919-1944', label: '1919–1944', wording: 'believed to date from the inter-war period' },
        { id: '1945-1964', label: '1945–1964', wording: 'believed to date from the post-war period' },
        { id: '1965-1980', label: '1965–1980', wording: 'believed to date from the 1960s or 1970s' },
        { id: '1981-2000', label: '1981–2000', wording: 'believed to date from the late twentieth century' },
        { id: '2001+', label: '2001 onwards', wording: 'believed to be of modern construction (post-2000)' },
      ],
    },
    {
      id: 'construction',
      label: 'Construction',
      type: 'single',
      options: [
        { id: 'solid-brick', label: 'Solid brick', wording: 'solid brick' },
        { id: 'cavity-brick', label: 'Cavity brick / block', wording: 'cavity masonry' },
        { id: 'stone', label: 'Stone', wording: 'natural stone' },
        { id: 'timber-frame', label: 'Timber frame', wording: 'timber-framed' },
        { id: 'steel-frame', label: 'Steel frame', wording: 'steel-framed' },
        { id: 'concrete', label: 'Concrete / system-built', wording: 'concrete system-built' },
      ],
    },
    {
      id: 'roofForm',
      label: 'Roof form',
      type: 'single',
      options: [
        { id: 'pitched', label: 'Pitched', wording: 'a pitched roof' },
        { id: 'hipped', label: 'Hipped', wording: 'a hipped roof' },
        { id: 'flat', label: 'Flat', wording: 'a flat roof' },
        { id: 'mixed', label: 'Pitched & flat', wording: 'a combination of pitched and flat roofs' },
        { id: 'mansard', label: 'Mansard', wording: 'a mansard roof' },
        { id: 'mono', label: 'Mono-pitch', wording: 'a mono-pitch roof' },
      ],
    },
    {
      id: 'roofCovering',
      label: 'Roof covering',
      type: 'single',
      options: [
        { id: 'slate', label: 'Natural slate', wording: 'natural slate' },
        { id: 'concrete-tile', label: 'Concrete tiles', wording: 'concrete interlocking tiles' },
        { id: 'clay-tile', label: 'Clay tiles', wording: 'clay plain tiles' },
        { id: 'stone-slate', label: 'Stone slate', wording: 'stone slates' },
        { id: 'felt', label: 'Felt / bitumen', wording: 'bituminous felt' },
        { id: 'single-ply', label: 'Single-ply membrane', wording: 'a single-ply membrane' },
        { id: 'grp', label: 'GRP / fibreglass', wording: 'GRP (fibreglass)' },
        { id: 'metal', label: 'Profiled metal', wording: 'profiled metal sheeting' },
        {
          id: 'fibre-cement',
          label: 'Fibre cement sheet',
          wording: 'fibre cement sheeting (which, depending on age, may contain asbestos)',
        },
      ],
    },
    {
      id: 'walls',
      label: 'Wall finish',
      type: 'single',
      options: [
        { id: 'brick', label: 'Facing brick', wording: 'finished in facing brickwork' },
        { id: 'render', label: 'Render', wording: 'rendered' },
        { id: 'pebble', label: 'Pebble-dash', wording: 'finished in pebble-dash render' },
        { id: 'stone', label: 'Natural stone', wording: 'of exposed natural stone' },
        { id: 'cladding', label: 'Cladding', wording: 'clad' },
        { id: 'tile-hung', label: 'Tile hanging', wording: 'partly tile hung' },
        { id: 'mixed', label: 'Mixed', wording: 'of mixed finishes' },
      ],
    },
    {
      id: 'windows',
      label: 'Windows',
      type: 'single',
      options: [
        { id: 'upvc-dg', label: 'uPVC double glazed', wording: 'uPVC double-glazed windows' },
        { id: 'timber-dg', label: 'Timber double glazed', wording: 'timber double-glazed windows' },
        { id: 'timber-sg', label: 'Timber single glazed', wording: 'timber single-glazed windows' },
        { id: 'alu-dg', label: 'Aluminium double glazed', wording: 'aluminium double-glazed windows' },
        { id: 'mixed', label: 'Mixed', wording: 'a mixture of window types' },
      ],
    },
    {
      id: 'bedrooms',
      label: 'No. bedrooms',
      type: 'number',
      sectors: ['domestic'],
      placeholder: '3',
    },
    {
      id: 'occupancy',
      label: 'Occupancy',
      type: 'single',
      options: [
        { id: 'occupied', label: 'Occupied', wording: 'occupied' },
        { id: 'unoccupied', label: 'Unoccupied', wording: 'unoccupied' },
        { id: 'partial', label: 'Partially occupied', wording: 'partially occupied' },
        { id: 'tenanted', label: 'Tenanted', wording: 'tenanted' },
      ],
    },
    {
      id: 'weather',
      label: 'Weather at inspection',
      type: 'single',
      options: [
        { id: 'dry', label: 'Dry', wording: 'dry' },
        { id: 'light-rain', label: 'Light rain', wording: 'light rain' },
        { id: 'heavy-rain', label: 'Heavy rain', wording: 'heavy rain' },
        { id: 'windy', label: 'Windy', wording: 'windy' },
        { id: 'storm', label: 'Storm conditions', wording: 'storm conditions' },
      ],
    },
  ],
};

// ─── Bronze: the roof survey (drone) ────────────────────────────────────────

export const ROOF: Group = {
  id: 'roof',
  title: 'Roof survey (drone)',
  subject: 'roof coverings',
  icon: 'airplane',
  storm: true,
  intro: 'Fly the drone, capture each roof slope, then answer the seven questions.',
  photoPrompt: 'Drone / roof photographs — each slope, ridge, valleys and chimney',
  minPhotos: 2,
  elementWording:
    'Roof coverings and associated weathering details need to be capable of resisting normal weather exposure. Defective coverings, failed mortar, damaged flashings, blocked drainage or deteriorated junctions can increase the risk of water ingress during severe weather.',
  questions: [
    conditionQuestion('Condition of the roof', 'Overall condition of the roof coverings'),
    {
      id: 'height',
      label: 'Height of the roof',
      prompt: 'Approximate height to the ridge',
      type: 'number',
      unit: 'm',
      placeholder: '8.5',
      help: 'Read from the drone altimeter at ridge level.',
      frame: 'The approximate height to the ridge was estimated at {value} m.',
    },
    yesNo('over11m', 'Over 11 metres?', 'Is the building over 11 metres in height?', {
      yes: {
        wording:
          'The building was assessed as exceeding 11 metres in height. Buildings of this height can be subject to additional fire-safety requirements relating to the external wall system, and further checking of the external wall construction would be required.',
        tone: 'fair',
        finding: flag(3, 'Building exceeds 11 metres in height — further checking of the external wall construction and any associated fire-safety requirements would be required.'),
      },
      no: { wording: 'The building was assessed as being under 11 metres in height.' },
      na: false,
      ai: false,
    }),
    yesNo('hrb', 'Higher-Risk Building?', 'Is it a Higher-Risk Building (18 m+ or 7+ storeys with 2+ residential units)?', {
      yes: {
        wording:
          'The building appears to meet the definition of a Higher-Risk Building under the Building Safety Act 2022. Further checking of its registration status and building safety information would be required.',
        tone: 'fair',
        finding: flag(2, 'Building appears to be a Higher-Risk Building under the Building Safety Act 2022 — further checking of registration and building safety information would be required.'),
      },
      no: { wording: 'The building does not appear to meet the definition of a Higher-Risk Building under the Building Safety Act 2022.' },
      na: { wording: 'Higher-Risk Building status could not be confirmed at the time of inspection.' },
      ai: false,
      help: 'Building Safety Act 2022: at least 18 m or 7 storeys, with at least two residential units.',
    }),
    yesNo('coverings', 'Slipped / missing coverings', 'Are there slipped, cracked, missing or displaced slates or tiles?', {
      yes: {
        wording:
          `Slipped, cracked, missing or displaced roof coverings were noted. These may allow water ingress during periods of wind-driven rain and ${FURTHER}.`,
        tone: 'poor',
        finding: flag(2, `Slipped, cracked or missing roof coverings — ${FURTHER}.`, true),
      },
      no: {
        wording: 'No slipped, cracked or missing roof coverings were visible from the vantage points available.',
        tone: 'good',
      },
    }),
    yesNo('stormDamage', 'Storm damage', 'Is there visible evidence of recent storm damage to the roof?', {
      yes: {
        wording:
          `Visible evidence consistent with recent storm damage was noted to the roof. The full extent could not be determined from a visual inspection and ${FURTHER}.`,
        tone: 'bad',
        finding: flag(1, `Evidence of recent storm damage to the roof — ${FURTHER}.`, true),
      },
      no: { wording: 'No visible evidence of recent storm damage to the roof was noted.', tone: 'good' },
    }),
    yesNo('details', 'Ridge, verge & flashings', 'Are ridge, hip, verge and flashing details secure and intact?', {
      yes: { wording: 'Ridge, hip, verge and flashing details appeared secure and intact.', tone: 'good' },
      no: {
        wording:
          `Defects were noted to the ridge, hip, verge and/or flashing details. Failed mortar or lifted flashings are a common point of water entry during severe weather and ${FURTHER}.`,
        tone: 'poor',
        finding: flag(2, `Defective ridge, hip, verge or flashing details — ${FURTHER}.`, true),
      },
    }),
  ],
};

// ─── Silver: external / storm readiness ─────────────────────────────────────

export const EXTERNAL: Group[] = [
  {
    id: 'gutters',
    title: 'Roof drainage / gutters',
    subject: 'rainwater goods',
    icon: 'drop.triangle',
    storm: true,
    photoPrompt: 'Gutters, downpipes and outlets',
    elementWording:
      'Rainwater goods need to be kept clear, securely fixed and capable of discharging water effectively. Defects or blockages may increase the risk of water overflowing against the building fabric.',
    questions: [
      conditionQuestion(),
      yesNo('blocked', 'Blocked / vegetation', 'Are gutters holding debris or vegetation?', {
        yes: {
          wording: 'Gutters were noted to be holding debris and/or vegetation, which may cause water to overflow against the building fabric.',
          tone: 'fair',
          finding: flag(3, 'Gutters holding debris or vegetation — further checking and clearance would potentially be required.', true),
        },
        no: { wording: 'Gutters appeared clear of debris where visible.', tone: 'good' },
      }),
      yesNo('leaking', 'Leaking / disconnected', 'Are any gutters or downpipes leaking, cracked or disconnected?', {
        yes: {
          wording: `Leaking, cracked or disconnected sections of rainwater goods were noted and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Leaking, cracked or disconnected gutters/downpipes — ${FURTHER}.`, true),
        },
        no: { wording: 'No leaking or disconnected sections were visible.', tone: 'good' },
      }),
      yesNo('staining', 'Overflow staining', 'Is there staining to walls below gutters indicating overflow?', {
        yes: {
          wording: 'Staining to the wall surfaces below the gutter line indicates that overflowing has occurred.',
          tone: 'fair',
          finding: flag(3, 'Staining indicating gutter overflow — further checking of gutter falls and capacity would be required.', true),
        },
        no: { wording: 'No staining indicative of overflow was noted.', tone: 'good' },
      }),
      yesNo('discharge', 'Discharge to gully', 'Do downpipes discharge into a gully or drainage point?', {
        yes: { wording: 'Downpipes were observed to discharge into gullies or drainage points.', tone: 'good' },
        no: {
          wording: 'One or more downpipes discharge directly onto the ground or hardstanding, which may concentrate water against the base of the walls.',
          tone: 'fair',
          finding: flag(3, 'Downpipe(s) discharging onto ground rather than to drainage — further checking would be required.'),
        },
      }),
    ],
  },
  {
    id: 'fascia',
    title: 'Fascia / soffits',
    subject: 'fascias and soffits',
    icon: 'rectangle.split.3x1',
    storm: true,
    photoPrompt: 'Fascias, soffits and bargeboards',
    questions: [
      conditionQuestion(),
      yesNo('decay', 'Rot / decay', 'Is there rot, splitting or decay to timber boards?', {
        yes: {
          wording: `Rot, splitting and/or decay was noted to the timber fascias, soffits or bargeboards and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(3, `Decay to fascias/soffits — ${FURTHER}.`),
        },
        no: { wording: 'No decay was noted to the boards where visible.', tone: 'good' },
        na: { wording: 'Fascias and soffits are of non-timber (e.g. uPVC) construction.' },
      }),
      yesNo('loose', 'Loose / missing boards', 'Are any boards loose, missing or displaced?', {
        yes: {
          wording: 'Loose, missing or displaced boards were noted. These are vulnerable to further displacement in high winds.',
          tone: 'poor',
          finding: flag(2, `Loose or missing fascia/soffit boards — ${FURTHER}.`, true),
        },
        no: { wording: 'Boards appeared secure.', tone: 'good' },
      }),
      yesNo('pests', 'Bird / pest entry', 'Is there evidence of bird or pest entry at eaves level?', {
        yes: {
          wording: 'Evidence of bird or pest entry was noted at eaves level.',
          tone: 'fair',
          finding: flag(3, 'Bird or pest entry at eaves — further checking would be required.'),
        },
        no: { wording: 'No evidence of bird or pest entry was noted.' },
      }),
    ],
  },
  {
    id: 'verge',
    title: 'Verge / ridge details',
    subject: 'verge and ridge details',
    icon: 'triangle',
    storm: true,
    photoPrompt: 'Ridge, hips and verges',
    questions: [
      conditionQuestion(),
      yesNo('mortar', 'Mortar cracked / missing', 'Is ridge or hip mortar cracked or missing?', {
        yes: {
          wording: `Cracked or missing bedding mortar was noted to the ridge and/or hip tiles and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Cracked or missing ridge/hip mortar — ${FURTHER}.`, true),
        },
        no: { wording: 'Ridge and hip bedding appeared intact.', tone: 'good' },
      }),
      yesNo('displaced', 'Loose ridge / hip tiles', 'Are any ridge or hip tiles loose or displaced?', {
        yes: {
          wording: 'Loose or displaced ridge/hip tiles were noted. These present a risk of further displacement during high winds.',
          tone: 'bad',
          finding: flag(1, `Loose or displaced ridge/hip tiles — ${FURTHER}.`, true),
        },
        no: { wording: 'No loose ridge or hip tiles were noted.', tone: 'good' },
      }),
      yesNo('verge', 'Verge defective', 'Is verge pointing or the dry-verge system defective?', {
        yes: {
          wording: `Defects were noted to the verge pointing or dry-verge system and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Defective verge pointing/dry-verge — ${FURTHER}.`, true),
        },
        no: { wording: 'Verges appeared sound.', tone: 'good' },
      }),
    ],
  },
  {
    id: 'chimney',
    title: 'Chimney stack / flashings',
    subject: 'chimney stack and flashings',
    icon: 'building.columns',
    storm: true,
    photoPrompt: 'Chimney stack, pots and flashings',
    questions: [
      yesNo('present', 'Chimney present?', 'Is there a chimney stack?', {
        yes: { wording: '' },
        no: { wording: 'There is no chimney stack to this property.' },
        na: false,
      }),
      { ...conditionQuestion(), showIf: { questionId: 'present', equals: 'yes' } },
      yesNo('leaning', 'Leaning / out of plumb', 'Is the stack leaning or visibly out of plumb?', {
        yes: {
          wording: 'The chimney stack appeared to be leaning or out of plumb. A stack in this condition may be vulnerable to collapse in high winds and further investigation would be required as a matter of urgency.',
          tone: 'bad',
          finding: flag(1, 'Chimney stack leaning / out of plumb — further investigation would be required as a matter of urgency.', true),
        },
        no: { wording: 'The stack appeared upright.', tone: 'good' },
        na: false,
        showIf: { questionId: 'present', equals: 'yes' },
      }),
      yesNo('pointing', 'Eroded pointing', 'Is the pointing eroded or missing?', {
        yes: {
          wording: `Eroded or missing pointing was noted to the chimney stack and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Eroded chimney pointing — ${FURTHER}.`, true),
        },
        no: { wording: 'Pointing to the stack appeared serviceable.', tone: 'good' },
        showIf: { questionId: 'present', equals: 'yes' },
      }),
      yesNo('flashings', 'Flashings defective', 'Are the flashings lifted, cracked or defective?', {
        yes: {
          wording: `The chimney flashings appeared lifted, cracked or defective, which is a common route for water ingress, and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Defective chimney flashings — ${FURTHER}.`, true),
        },
        no: { wording: 'Flashings appeared intact.', tone: 'good' },
        showIf: { questionId: 'present', equals: 'yes' },
      }),
      yesNo('pots', 'Pots / cowls damaged', 'Are pots or cowls damaged or loose?', {
        yes: {
          wording: 'Damaged or loose chimney pots/cowls were noted, which present a risk of displacement in high winds.',
          tone: 'poor',
          finding: flag(2, `Damaged or loose chimney pots/cowls — ${FURTHER}.`, true),
        },
        no: { wording: 'Pots and cowls appeared secure.', tone: 'good' },
        showIf: { questionId: 'present', equals: 'yes' },
      }),
    ],
  },
  {
    id: 'walls',
    title: 'External walls',
    subject: 'external walls',
    icon: 'square.stack.3d.up',
    storm: true,
    photoPrompt: 'Each elevation, plus close-ups of cracking',
    elementWording:
      'External walls and associated joints need to remain weather-resistant. Open joints, cracking, failed pointing or defective interfaces may allow water penetration during periods of wind-driven rain.',
    questions: [
      conditionQuestion(),
      yesNo('cracking', 'Cracking', 'Is there visible cracking to the external walls?', {
        yes: {
          wording: 'Cracking was noted to the external walls. Cracking can have a number of causes and further investigation by an appropriately qualified person would be required to establish its cause and significance.',
          tone: 'poor',
          finding: flag(2, 'Cracking to external walls — further investigation would be required to establish cause and significance.'),
        },
        no: { wording: 'No significant cracking was noted to the external walls.', tone: 'good' },
      }),
      yesNo('pointing', 'Eroded pointing', 'Is pointing eroded, or are there open joints?', {
        yes: {
          wording: `Eroded pointing and/or open mortar joints were noted and ${FURTHER}.`,
          tone: 'fair',
          finding: flag(3, `Eroded pointing / open joints to walls — ${FURTHER}.`, true),
        },
        no: { wording: 'Pointing appeared generally serviceable.', tone: 'good' },
      }),
      yesNo('render', 'Render defects', 'Is render cracked, hollow or debonded?', {
        yes: {
          wording: `Cracked, hollow-sounding or debonded render was noted. Defective render can allow water to become trapped behind it and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Defective render — ${FURTHER}.`, true),
        },
        no: { wording: 'Render appeared sound where visible.', tone: 'good' },
        na: { wording: '' },
      }),
      yesNo('spalling', 'Spalling', 'Is there spalling or frost damage to brick or stone faces?', {
        yes: {
          wording: `Spalling and/or frost damage was noted to the masonry faces and ${FURTHER}.`,
          tone: 'fair',
          finding: flag(3, `Spalled masonry — ${FURTHER}.`),
        },
        no: { wording: 'No significant spalling was noted.', tone: 'good' },
      }),
      yesNo('dpc', 'DPC clear of ground', 'Is the damp-proof course visible and at least 150 mm above ground level?', {
        yes: { wording: 'The damp-proof course was visible and generally 150 mm or more above external ground level.', tone: 'good' },
        no: {
          wording: 'External ground levels appeared to be at or near damp-proof course level in places, which may allow moisture to bridge the DPC. Further checking would be required.',
          tone: 'fair',
          finding: flag(3, 'Ground levels at or near DPC — further checking would be required.'),
        },
        na: { wording: 'A damp-proof course could not be identified externally.' },
      }),
    ],
  },
  {
    id: 'windows',
    title: 'Windows / seals',
    subject: 'windows and seals',
    icon: 'window.vertical.closed',
    storm: true,
    photoPrompt: 'Windows, sills and seals',
    questions: [
      conditionQuestion(),
      yesNo('misting', 'Failed DG units', 'Is there misting between panes (failed double-glazing seals)?', {
        yes: {
          wording: 'Misting between panes was noted to one or more double-glazed units, indicating failed hermetic seals.',
          tone: 'fair',
          finding: flag(4, 'Failed double-glazing seals (misting) — further checking would be required.'),
        },
        no: { wording: 'No misting between panes was noted.', tone: 'good' },
        na: { wording: 'The windows are single glazed.' },
      }),
      yesNo('broken', 'Cracked / broken panes', 'Are any panes cracked or broken?', {
        yes: {
          wording: `Cracked or broken glazing was noted and ${FURTHER}.`,
          tone: 'bad',
          finding: flag(1, `Cracked or broken glazing — ${FURTHER}.`, true),
        },
        no: { wording: 'No cracked or broken panes were noted.', tone: 'good' },
      }),
      yesNo('frames', 'Frame decay / damage', 'Are frames rotten, damaged or distorted?', {
        yes: {
          wording: `Decay, damage or distortion was noted to window frames and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Defective window frames — ${FURTHER}.`, true),
        },
        no: { wording: 'Frames appeared sound.', tone: 'good' },
      }),
      yesNo('sealant', 'Perimeter sealant failed', 'Is perimeter sealant around frames failed or missing?', {
        yes: {
          wording: 'Perimeter sealant was failed or missing in places, which may allow wind-driven rain to penetrate around the frames.',
          tone: 'fair',
          finding: flag(3, `Failed perimeter sealant to windows — ${FURTHER}.`, true),
        },
        no: { wording: 'Perimeter sealant appeared intact.', tone: 'good' },
      }),
    ],
  },
  {
    id: 'doors',
    title: 'External doors',
    subject: 'external doors',
    icon: 'door.left.hand.closed',
    storm: true,
    photoPrompt: 'Each external door and threshold',
    questions: [
      conditionQuestion(),
      yesNo('damage', 'Damage / decay', 'Are doors, frames or thresholds damaged or decayed?', {
        yes: {
          wording: `Damage or decay was noted to external doors, frames or thresholds and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(3, `Damaged/decayed external doors or thresholds — ${FURTHER}.`, true),
        },
        no: { wording: 'Doors, frames and thresholds appeared sound.', tone: 'good' },
      }),
      yesNo('seals', 'Weather seals', 'Are weather seals or weatherboards defective?', {
        yes: {
          wording: 'Weather seals or weatherboards were defective, which may allow wind-driven rain to enter at door openings.',
          tone: 'fair',
          finding: flag(3, 'Defective door weather seals — further checking would be required.', true),
        },
        no: { wording: 'Weather seals appeared effective.', tone: 'good' },
      }),
      yesNo('secure', 'Secure', 'Do doors appear secure, with locks fitted?', {
        yes: { wording: 'External doors appeared secure with locks fitted.', tone: 'good' },
        no: {
          wording: 'One or more external doors did not appear secure.',
          tone: 'poor',
          finding: flag(2, 'External door(s) not secure — further checking would be required.'),
        },
        ai: false,
      }),
    ],
  },
  {
    id: 'drainage',
    title: 'Drainage, gullies & French drains',
    subject: 'below-ground drainage and gullies',
    icon: 'water.waves',
    storm: true,
    photoPrompt: 'Gullies, inspection chambers and any French drains',
    questions: [
      conditionQuestion(),
      yesNo('gullies', 'Gullies blocked', 'Are gullies blocked or overflowing?', {
        yes: {
          wording: 'Gullies were noted to be blocked or overflowing, which may result in water discharging against the building.',
          tone: 'poor',
          finding: flag(2, `Blocked or overflowing gullies — ${FURTHER}.`, true),
        },
        no: { wording: 'Gullies appeared clear and free-running where visible.', tone: 'good' },
      }),
      yesNo('chambers', 'Chamber covers', 'Are inspection chamber covers damaged or missing?', {
        yes: {
          wording: 'Inspection chamber covers were damaged or missing, presenting a safety hazard.',
          tone: 'poor',
          finding: flag(2, 'Damaged or missing inspection chamber covers — further checking would be required.'),
        },
        no: { wording: 'Inspection chamber covers appeared intact.', tone: 'good' },
      }),
      yesNo('frenchDrain', 'French drain present?', 'Is there a French drain or perimeter drainage system?', {
        yes: { wording: 'A French drain / perimeter drainage system is present around the property.' },
        no: { wording: 'No French drain or perimeter drainage system was identified.' },
        na: { wording: 'The presence of perimeter drainage could not be established.' },
      }),
      yesNo('frenchClear', 'French drain clear', 'Does the French drain appear clear and free-draining?', {
        yes: { wording: 'The perimeter drainage appeared clear and free-draining where visible.', tone: 'good' },
        no: {
          wording: `The perimeter drainage appeared silted, obstructed or overgrown, which may reduce its effectiveness during heavy rainfall, and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `French drain silted or obstructed — ${FURTHER}.`, true),
        },
        showIf: { questionId: 'frenchDrain', equals: 'yes' },
      }),
      yesNo('ponding', 'Ponding near building', 'Is there ponding or poor surface water drainage next to the building?', {
        yes: {
          wording: 'Evidence of ponding or poor surface-water drainage was noted adjacent to the building.',
          tone: 'fair',
          finding: flag(3, 'Ponding / poor surface water drainage adjacent to building — further checking would be required.', true),
        },
        no: { wording: 'No ponding was noted adjacent to the building.', tone: 'good' },
      }),
    ],
  },
  {
    id: 'boundaries',
    title: 'Boundary walls & fences',
    subject: 'boundary walls, fences and gates',
    icon: 'square.dashed',
    storm: true,
    photoPrompt: 'Boundary walls, fences, gates and retaining walls',
    questions: [
      conditionQuestion(),
      yesNo('leaning', 'Leaning / unstable walls', 'Are boundary walls leaning, cracked or unstable?', {
        yes: {
          wording: 'Boundary walls were noted to be leaning, cracked or unstable. Walls in this condition are particularly vulnerable to collapse in high winds and further investigation would be required.',
          tone: 'bad',
          finding: flag(1, 'Leaning, cracked or unstable boundary wall — further investigation would be required.', true),
        },
        no: { wording: 'Boundary walls appeared stable.', tone: 'good' },
      }),
      yesNo('fences', 'Fences / gates damaged', 'Are fences or gates damaged, loose or rotten?', {
        yes: {
          wording: 'Fence panels, posts or gates were damaged, loose or decayed and are vulnerable to wind damage.',
          tone: 'fair',
          finding: flag(3, `Damaged or loose fences/gates — ${FURTHER}.`, true),
        },
        no: { wording: 'Fences and gates appeared secure.', tone: 'good' },
      }),
      yesNo('retaining', 'Retaining wall movement', 'Do any retaining walls show bulging or movement?', {
        yes: {
          wording: 'Bulging or movement was noted to a retaining wall and further investigation by an appropriately qualified person would be required.',
          tone: 'bad',
          finding: flag(2, 'Movement to retaining wall — further investigation would be required.'),
        },
        no: { wording: 'No movement was noted to retaining walls.', tone: 'good' },
        na: { wording: 'There are no retaining walls.' },
      }),
    ],
  },
  {
    id: 'trees',
    title: 'Trees & grounds',
    subject: 'trees and grounds',
    icon: 'tree',
    storm: true,
    photoPrompt: 'Trees near the building, paths and drives',
    questions: [
      yesNo('fallingDistance', 'Trees within falling distance', 'Are there large trees within falling distance of the building?', {
        yes: {
          wording: 'Large trees were noted within falling distance of the building. These present a risk of damage during storm conditions and their condition would require further checking.',
          tone: 'fair',
          finding: flag(3, 'Large trees within falling distance of the building — further checking of tree condition would be required.', true),
        },
        no: { wording: 'No large trees were noted within falling distance of the building.', tone: 'good' },
      }),
      yesNo('influence', 'Trees near foundations', 'Are trees close enough to potentially influence the foundations?', {
        yes: {
          wording: 'Trees were noted close enough to the building to potentially influence the foundations, particularly on shrinkable clay soils. Further checking would be required.',
          tone: 'fair',
          finding: flag(3, 'Trees close to the building that may influence foundations — further checking would be required.'),
        },
        no: { wording: 'No trees were noted close enough to influence the foundations.', tone: 'good' },
      }),
      yesNo('paths', 'Paths / drives defective', 'Are paths or drives cracked, uneven or presenting trip hazards?', {
        yes: {
          wording: 'Paths and/or drives were cracked or uneven in places, presenting potential trip hazards.',
          tone: 'fair',
          finding: flag(4, 'Uneven paths/drives presenting trip hazards — further checking would be required.'),
        },
        no: { wording: 'Paths and drives appeared serviceable.', tone: 'good' },
      }),
    ],
  },
];

// ─── Gold: rooms ────────────────────────────────────────────────────────────

export const ROOM_TYPES: { id: string; label: string; sectors?: ('domestic' | 'commercial')[] }[] = [
  { id: 'living', label: 'Living room', sectors: ['domestic'] },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'dining', label: 'Dining room', sectors: ['domestic'] },
  { id: 'bedroom', label: 'Bedroom', sectors: ['domestic'] },
  { id: 'bathroom', label: 'Bathroom', sectors: ['domestic'] },
  { id: 'wc', label: 'WC' },
  { id: 'hall', label: 'Hallway' },
  { id: 'landing', label: 'Landing', sectors: ['domestic'] },
  { id: 'utility', label: 'Utility', sectors: ['domestic'] },
  { id: 'conservatory', label: 'Conservatory', sectors: ['domestic'] },
  { id: 'office', label: 'Office' },
  { id: 'reception', label: 'Reception', sectors: ['commercial'] },
  { id: 'meeting', label: 'Meeting room', sectors: ['commercial'] },
  { id: 'sales', label: 'Sales floor', sectors: ['commercial'] },
  { id: 'store', label: 'Store room' },
  { id: 'plant', label: 'Plant room', sectors: ['commercial'] },
  { id: 'other', label: 'Other' },
];

export const LEVELS = ['Basement', 'Ground floor', 'First floor', 'Second floor', 'Third floor', 'Loft'];

/** Room questions. Finishes are multi-select phrases joined into one sentence each. */
export const ROOM_QUESTIONS: Question[] = [
  {
    id: 'ceiling',
    label: 'Ceiling',
    type: 'multi',
    ai: true,
    frame: 'The ceiling comprises {list}.',
    options: [
      { id: 'plaster-smooth', label: 'Plastered, smooth', phrase: 'a smooth plastered finish' },
      {
        id: 'textured',
        label: 'Textured / Artex',
        phrase: 'a textured (Artex-type) coating',
        wording: 'Textured coatings of this type applied before 2000 may contain asbestos; further checking would be required before any disturbance.',
      },
      { id: 'decorative', label: 'Decorative ceiling', phrase: 'decorative plasterwork' },
      { id: 'rose', label: 'Ceiling rose', phrase: 'a ceiling rose' },
      { id: 'coving', label: 'Coving / cornice', phrase: 'coving' },
      { id: 'suspended', label: 'Suspended tiles', phrase: 'a suspended tile system' },
      { id: 'beams', label: 'Exposed beams', phrase: 'exposed timber beams' },
      { id: 'sloping', label: 'Sloping / skeiling', phrase: 'sloping sections following the roof line' },
    ],
  },
  {
    id: 'walls',
    label: 'Walls',
    type: 'multi',
    ai: true,
    frame: 'Walls are finished with {list}.',
    options: [
      { id: 'skim-smooth', label: 'Plaster skim, smooth', phrase: 'a smooth plaster skim' },
      { id: 'textured', label: 'Textured plaster', phrase: 'textured plaster' },
      { id: 'paper', label: 'Wallpaper / lining', phrase: 'wallpaper or lining paper' },
      { id: 'tiled', label: 'Ceramic tiling', phrase: 'ceramic tiling' },
      { id: 'panelled', label: 'Timber panelling', phrase: 'timber panelling' },
      { id: 'exposed', label: 'Exposed brick / stone', phrase: 'exposed masonry' },
      { id: 'painted-block', label: 'Painted blockwork', phrase: 'painted blockwork' },
      { id: 'drylined', label: 'Plasterboard / dry-lined', phrase: 'dry-lined plasterboard' },
    ],
  },
  {
    id: 'floor',
    label: 'Floor',
    type: 'multi',
    ai: true,
    frame: 'The floor is finished with {list}.',
    options: [
      { id: 'solid-wood', label: 'Solid wood', phrase: 'solid wood flooring' },
      { id: 'engineered', label: 'Engineered / laminate', phrase: 'engineered or laminate boarding' },
      { id: 'carpet', label: 'Carpet', phrase: 'fitted carpet' },
      { id: 'tiles', label: 'Ceramic / stone tiles', phrase: 'ceramic or stone tiling' },
      { id: 'vinyl', label: 'Vinyl / LVT', phrase: 'vinyl / LVT' },
      { id: 'boards', label: 'Floorboards', phrase: 'exposed timber floorboards' },
      { id: 'concrete', label: 'Concrete / screed', phrase: 'a concrete or screeded surface' },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    type: 'multi',
    ai: true,
    frame: 'Notable features include {list}.',
    options: [
      { id: 'chimney-breast', label: 'Chimney breast', phrase: 'a chimney breast' },
      { id: 'fireplace', label: 'Fireplace', phrase: 'a fireplace' },
      { id: 'kitchen-units', label: 'Fitted kitchen', phrase: 'fitted kitchen units' },
      { id: 'sanitaryware', label: 'Sanitaryware', phrase: 'sanitaryware' },
      { id: 'built-in', label: 'Built-in storage', phrase: 'built-in storage' },
      { id: 'radiator', label: 'Radiator', phrase: 'a radiator' },
      { id: 'bay', label: 'Bay window', phrase: 'a bay window' },
      { id: 'french-doors', label: 'French / patio doors', phrase: 'French or patio doors' },
      { id: 'loft-hatch', label: 'Loft hatch', phrase: 'a loft hatch' },
      { id: 'staircase', label: 'Staircase', phrase: 'a staircase' },
    ],
  },
  {
    id: 'condition',
    label: 'Room condition',
    type: 'single',
    ai: true,
    options: OVERALL_CONDITIONS.map((o): Option => ({
      ...o,
      wording: {
        excellent: 'The room was found to be in excellent condition, with finishes well presented and no defects noted.',
        good: 'The room was found to be in good condition, with no significant defects noted within the limitations of a visual inspection.',
        fair: 'The room was found to be in fair condition, with signs of wear and minor deterioration to finishes.',
        poor: `The room was found to be in poor condition. Defects noted within the room ${FURTHER}.`,
        unsatisfactory: `The room was found to be in unsatisfactory condition. Significant defects were noted which ${FURTHER}.`,
        na: '',
      }[o.id],
    })),
  },
  yesNo('damp', 'Damp / staining / mould', 'Is there evidence of damp, water staining or mould?', {
    yes: {
      wording: `Evidence of dampness, water staining and/or mould growth was noted. The cause could not be determined from a visual inspection and ${FURTHER}.`,
      tone: 'poor',
      finding: flag(2, `Damp, staining or mould — ${FURTHER}.`),
    },
    no: { wording: 'No evidence of dampness or water staining was noted.', tone: 'good' },
  }),
  yesNo('cracking', 'Cracking', 'Is there cracking to walls or ceilings?', {
    yes: {
      wording: 'Cracking was noted to wall and/or ceiling surfaces. Further checking would be required to establish whether this is of structural significance or is typical shrinkage cracking.',
      tone: 'fair',
      finding: flag(3, 'Cracking to internal finishes — further checking would be required.'),
    },
    no: { wording: 'No significant cracking was noted.', tone: 'good' },
  }),
  yesNo('damage', 'Damage to finishes', 'Is there physical damage to finishes (holes, impact damage)?', {
    yes: {
      wording: 'Physical damage to the finishes was noted which would potentially require patch repair.',
      tone: 'fair',
      finding: flag(3, 'Physical damage to finishes — patch repair would potentially be required.'),
    },
    no: { wording: 'No physical damage to finishes was noted.', tone: 'good' },
  }),
  yesNo('ventilation', 'Ventilation adequate', 'Is ventilation adequate (opening window or extract present)?', {
    yes: { wording: 'Ventilation appeared adequate.', tone: 'good' },
    no: {
      wording: 'Ventilation appeared limited, which may increase the risk of condensation.',
      tone: 'fair',
      finding: flag(4, 'Limited ventilation — further checking would be required.'),
    },
  }),
];

// ─── Gold: roof space, services and damp ────────────────────────────────────

export const INTERNAL: Group[] = [
  {
    id: 'loft',
    title: 'Roof space / loft',
    subject: 'roof space',
    icon: 'triangle.lefthalf.filled',
    photoPrompt: 'Roof timbers, underside of coverings, insulation',
    questions: [
      yesNo('accessed', 'Roof space accessed?', 'Was the roof space accessed?', {
        yes: { wording: 'The roof space was accessed and inspected from the hatch / boarded areas.' },
        no: { wording: 'The roof space was not accessed and no comment can be made on its condition.' },
        na: { wording: 'There is no accessible roof space.' },
        ai: false,
      }),
      yesNo('ingress', 'Water ingress', 'Is there evidence of water ingress or staining to timbers?', {
        yes: {
          wording: `Evidence of water ingress and/or staining was noted within the roof space and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Water ingress within the roof space — ${FURTHER}.`, true),
        },
        no: { wording: 'No evidence of water ingress was noted within the roof space.', tone: 'good' },
        showIf: { questionId: 'accessed', equals: 'yes' },
      }),
      yesNo('timbers', 'Timber defects', 'Are there signs of timber decay, insect attack or deflection?', {
        yes: {
          wording: 'Signs of timber decay, insect attack and/or deflection were noted to the roof structure and further investigation would be required.',
          tone: 'poor',
          finding: flag(2, 'Defects to roof timbers — further investigation would be required.'),
        },
        no: { wording: 'Roof timbers appeared sound where visible.', tone: 'good' },
        showIf: { questionId: 'accessed', equals: 'yes' },
      }),
      yesNo('insulation', 'Insulation present', 'Is insulation present between/over the joists?', {
        yes: { wording: 'Insulation is present within the roof space.', tone: 'good' },
        no: {
          wording: 'Insulation was absent or limited within the roof space.',
          tone: 'fair',
          finding: flag(4, 'Absent or limited loft insulation — further checking would be required.'),
        },
        showIf: { questionId: 'accessed', equals: 'yes' },
      }),
      yesNo('underlay', 'Underlay intact', 'Is the roof underlay / sarking intact?', {
        yes: { wording: 'The roof underlay appeared intact where visible.', tone: 'good' },
        no: {
          wording: `The roof underlay was torn, missing or deteriorated in places and ${FURTHER}.`,
          tone: 'fair',
          finding: flag(3, `Defective roof underlay — ${FURTHER}.`, true),
        },
        na: { wording: 'There is no underlay, which is typical of a roof of this age.' },
        showIf: { questionId: 'accessed', equals: 'yes' },
      }),
    ],
  },
  {
    id: 'services',
    title: 'Services & safety (visual)',
    subject: 'visible services',
    icon: 'bolt.shield',
    intro: 'Visual only — services are not tested.',
    photoPrompt: 'Consumer unit, boiler, alarms',
    questions: [
      yesNo('smoke', 'Smoke alarms', 'Are smoke alarms fitted on each floor?', {
        yes: { wording: 'Smoke alarms were noted on each floor.', tone: 'good' },
        no: {
          wording: 'Smoke alarms were not noted on every floor.',
          tone: 'poor',
          finding: flag(2, 'Smoke alarms not present on every floor — further checking would be required.'),
        },
        ai: false,
      }),
      yesNo('co', 'CO alarm', 'Is a carbon monoxide alarm fitted near fuel-burning appliances?', {
        yes: { wording: 'A carbon monoxide alarm was noted near fuel-burning appliances.', tone: 'good' },
        no: {
          wording: 'No carbon monoxide alarm was noted near fuel-burning appliances.',
          tone: 'poor',
          finding: flag(2, 'No carbon monoxide alarm noted — further checking would be required.'),
        },
        na: { wording: 'No fuel-burning appliances were noted.' },
        ai: false,
      }),
      yesNo('consumer', 'Modern consumer unit', 'Is the consumer unit of a modern type with RCD protection?', {
        yes: { wording: 'The consumer unit appeared to be of a modern type incorporating RCD protection.', tone: 'good' },
        no: {
          wording: 'The consumer unit appeared dated and may not incorporate RCD protection. Further checking of the electrical installation by a qualified electrician would be required.',
          tone: 'fair',
          finding: flag(3, 'Dated consumer unit — further checking of the electrical installation would be required.'),
        },
      }),
      yesNo('leaks', 'Visible leaks', 'Are there visible leaks from plumbing or heating pipework?', {
        yes: {
          wording: `Visible leaks were noted from plumbing/heating pipework and ${FURTHER}.`,
          tone: 'bad',
          finding: flag(1, `Active leak from plumbing/heating pipework — ${FURTHER}.`),
        },
        no: { wording: 'No visible leaks were noted from exposed pipework.', tone: 'good' },
      }),
    ],
  },
  {
    id: 'damp',
    title: 'Damp, condensation & movement',
    subject: 'internal fabric',
    icon: 'humidity',
    photoPrompt: 'Any staining, mould or distortion',
    questions: [
      yesNo('rising', 'Rising / penetrating damp', 'Is there evidence of rising or penetrating damp?', {
        yes: {
          wording: `Evidence consistent with rising and/or penetrating damp was noted and ${FURTHER}.`,
          tone: 'poor',
          finding: flag(2, `Rising/penetrating damp — ${FURTHER}.`),
        },
        no: { wording: 'No evidence of rising or penetrating damp was noted.', tone: 'good' },
      }),
      yesNo('condensation', 'Condensation / mould', 'Is there condensation or mould growth?', {
        yes: {
          wording: 'Condensation and/or mould growth was noted, which is commonly associated with limited ventilation and heating.',
          tone: 'fair',
          finding: flag(3, 'Condensation/mould — further checking of ventilation would be required.'),
        },
        no: { wording: 'No significant condensation or mould growth was noted.', tone: 'good' },
      }),
      yesNo('decay', 'Timber decay / woodworm', 'Is there timber decay or woodworm?', {
        yes: {
          wording: 'Evidence of timber decay and/or wood-boring insect activity was noted and further investigation would be required.',
          tone: 'poor',
          finding: flag(2, 'Timber decay / woodworm — further investigation would be required.'),
        },
        no: { wording: 'No timber decay or insect activity was noted where visible.', tone: 'good' },
      }),
      yesNo('movement', 'Structural movement', 'Is there evidence of movement (sloping floors, distorted openings)?', {
        yes: {
          wording: 'Evidence of structural movement was noted internally, such as sloping floors or distorted openings. Further investigation by an appropriately qualified person would be required to establish whether the movement is historic or ongoing.',
          tone: 'poor',
          finding: flag(2, 'Internal evidence of structural movement — further investigation would be required.'),
        },
        no: { wording: 'No evidence of significant structural movement was noted internally.', tone: 'good' },
      }),
    ],
  },
];

// ─── Outbuildings (Section 4) ───────────────────────────────────────────────

export const OUTBUILDING_TYPES = ['Garage', 'Summerhouse', 'Garden room', 'Shed', 'Workshop', 'Other'];

export const OUTBUILDING_WORDING =
  'The structure was visually inspected for general condition, weather resistance and obvious defects. Maintenance requirements would need to be addressed to reduce vulnerability to wind and rain.';

export const INTERNAL_ROOM_WORDING =
  'Each room was visually inspected and its condition recorded against the selected assessment. Any identified defects are listed within the further investigation schedule of this Home MOT report together with their priority.';

// ─── Section 5: defects, maintenance & storm vulnerability ──────────────────

export const ASSESSMENT: Group = {
  id: 'assessment',
  title: 'Defects, maintenance & storm vulnerability',
  subject: 'property',
  icon: 'gauge.with.dots.needle.67percent',
  questions: [
    {
      id: 'maintenance',
      label: 'Maintenance standard',
      type: 'single',
      options: [
        { id: 'well', label: 'Well maintained', tone: 'good', wording: 'The property appeared to be well maintained.' },
        { id: 'generally', label: 'Generally maintained', tone: 'good', wording: 'The property appeared to be generally maintained, with some items of routine maintenance noted.' },
        { id: 'required', label: 'Maintenance required', tone: 'fair', wording: 'Items of maintenance were noted which would require attention to reduce vulnerability to weather-related damage.' },
        { id: 'poor', label: 'Poorly maintained', tone: 'poor', wording: `The property appeared to be poorly maintained. A number of items ${FURTHER}.` },
      ],
    },
    {
      id: 'storm',
      label: 'Storm vulnerability',
      type: 'single',
      options: [
        { id: 'low', label: 'Low', tone: 'good', wording: 'Storm vulnerability was assessed as low.' },
        { id: 'moderate', label: 'Moderate', tone: 'fair', wording: 'Storm vulnerability was assessed as moderate; some elements would require further checking ahead of adverse weather.' },
        { id: 'high', label: 'High', tone: 'poor', wording: `Storm vulnerability was assessed as high; several elements ${FURTHER} ahead of adverse weather.` },
        { id: 'immediate', label: 'Immediate attention required', tone: 'bad', wording: `Storm vulnerability was assessed as requiring immediate attention; elements identified ${FURTHER} without delay.` },
      ],
    },
    {
      id: 'defects',
      label: 'Pre-existing defects observed',
      type: 'single',
      options: [
        { id: 'none', label: 'None observed', tone: 'good', wording: 'No pre-existing defects were observed.' },
        { id: 'minor', label: 'Minor', tone: 'fair', wording: 'Minor pre-existing defects were observed.' },
        { id: 'significant', label: 'Significant', tone: 'poor', wording: 'Significant pre-existing defects were observed.' },
        { id: 'extensive', label: 'Extensive', tone: 'bad', wording: 'Extensive pre-existing defects were observed.' },
      ],
    },
    {
      id: 'repairs',
      label: 'Evidence of previous repair',
      type: 'single',
      options: [
        { id: 'none', label: 'None observed', tone: 'neutral', wording: 'No evidence of previous repair was observed.' },
        { id: 'good', label: 'Good repair', tone: 'good', wording: 'Evidence of previous repair was observed which appeared to have been carried out to a good standard.' },
        { id: 'questionable', label: 'Questionable repair', tone: 'fair', wording: 'Evidence of previous repair was observed, the standard of which was questionable; further checking would be required.' },
        { id: 'failed', label: 'Failed / deteriorated repair', tone: 'poor', wording: `Evidence of previous repair was observed which appeared to have failed or deteriorated and ${FURTHER}.` },
      ],
    },
    {
      id: 'ingress',
      label: 'Water ingress indicators',
      type: 'single',
      options: [
        { id: 'none', label: 'None observed', tone: 'good', wording: 'No indicators of water ingress were observed.' },
        { id: 'historic', label: 'Historic staining', tone: 'fair', wording: 'Historic staining was observed, the cause of which would require further checking.' },
        { id: 'moisture', label: 'Moisture indicators', tone: 'poor', wording: `Indicators of moisture were observed and ${FURTHER}.` },
        { id: 'active', label: 'Active ingress', tone: 'bad', wording: `Active water ingress was observed and ${FURTHER} as a matter of urgency.` },
      ],
    },
    {
      id: 'priority',
      label: 'Overall priority',
      type: 'single',
      options: [
        { id: 'routine', label: 'Routine', tone: 'good', wording: 'Matters identified are of a routine nature.' },
        { id: 'season', label: 'Before next storm season', tone: 'fair', wording: 'Matters identified would require attention before the next storm season.' },
        { id: 'urgent', label: 'Urgent', tone: 'poor', wording: 'Matters identified would require urgent further investigation.' },
        { id: 'immediate', label: 'Immediate', tone: 'bad', wording: 'Matters identified would require immediate further investigation.' },
      ],
    },
  ],
};

// ─── Fixed report text ──────────────────────────────────────────────────────

export const CLIENT_STATEMENT =
  'There are requirements within the property that would need further investment, further checking and potentially repairs.';

export const PURPOSE =
  'This Home MOT is a preventative property-condition inspection and is not a guarantee of insurance cover or future claim acceptance. Its purpose is to identify visible defects and maintenance issues so the policyholder can take reasonable preventative action.';

export const DISCLAIMER =
  'Important: This inspection is a visual preventative assessment and does not constitute an insurance policy interpretation, guarantee of cover, structural survey, specialist survey, or guarantee that an insurer will accept a future claim. Property Health Check UK is not authorised by the Financial Conduct Authority and this report does not contain recommendations or advice; matters are recorded as requiring further investigation, further checking and potentially repairs.';

export const BRAND = {
  name: 'Property Health Check UK®',
  product: 'Home MOT',
  title: 'Property Condition Inspection Report',
  strap: 'Protecting Homes Before Problems Become Claims.',
};

// ─── Lookups ────────────────────────────────────────────────────────────────

export const ALL_GROUPS: Group[] = [PROFILE, ROOF, ...EXTERNAL, ...INTERNAL, ASSESSMENT];

export function groupById(id: string): Group | undefined {
  return ALL_GROUPS.find((g) => g.id === id);
}

export function groupsForSection(sectionId: string): Group[] {
  switch (sectionId) {
    case 'roof':
      return [ROOF];
    case 'external':
      return EXTERNAL;
    case 'internal':
      return INTERNAL;
    case 'assessment':
      return [ASSESSMENT];
    default:
      return [];
  }
}
