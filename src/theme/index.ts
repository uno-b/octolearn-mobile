import type { TextStyle } from 'react-native';

/**
 * "Lagoon & Coral". Each colour has one role:
 * primary = learning and XP, gold = quiz and achievement, coral = streak and brand,
 * success/danger = answer feedback only.
 *
 * Contrast rules: text in a brand colour uses primaryDark (primary on tint or bg fails 4.5:1).
 * Never put text on a coral or gold fill: use a *Tint background with the matching *Text colour.
 */
export const colors = {
  primary: '#0E7C9B',
  primaryDark: '#0A5F78',
  primaryTint: '#E3F4F8',
  /** Decorative mid-tone: past days on the activity chart. */
  primaryMid: '#8CCBDD',
  coral: '#FF6B4A',
  coralDark: '#E0502F',
  coralTint: '#FFEDE6',
  coralText: '#B4421F',
  gold: '#FFB020',
  goldDark: '#C96F00',
  goldTint: '#FFF4DC',
  goldText: '#9A5B00',
  success: '#2BA84A',
  successDark: '#1F8A3B',
  successTint: '#E6F6EA',
  successText: '#1B7F3B',
  danger: '#E5484D',
  dangerDark: '#C62D35',
  dangerTint: '#FDECEC',
  bg: '#F3F8FA',
  surface: '#FFFFFF',
  border: '#E1E8EE',
  borderStrong: '#D5DEE6',
  text: '#102A3A',
  textSec: '#5A6B7B',
  textMuted: '#8696A5',
  onPrimary: '#FFFFFF',
  locked: '#D5DEE6',
  lockedDark: '#B8C4CF',
  lockedIcon: '#6B7B8B',
  ink: '#102A3A',
  videoBg: '#000000',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, btn: 14, card: 16, pill: 999 } as const;

export const size = {
  /** Minimum tap target. */
  tap: 48,
  btn: 52,
  /** Height of the darker bottom edge on chunky tappables. */
  edge: 4,
  node: 72,
  quizNode: 80,
  avatar: 88,
  icon: 24,
} as const;

/** Font family per weight: Android ignores fontWeight on custom fonts. Never set fontWeight. */
export const fonts = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 36 },
  h1: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 30 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  headline: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const shadow = {
  /** Toast and tooltip only. Everything else stays flat. */
  sm: { boxShadow: '0 4px 12px rgba(16,42,58,0.10)' },
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 600,
  spring: { damping: 14, stiffness: 180 },
} as const;
