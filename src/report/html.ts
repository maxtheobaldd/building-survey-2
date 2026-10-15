/**
 * Builds the Home MOT report as a self-contained A4 HTML document. expo-print renders it to PDF
 * and the report screen previews the same HTML, so what the surveyor sees is what gets sent.
 * Mirrors the sections of the client's Word template (PHCUK Home MOT).
 */
import {
  addressLine,
  canRate,
  draftSummary,
  findings,
  formatDate,
  groupAnswers,
  groupWording,
  photoRefs,
  photosFor,
  propertyDescription,
  RATING_LABEL,
  roomArea,
  roomWording,
  selectedOptions,
  suggestedRating,
  visibleQuestions,
} from '@/survey/engine';
import { ELEMENT_CONDITIONS, OVERALL_CONDITIONS } from '@/survey/builders';
import {
  ASSESSMENT,
  BRAND,
  CLIENT_STATEMENT,
  DISCLAIMER,
  EXTERNAL,
  INTERNAL,
  INTERNAL_ROOM_WORDING,
  OUTBUILDING_WORDING,
  PRIORITIES,
  PROFILE,
  PURPOSE,
  ROOF,
  ROOM_QUESTIONS,
  TIERS,
} from '@/survey/schema';
import type { Group, Inspection, Photo, PhotoOwner, Tone } from '@/survey/types';

export interface ReportOptions {
  /** Returns base64 JPEG for a stored photo path, or null if missing. */
  photoData: (rel: string) => string | null;
  inspector?: { name: string; qualifications: string; company: string; phone: string; email: string };
  generatedAt?: number;
}

const TONE_COLOR: Record<Tone, [string, string]> = {
  good: ['#1E6B40', '#E2F2E8'],
  fair: ['#8A5A00', '#FBF0D9'],
  poor: ['#A1421A', '#FBE6DB'],
  bad: ['#9B1C1C', '#F9DEDE'],
  neutral: ['#3D4B5C', '#E9ECEF'],
};

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const para = (s: string) =>
  esc(s)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${l}</p>`)
    .join('');

function badge(label: string, tone: Tone = 'neutral') {
  const [fg, bg] = TONE_COLOR[tone];
  return `<span class="badge" style="color:${fg};background:${bg}">${esc(label)}</span>`;
}

function medallion(tier: Inspection['tier'], size = 64) {
  const [hi, mid, lo] = TIERS[tier].colors;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="mf${tier}" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
  <linearGradient id="mr${tier}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient></defs>
  <circle cx="50" cy="50" r="48" fill="url(#mr${tier})"/><circle cx="50" cy="50" r="41" fill="url(#mf${tier})"/>
  <path d="M30 50 L50 32 L70 50" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="50" y="74" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="24" fill="#fff">${TIERS[tier].name[0]}</text>
</svg>`;
}

