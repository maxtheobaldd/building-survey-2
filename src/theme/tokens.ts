import type { Tone } from '@/survey/types';

/** Navy "certificate" palette with the Word template's light blue (#D9EAF7) as the brand tint. */
export const C = {
  ink: '#0E2235',
  ink2: '#2B3E52',
  muted: '#6A7686',
  faint: '#9AA5B1',
  paper: '#F4F2EC',
  card: '#FFFFFF',
  line: '#E2DED4',
  lineStrong: '#CFC9BB',
  brand: '#1F5F99',
  brandTint: '#D9EAF7',
  brandDeep: '#123B63',
  accent: '#E0A43A',
  white: '#FFFFFF',
  danger: '#B3261E',
  ai: '#5B47C8',
  aiTint: '#ECE8FB',
};

export const TONE: Record<Tone, { fg: string; bg: string; dot: string }> = {
  good: { fg: '#1E6B40', bg: '#E2F2E8', dot: '#2F8F57' },
  fair: { fg: '#8A5A00', bg: '#FBF0D9', dot: '#D49A1C' },
  poor: { fg: '#A1421A', bg: '#FBE6DB', dot: '#D2642E' },
  bad: { fg: '#9B1C1C', bg: '#F9DEDE', dot: '#C53030' },
  neutral: { fg: '#3D4B5C', bg: '#E9ECEF', dot: '#8792A0' },
};

export const F = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  displayBold: 'Fraunces_700Bold',
  body: 'InterTight_400Regular',
  medium: 'InterTight_500Medium',
  semibold: 'InterTight_600SemiBold',
  bold: 'InterTight_700Bold',
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const R = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const SHADOW = {
  shadowColor: '#0E2235',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
};
