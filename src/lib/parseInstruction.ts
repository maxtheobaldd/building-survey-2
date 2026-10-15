import type { Instruction } from '@/survey/types';

/**
 * Pulls instruction details out of pasted text (an insurer/office instruction email or job sheet)
 * so the surveyor doesn't retype the claim number, policy number, address and contact.
 */
const POSTCODE = /\b([A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]?)\s*(\d[ABD-HJLNP-UW-Z]{2})\b/i;

function field(text: string, labels: string): string | undefined {
  const re = new RegExp(`(?:^|\\n|\\b)(?:${labels})\\s*(?:no\\.?|number|ref(?:erence)?)?\\s*[:#\\-–]\\s*([^\\n]+)`, 'i');
  const m = re.exec(text);
  return m?.[1]?.trim().replace(/\s{2,}/g, ' ');
}

function reference(text: string, labels: string): string | undefined {
  const re = new RegExp(`(?:${labels})\\s*(?:no\\.?|number|ref(?:erence)?)?\\s*[:#\\-–]?\\s*([A-Z0-9][A-Z0-9\\-\\/]{3,})`, 'i');
  return re.exec(text)?.[1]?.trim();
}

export function parseInstruction(text: string): Partial<Instruction> {
  const out: Partial<Instruction> = {};
  const claim = reference(text, 'claim');
  if (claim) out.claimNumber = claim.toUpperCase();
  const policy = reference(text, 'policy');
  if (policy) out.policyNumber = policy.toUpperCase();

  const email = /[\w.+-]+@[\w-]+(?:\.[a-z]{2,})+(?=$|[\s,;)>])/im.exec(text)?.[0];
  if (email) out.policyholderEmail = email;
  const phone = /(?:\+44\s?\(?0?\)?\s?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/.exec(text)?.[0];
  if (phone) out.policyholderPhone = phone.replace(/\s+/g, ' ').trim();

  const name = field(text, 'policyholder|policy holder|insured|customer|client name|name');
  if (name) out.policyholderName = name.replace(/[,;].*$/, '').trim();

  const client = field(text, 'insurer|instructing party|client');
  if (client && client !== name) out.client = client;

  const pc = POSTCODE.exec(text);
  if (pc) out.postcode = `${pc[1]} ${pc[2]}`.toUpperCase();

  let address = field(text, 'risk address|property address|address|property|location');
  if (!address && pc) {
    // Fall back to the line containing the postcode.
    address = text.split('\n').find((l) => POSTCODE.test(l))?.trim();
  }
  if (address) {
    const parts = address
      .replace(POSTCODE, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts[0]) out.addressLine1 = parts[0];
    if (parts.length >= 3) {
      out.addressLine2 = parts.slice(1, -1).join(', ');
      out.town = parts[parts.length - 1];
    } else if (parts.length === 2) {
      out.town = parts[1];
    }
  }
  return out;
}