export function buildReportHtml(i: Inspection, opts: ReportOptions): string {
  const refs = photoRefs(i);
  const ins = i.instruction;
  const sector = i.sector;
  const fs = findings(i);
  const rating = i.summary.rating ?? suggestedRating(i);
  const draft = draftSummary(i);
  const summary = {
    keyVulnerabilities: i.summary.keyVulnerabilities ?? draft.keyVulnerabilities,
    priorityActions: i.summary.priorityActions ?? draft.priorityActions,
    inspectorSummary: i.summary.inspectorSummary ?? draft.inspectorSummary,
  };
  const ratingTone: Tone =
    rating === 'excellent' || rating === 'good' ? 'good' : rating === 'fair' ? 'fair' : rating === 'poor' ? 'poor' : 'bad';
  const tier = TIERS[i.tier];
  const rated = !!i.summary.rating || canRate(i);
  const ratingText = rated ? RATING_LABEL[rating] : 'Not yet assessed';
  const noOutbuildings = i.answers['outbuildings.none']?.value === 'yes';
  let n = 0;
  const h2 = (title: string) => `<h2><span class="num">${++n}</span>${esc(title)}</h2>`;

  const img = (p: Photo, cls = '') => {
    const data = opts.photoData(p.reportFile) ?? opts.photoData(p.file);
    if (!data) return '';
    return `<figure class="${cls}"><img src="data:image/jpeg;base64,${data}"/><figcaption><b>${refs.get(p.id) ?? ''}</b> ${esc(p.caption)}</figcaption></figure>`;
  };
  const gallery = (owner: PhotoOwner) => {
    const ps = photosFor(i, owner);
    return ps.length ? `<div class="gallery">${ps.map((p) => img(p)).join('')}</div>` : '';
  };
  const refList = (owner: PhotoOwner) =>
    photosFor(i, owner)
      .map((p) => refs.get(p.id))
      .filter(Boolean)
      .join(', ');

  const profile = groupAnswers(i, PROFILE.id);
  const pLabel = (qid: string) => {
    const q = PROFILE.questions.find((x) => x.id === qid)!;
    if (q.type === 'number') return profile[qid]?.value != null ? String(profile[qid]!.value) : '—';
    return selectedOptions(q, profile[qid])[0]?.label ?? '—';
  };

  // ── Cover ────────────────────────────────────────────────────────────────
  const coverPhoto =
    photosFor(i, { kind: 'group', id: ROOF.id })[0] ??
    i.photos.find((p) => p.owner.kind === 'group') ??
    i.photos[0];
  const counts = ([1, 2, 3, 4] as const).map((p) => fs.filter((f) => f.priority === p).length);

  const cover = `
<section class="cover">
  <div class="band">
    <div class="brand">${esc(BRAND.name)}</div>
    <div class="product">${esc(BRAND.product)}</div>
    <div class="title">${esc(BRAND.title)}</div>
    <div class="strap">${esc(BRAND.strap)}</div>
  </div>
  <div class="cover-grid">
    <div>
      <div class="tierline">${medallion(i.tier, 58)}<div><div class="eyebrow">Survey level</div><div class="tiername">${tier.name} — ${esc(tier.strap)}</div><div class="muted">${sector === 'commercial' ? 'Commercial' : 'Domestic'} property</div></div></div>
      <table class="kv">
        <tr><th>Property</th><td>${esc(addressLine(i)) || '—'}</td></tr>
        <tr><th>Policyholder</th><td>${esc(ins.policyholderName) || '—'}${ins.policyholderPhone ? `<br><span class="muted">${esc(ins.policyholderPhone)}</span>` : ''}${ins.policyholderEmail ? `<br><span class="muted">${esc(ins.policyholderEmail)}</span>` : ''}</td></tr>
        <tr><th>Claim number</th><td>${esc(ins.claimNumber) || '—'}</td></tr>
        <tr><th>Policy number</th><td>${esc(ins.policyNumber) || '—'}</td></tr>
        ${ins.client ? `<tr><th>Instructing client</th><td>${esc(ins.client)}</td></tr>` : ''}
        <tr><th>Inspection date</th><td>${esc(formatDate(ins.inspectionDate)) || '—'}</td></tr>
        <tr><th>Inspector</th><td>${esc(ins.inspector) || '—'}</td></tr>
        <tr><th>Report reference</th><td>${esc(i.ref)}</td></tr>
      </table>
    </div>
    <div>
      ${coverPhoto ? img(coverPhoto, 'coverphoto') : '<div class="nophoto">No photograph</div>'}
      <div class="ratingbox" style="border-color:${TONE_COLOR[ratingTone][0]}">
        <div class="eyebrow">Overall Home MOT rating</div>
        <div class="rating" style="color:${rated ? TONE_COLOR[ratingTone][0] : '#9AA5B1'}">${ratingText}</div>
        <div class="counts">${counts
          .map((c, idx) =>
            c ? badge(`${c} × ${PRIORITIES[(idx + 1) as 1 | 2 | 3 | 4].label}`, PRIORITIES[(idx + 1) as 1 | 2 | 3 | 4].tone) : '',
          )
          .join(' ') || badge('No matters requiring further investigation', 'good')}</div>
      </div>
    </div>
  </div>
</section>`;

  // ── 1. Property & policyholder ───────────────────────────────────────────
  const s1 = `
<section>
  ${h2('Property & policyholder details')}
  <table class="grid2">
    <tr><th>Policyholder</th><td>${esc(ins.policyholderName) || '—'}</td><th>Inspection date</th><td>${esc(formatDate(ins.inspectionDate)) || '—'}</td></tr>
    <tr><th>Property address</th><td>${esc([ins.addressLine1, ins.addressLine2, ins.town].filter(Boolean).join(', ')) || '—'}</td><th>Postcode</th><td>${esc(ins.postcode) || '—'}</td></tr>
    <tr><th>Property type</th><td>${esc(pLabel('propertyType'))}</td><th>Approx. age</th><td>${esc(pLabel('age'))}</td></tr>
    <tr><th>Construction</th><td>${esc(pLabel('construction'))}</td><th>No. storeys</th><td>${esc(pLabel('storeys'))}</td></tr>
    <tr><th>Roof</th><td>${esc([pLabel('roofForm'), pLabel('roofCovering')].filter((x) => x !== '—').join(', ') || '—')}</td><th>${sector === 'domestic' ? 'No. bedrooms' : 'Wall finish'}</th><td>${esc(sector === 'domestic' ? pLabel('bedrooms') : pLabel('walls'))}</td></tr>
    <tr><th>Weather at inspection</th><td>${esc(pLabel('weather'))}</td><th>Occupancy</th><td>${esc(pLabel('occupancy'))}</td></tr>
    <tr><th>Inspector</th><td>${esc(ins.inspector) || '—'}</td><th>Overall condition</th><td>${rated ? badge(ratingText, ratingTone) : ratingText}</td></tr>
  </table>
  ${propertyDescription(i) ? `<h3>Property description</h3><p class="lead">${esc(propertyDescription(i))}</p>` : ''}
</section>`;

  // ── Element tables (roof, external, internal) ────────────────────────────
  const elementRow = (g: Group) => {
    const a = groupAnswers(i, g.id);
    const qs = visibleQuestions(g.questions, a, sector);
    const cq = qs.find((q) => q.type === 'condition');
    const c = cq ? selectedOptions(cq, a[cq.id])[0] : undefined;
    const notes = [
      i.groupObservations[g.id],
      groupWording(g, a, sector),
      ...qs.map((q) => (a[q.id]?.note ? `Inspector note (${q.label}): ${a[q.id]!.note}` : '')),
      i.groupNotes[g.id] ? `Further comments: ${i.groupNotes[g.id]}` : '',
    ].filter(Boolean);
    const refsTxt = refList({ kind: 'group', id: g.id });
    return `<tr><th>${esc(g.title)}</th><td class="c">${c ? badge(c.label, c.tone) : '<span class="muted">Not recorded</span>'}</td><td>${notes.map((t) => `<p>${esc(t)}</p>`).join('') || '<span class="muted">—</span>'}${refsTxt ? `<p class="refs">Photos: ${refsTxt}</p>` : ''}</td></tr>`;
  };

  // Roof (all tiers)
  const roofA = groupAnswers(i, ROOF.id);
  const roofQs = visibleQuestions(ROOF.questions, roofA, sector);
  const roofSection = `
<section>
  ${h2('Roof survey (drone)')}
  <table class="qa">
    <tr><th class="w40">Question</th><th class="w20">Answer</th><th>Report wording</th></tr>
    ${roofQs
      .map((q) => {
        const ans = roofA[q.id];
        const opt = selectedOptions(q, ans)[0];
        const value =
          q.type === 'number'
            ? ans?.value != null
              ? `${esc(ans.value)} ${esc(q.unit ?? '')}`
              : '<span class="muted">—</span>'
            : opt
              ? badge(opt.label, opt.tone ?? 'neutral')
              : '<span class="muted">—</span>';
        const w = q.type === 'condition' ? groupWording({ ...ROOF, questions: [q] }, roofA, sector) : '';
        const wording = q.type === 'condition' ? w : [opt?.wording, q.type === 'number' && q.frame && ans?.value != null ? q.frame.replace('{value}', String(ans.value)) : ''].filter(Boolean).join(' ');
        return `<tr><td>${esc(q.prompt ?? q.label)}</td><td>${value}</td><td>${esc(wording.replaceAll('{subject}', ROOF.subject))}${ans?.note ? `<p class="note">Note: ${esc(ans.note)}</p>` : ''}</td></tr>`;
      })
      .join('')}
  </table>
  ${i.groupObservations[ROOF.id] ? `<p><b>Observations:</b> ${esc(i.groupObservations[ROOF.id])}</p>` : ''}
  ${i.groupNotes[ROOF.id] ? `<p><b>Further comments:</b> ${esc(i.groupNotes[ROOF.id])}</p>` : ''}
  ${gallery({ kind: 'group', id: ROOF.id })}
</section>`;

  const external =
    i.tier === 'bronze'
      ? ''
      : `
<section>
  ${h2('External / storm-readiness inspection')}
  <table class="elements">
    <tr><th class="w22">Element</th><th class="w14">Condition</th><th>Description / evidence</th></tr>
    ${EXTERNAL.map(elementRow).join('')}
    <tr><th>Outbuildings / structures</th><td class="c">${
      i.outbuildings.length
        ? (() => {
            const worst = i.outbuildings
              .map((o) => OVERALL_CONDITIONS.find((c) => c.id === o.condition))
              .filter(Boolean)
              .sort((a, b) => OVERALL_CONDITIONS.indexOf(b!) - OVERALL_CONDITIONS.indexOf(a!))[0];
            return worst ? badge(worst.label, worst.tone) : '<span class="muted">Not recorded</span>';
          })()
        : noOutbuildings
          ? badge('N/A', 'neutral')
          : '<span class="muted">Not recorded</span>'
    }</td><td>${
      i.outbuildings.length
        ? `See the outbuildings schedule (${i.outbuildings.length} structure${i.outbuildings.length === 1 ? '' : 's'}).`
        : noOutbuildings
          ? 'No outbuildings at this property.'
          : '<span class="muted">Not recorded</span>'
    }</td></tr>
  </table>
  ${EXTERNAL.map((g) => {
    const gal = gallery({ kind: 'group', id: g.id });
    return gal ? `<h4>${esc(g.title)}</h4>${gal}` : '';
  }).join('')}
</section>`;

  // ── Rooms (Gold) ─────────────────────────────────────────────────────────
  const condQ = ROOM_QUESTIONS.find((q) => q.id === 'condition')!;
  const rooms =
    i.tier !== 'gold'
      ? ''
      : `
<section>
  ${h2('Internal rooms — measurements & condition')}
  <p class="muted">Length × Width × Height recorded in metres. Floor area calculated as Length × Width. ${esc(INTERNAL_ROOM_WORDING)}</p>
  <table class="rooms">
    <tr><th>Room / area</th><th>Level</th><th>L (m)</th><th>W (m)</th><th>H (m)</th><th>Area (m²)</th><th>Condition</th><th>Defects</th><th>Photo ref.</th></tr>
    ${i.rooms
      .map((r) => {
        const c = selectedOptions(condQ, r.answers.condition)[0];
        return `<tr><th>${esc(r.name)}</th><td>${esc(r.level)}</td><td>${r.length ?? ''}</td><td>${r.width ?? ''}</td><td>${r.height ?? ''}</td><td>${roomArea(r) ?? ''}</td><td>${c ? badge(c.label, c.tone) : ''}</td><td class="c">${r.defects.length || ''}</td><td>${refList({ kind: 'room', id: r.id })}</td></tr>`;
      })
      .join('') || '<tr><td colspan="9" class="muted">No rooms recorded.</td></tr>'}
  </table>
  ${i.rooms
    .map((r) => {
      const c = selectedOptions(condQ, r.answers.condition)[0];
      const notes = ROOM_QUESTIONS.map((q) => (r.answers[q.id]?.note ? `${q.label}: ${r.answers[q.id]!.note}` : '')).filter(Boolean);
      return `<div class="room">
      <h3>${esc(r.name)} <span class="muted">· ${esc(r.level)}${roomArea(r) ? ` · ${roomArea(r)} m²` : ''}</span> ${c ? badge(c.label, c.tone) : ''}</h3>
      ${r.observations ? `<p>${esc(r.observations)}</p>` : ''}
      ${roomWording(r, sector) ? `<p>${esc(roomWording(r, sector))}</p>` : ''}
      ${notes.map((t) => `<p class="note">${esc(t)}</p>`).join('')}
      ${
        r.defects.length
          ? `<ul class="defects">${r.defects
              .map(
                (d) =>
                  `<li>${badge(d.severity, d.severity === 'significant' ? 'bad' : d.severity === 'moderate' ? 'poor' : 'fair')} ${esc(d.description)}${d.location ? ` <span class="muted">(${esc(d.location)})</span>` : ''}</li>`,
              )
              .join('')}</ul>`
          : ''
      }
      ${gallery({ kind: 'room', id: r.id })}
    </div>`;
    })
    .join('')}
</section>
<section>
  ${h2('Roof space, services & damp')}
  <p class="muted">Services were inspected visually only and were not tested.</p>
  <table class="elements">
    <tr><th class="w22">Element</th><th class="w14">Summary</th><th>Description / evidence</th></tr>
    ${INTERNAL.map((g) => {
      const a = groupAnswers(i, g.id);
      const qs = visibleQuestions(g.questions, a, sector);
      const tones = qs.flatMap((q) => selectedOptions(q, a[q.id]).map((o) => o.tone ?? 'neutral'));
      const worst = (['bad', 'poor', 'fair', 'good'] as Tone[]).find((t) => tones.includes(t));
      const label = worst === 'bad' || worst === 'poor' ? 'Defects noted' : worst === 'fair' ? 'Items noted' : worst === 'good' ? 'Satisfactory' : 'Not recorded';
      const text = [groupWording(g, a, sector), i.groupNotes[g.id] ? `Further comments: ${i.groupNotes[g.id]}` : ''].filter(Boolean);
      const r = refList({ kind: 'group', id: g.id });
      return `<tr><th>${esc(g.title)}</th><td class="c">${badge(label, worst ?? 'neutral')}</td><td>${text.map((t) => `<p>${esc(t)}</p>`).join('') || '—'}${r ? `<p class="refs">Photos: ${r}</p>` : ''}</td></tr>`;
    }).join('')}
  </table>
  ${INTERNAL.map((g) => {
    const gal = gallery({ kind: 'group', id: g.id });
    return gal ? `<h4>${esc(g.title)}</h4>${gal}` : '';
  }).join('')}
</section>`;

  // ── Outbuildings (Silver+) ───────────────────────────────────────────────
  const condLabel = (id?: string) => {
    const o = [...ELEMENT_CONDITIONS, ...OVERALL_CONDITIONS].find((c) => c.id === id);
    return o ? badge(o.label, o.tone) : '';
  };
  const outbuildings =
    i.tier === 'bronze'
      ? ''
      : `
<section>
  ${h2('Garage / summerhouse / outbuildings')}
  ${
    i.outbuildings.length
      ? `<table class="rooms">
    <tr><th>Structure</th><th>L</th><th>W</th><th>H</th><th>Area m²</th><th>Roof</th><th>Walls</th><th>Condition</th><th>Description / defects</th></tr>
    ${i.outbuildings
      .map(
        (o) =>
          `<tr><th>${esc(o.label || o.type)}</th><td>${o.length ?? ''}</td><td>${o.width ?? ''}</td><td>${o.height ?? ''}</td><td>${roomArea(o) ?? ''}</td><td>${condLabel(o.roof)}</td><td>${condLabel(o.walls)}</td><td>${o.condition ? condLabel(o.condition) : ''}</td><td>${esc(o.description)}${refList({ kind: 'outbuilding', id: o.id }) ? `<p class="refs">Photos: ${refList({ kind: 'outbuilding', id: o.id })}</p>` : ''}</td></tr>`,
      )
      .join('')}
  </table>
  <p>${esc(OUTBUILDING_WORDING)}</p>
  ${i.outbuildings.map((o) => gallery({ kind: 'outbuilding', id: o.id })).join('')}`
      : noOutbuildings
        ? '<p>No garages, summerhouses or other outbuildings are present at this property.</p>'
        : '<p class="muted">Outbuildings not recorded.</p>'
  }
</section>`;

  // ── Assessment ───────────────────────────────────────────────────────────
  const assessA = groupAnswers(i, ASSESSMENT.id);
  const assessment = `
<section>
  ${h2('Defects, maintenance & storm vulnerability')}
  <table class="elements">
    <tr><th class="w30">Assessment</th><th class="w22">Selection</th><th>Wording / inspector comments</th></tr>
    ${ASSESSMENT.questions
      .map((q) => {
        const o = selectedOptions(q, assessA[q.id])[0];
        return `<tr><th>${esc(q.label)}</th><td>${o ? badge(o.label, o.tone ?? 'neutral') : '<span class="muted">Not recorded</span>'}</td><td>${esc(o?.wording ?? '')}${assessA[q.id]?.note ? `<p class="note">${esc(assessA[q.id]!.note)}</p>` : ''}</td></tr>`;
      })
      .join('')}
  </table>
</section>`;

  // ── Further investigation schedule ───────────────────────────────────────
  const schedule = `
<section>
  ${h2('Further investigation schedule (policyholder action plan)')}
  <p>The following matters were identified during the inspection. Each would require further investigation, further checking and potentially repairs. Priorities indicate the suggested order of attention; the final column is for the policyholder to record completion and evidence.</p>
  <table class="actions">
    <tr><th class="w16">Priority</th><th class="w22">Area / defect</th><th>Further investigation required</th><th class="w18">Completed / evidence</th></tr>
    ${
      fs.length
        ? fs
            .map(
              (f) =>
                `<tr><td>${badge(PRIORITIES[f.priority].label, PRIORITIES[f.priority].tone)}</td><th>${esc(f.area)}</th><td>${esc(f.text)}${f.evidence ? `<p class="note">${esc(f.evidence)}</p>` : ''}</td><td></td></tr>`,
            )
            .join('')
        : '<tr><td colspan="4">No matters requiring further investigation were identified within the limitations of this visual inspection.</td></tr>'
    }
  </table>
</section>`;

  // ── Photo record ─────────────────────────────────────────────────────────
  const ordered = [...refs.entries()].map(([id, ref]) => ({ ref, p: i.photos.find((x) => x.id === id)! }));
  const ownerName = (o: PhotoOwner) =>
    o.kind === 'room'
      ? i.rooms.find((r) => r.id === o.id)?.name ?? 'Room'
      : o.kind === 'outbuilding'
        ? i.outbuildings.find((x) => x.id === o.id)?.label ?? 'Outbuilding'
        : o.kind === 'group'
          ? [ROOF, ...EXTERNAL, ...INTERNAL].find((g) => g.id === o.id)?.title ?? 'Element'
          : 'General';
  const photoRecord = `
<section>
  ${h2('Photo record')}
  ${
    ordered.length
      ? `<table class="photoindex"><tr><th class="w10">Ref.</th><th class="w30">Section</th><th>Description / location</th></tr>${ordered
          .map(({ ref, p }) => `<tr><th>${ref}</th><td>${esc(ownerName(p.owner))}</td><td>${esc(p.caption)}</td></tr>`)
          .join('')}</table>`
      : '<p class="muted">No photographs were taken.</p>'
  }
</section>`;

  // ── Summary & sign-off ───────────────────────────────────────────────────
  const sig = i.summary.signature
    ? `<svg class="sig" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg"><path d="${esc(i.summary.signature)}" stroke="#0E2235" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : '<div class="sig blank"></div>';
  const signer = i.summary.signedBy || ins.inspector || opts.inspector?.name || '';
  const final = `
<section class="final">
  ${h2('Final summary & sign-off')}
  <table class="elements">
    <tr><th class="w30">Overall Home MOT rating</th><td>${rated ? badge(ratingText, ratingTone) : ratingText}</td></tr>
    <tr><th>Key storm vulnerabilities</th><td>${para(summary.keyVulnerabilities)}</td></tr>
    <tr><th>Priority matters</th><td>${para(summary.priorityActions)}</td></tr>
    <tr><th>Inspector summary</th><td>${para(summary.inspectorSummary)}</td></tr>
  </table>
  ${fs.length && !summary.inspectorSummary.includes(CLIENT_STATEMENT) ? `<p class="statement">${esc(CLIENT_STATEMENT)}</p>` : ''}
  <p>${esc(PURPOSE)}</p>
  <div class="signoff">
    <div>${sig}<div class="sigline">${esc(signer)}${opts.inspector?.qualifications ? `, ${esc(opts.inspector.qualifications)}` : ''}</div>
    <div class="muted">${esc(opts.inspector?.company || BRAND.name)}${opts.inspector?.phone ? ` · ${esc(opts.inspector.phone)}` : ''}${opts.inspector?.email ? ` · ${esc(opts.inspector.email)}` : ''}</div></div>
    <div><div class="eyebrow">Date signed</div><div class="big">${i.summary.signedAt ? esc(formatDate(i.summary.signedAt)) : 'Not yet signed'}</div></div>
  </div>
  <p class="disclaimer">${esc(DISCLAIMER)}</p>
</section>`;

  const generated = formatDate(opts.generatedAt ?? Date.now());

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Home MOT ${esc(i.ref)}</title>
<style>
@page { size: A4; margin: 14mm 13mm 16mm 13mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1D2B3A; font-size: 10pt; line-height: 1.42; margin: 0; padding: 12px; background: #fff; }
@media print { body { padding: 0; } }
h2 { font-family: Georgia, "Times New Roman", serif; font-size: 15pt; color: #0E2235; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 2px solid #0E2235; display: flex; align-items: baseline; gap: 10px; break-after: avoid; }
h2 .num { display: inline-block; min-width: 26px; height: 26px; line-height: 26px; text-align: center; border-radius: 13px; background: #0E2235; color: #fff; font-size: 11pt; font-family: -apple-system, Helvetica, Arial, sans-serif; }
h3 { font-family: Georgia, serif; font-size: 12pt; color: #0E2235; margin: 14px 0 6px; break-after: avoid; }
h4 { font-size: 9pt; text-transform: uppercase; letter-spacing: .08em; color: #5C6B7B; margin: 12px 0 4px; break-after: avoid; }
p { margin: 0 0 6px; }
section { margin-bottom: 22px; }
.muted { color: #6A7686; }
.lead { font-family: Georgia, serif; font-style: italic; font-size: 11pt; border-left: 3px solid #1F5F99; padding-left: 10px; }
.eyebrow { font-size: 7.5pt; letter-spacing: .12em; text-transform: uppercase; color: #6A7686; font-weight: 700; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 9px; font-size: 8.5pt; font-weight: 600; white-space: nowrap; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; }
th, td { border: 1px solid #C9D3DD; padding: 5px 7px; vertical-align: top; text-align: left; }
tr { break-inside: avoid; }
table tr:first-child th { background: #D9EAF7; color: #0E2235; font-size: 8.5pt; }
tbody th, tr > th:first-child { background: #F2F6FA; font-weight: 600; color: #0E2235; }
table.kv th { width: 34%; background: #F2F6FA; font-size: 8.5pt; }
table.kv tr:first-child th { background: #F2F6FA; font-size: 8.5pt; }
table.grid2 th { width: 18%; background: #D9EAF7; font-size: 8.5pt; }
table.grid2 td { width: 32%; }
table.rooms td, table.rooms th { font-size: 8.5pt; }
td.c { text-align: center; }
.w10{width:10%}.w14{width:14%}.w16{width:16%}.w18{width:18%}.w20{width:20%}.w22{width:22%}.w30{width:30%}.w40{width:40%}
.refs { font-size: 8pt; color: #1F5F99; font-weight: 600; margin-top: 3px; }
.note { font-size: 8.5pt; color: #3D4B5C; font-style: italic; }
.gallery { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 10px; }
figure { margin: 0; width: calc(33.333% - 6px); break-inside: avoid; }
figure img { width: 100%; height: 130px; object-fit: cover; border-radius: 4px; display: block; border: 1px solid #C9D3DD; }
figcaption { font-size: 8pt; color: #3D4B5C; margin-top: 3px; }
figcaption b { color: #1F5F99; }
.room { break-inside: avoid-page; border-top: 1px solid #E2E8EE; padding-top: 4px; }
ul.defects { margin: 4px 0 6px; padding-left: 16px; }
ul.defects li { margin-bottom: 3px; }
.cover { break-after: page; }
.band { background: #0E2235; color: #fff; border-radius: 8px; padding: 22px 24px 20px; }
.band .brand { font-size: 8.5pt; letter-spacing: .16em; text-transform: uppercase; color: #9FB8D1; font-weight: 700; }
.band .product { font-family: Georgia, serif; font-size: 34pt; font-weight: 700; line-height: 1.05; margin-top: 6px; }
.band .title { font-size: 13pt; margin-top: 2px; }
.band .strap { font-family: Georgia, serif; font-style: italic; color: #BFD3E6; margin-top: 6px; }
.cover-grid { display: flex; gap: 16px; margin-top: 18px; }
.cover-grid > div { flex: 1; }
.tierline { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.tiername { font-family: Georgia, serif; font-size: 14pt; color: #0E2235; }
figure.coverphoto { width: 100%; }
figure.coverphoto img { height: 230px; }
.nophoto { height: 230px; border-radius: 4px; background: #F2F6FA; color: #9AA5B1; display: flex; align-items: center; justify-content: center; }
.ratingbox { border: 2px solid; border-radius: 8px; padding: 12px 14px; margin-top: 12px; }
.rating { font-family: Georgia, serif; font-size: 26pt; font-weight: 700; line-height: 1.1; margin: 2px 0 8px; }
.counts .badge { margin: 0 4px 4px 0; }
.statement { font-weight: 600; background: #FBF0D9; border-left: 3px solid #D49A1C; padding: 8px 10px; }
.signoff { display: flex; gap: 24px; align-items: flex-end; margin: 18px 0 14px; break-inside: avoid; }
.signoff > div:first-child { flex: 1.4; }
.signoff > div:last-child { flex: 1; }
.sig { width: 260px; height: 104px; display: block; border-bottom: 1px solid #0E2235; }
.sig.blank { width: 260px; height: 80px; }
.sigline { font-weight: 600; margin-top: 4px; }
.big { font-family: Georgia, serif; font-size: 13pt; }
.disclaimer { font-size: 8pt; color: #5C6B7B; border-top: 1px solid #C9D3DD; padding-top: 8px; margin-top: 10px; }
@media screen and (max-width: 640px) {
  .cover-grid, .signoff { flex-direction: column; }
  figure { width: calc(50% - 4px); }
  .band .product { font-size: 28pt; }
  table { font-size: 9pt; }
}
.footer { margin-top: 18px; font-size: 7.5pt; color: #6A7686; text-align: center; border-top: 1px solid #E2E8EE; padding-top: 6px; }
</style></head><body>
${cover}
${s1}
${roofSection}
${external}
${rooms}
${outbuildings}
${assessment}
${schedule}
${photoRecord}
${final}
<div class="footer">${esc(BRAND.name)} | ${esc(BRAND.product)} | ${esc(BRAND.strap)} · Report ${esc(i.ref)} · Generated ${esc(generated)}</div>
</body></html>`;
}

export function reportFileName(i: Inspection): string {
  const addr = (i.instruction.addressLine1 || 'property').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return `Home-MOT-${TIERS[i.tier].name}-${addr}-${i.ref}.pdf`;
}

