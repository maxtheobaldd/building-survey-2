import { parseInstruction } from '@/lib/parseInstruction';

test('extracts instruction details from a typical email', () => {
  const text = `Good morning,

Please arrange a Gold Home MOT for the following:

Insurer: Northern Mutual Home Insurance
Claim No: CLM-48213
Policy Number: HP-99812-07
Policyholder: Jane Smith
Risk Address: 12 Acacia Avenue, Headingley, Leeds, LS6 2AB
Tel: 07700 900123
Email: jane.smith@example.com

Thanks`;
  expect(parseInstruction(text)).toEqual({
    claimNumber: 'CLM-48213',
    policyNumber: 'HP-99812-07',
    client: 'Northern Mutual Home Insurance',
    policyholderName: 'Jane Smith',
    policyholderPhone: '07700 900123',
    policyholderEmail: 'jane.smith@example.com',
    addressLine1: '12 Acacia Avenue',
    addressLine2: 'Headingley',
    town: 'Leeds',
    postcode: 'LS6 2AB',
  });
});

test('falls back to the postcode line when there is no address label', () => {
  const out = parseInstruction('Mr P Jones\n4 Mill Lane, Otley LS21 1AA\nclaim ref 77812A');
  expect(out.postcode).toBe('LS21 1AA');
  expect(out.addressLine1).toBe('4 Mill Lane');
  expect(out.town).toBe('Otley');
  expect(out.claimNumber).toBe('77812A');
});

test('returns nothing for unrelated text', () => {
  expect(parseInstruction('hello there')).toEqual({});
});

test('an email does not swallow the next word when lines run together', () => {
  expect(parseInstruction('Email: d.okafor@example.com\nInsurer: Northern Mutual').policyholderEmail).toBe('d.okafor@example.com');
  expect(parseInstruction('Email: d.okafor@example.comInsurer: X').policyholderEmail).toBeUndefined();
});
