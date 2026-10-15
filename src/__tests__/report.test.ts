import { buildReportHtml, esc, reportFileName } from '@/report/html';
import { sampleInspection } from '@/survey/sample';

const opts = { photoData: () => 'AAAA', inspector: { name: 'Alex', qualifications: 'MRICS', company: 'PHCUK', phone: '', email: '' } };

test('gold report contains every template section in order', () => {
  const html = buildReportHtml(sampleInspection('i', 'HM-1', 'Alex'), opts);
  const order = [
    'Property &amp; policyholder details',
    'Roof survey (drone)',
    'External / storm-readiness inspection',
    'Internal rooms',
    'Roof space, services &amp; damp',
    'Garage / summerhouse / outbuildings',
    'Defects, maintenance &amp; storm vulnerability',
    'Further investigation schedule',
    'Photo record',
    'Final summary &amp; sign-off',
  ];
  const positions = order.map((t) => html.indexOf(t));
  positions.forEach((p, idx) => expect([order[idx], p >= 0]).toEqual([order[idx], true]));
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  expect(html).toContain('CLM-48213');
  expect(html).toContain('The subject property is a two-storey semi-detached house');
});

test('bronze report only has roof-level sections, numbered consecutively', () => {
  const i = { ...sampleInspection('i', 'HM-1', 'Alex'), tier: 'bronze' as const };
  const html = buildReportHtml(i, opts);
  expect(html).not.toContain('External / storm-readiness inspection');
  expect(html).not.toContain('Internal rooms');
  expect(html).toContain('<span class="num">2</span>Roof survey (drone)');
  expect(html).toContain('<span class="num">3</span>Defects, maintenance');
});

test('user text is escaped', () => {
  const i = sampleInspection('i', 'HM-1', 'Alex');
  i.instruction.policyholderName = '<script>alert(1)</script>';
  const html = buildReportHtml(i, opts);
  expect(html).not.toContain('<script>alert(1)</script>');
  expect(esc('<b>&"')).toBe('&lt;b&gt;&amp;&quot;');
});

test('file name is safe', () => {
  expect(reportFileName(sampleInspection('i', 'HM-2610-0001', 'A'))).toBe('Home-MOT-Gold-12-Acacia-Avenue-HM-2610-0001.pdf');
});
