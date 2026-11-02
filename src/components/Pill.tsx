import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useFeedbackMotion } from '@/lib/feedbackMotion';
import { colors, radius, space } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type Tone = 'primary' | 'coral' | 'gold' | 'success';

/** Tint background and the dark colour used for text and icons on it. */
export const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primaryTint, fg: colors.primaryDark },
  coral: { bg: colors.coralTint, fg: colors.coralText },
  gold: { bg: colors.goldTint, fg: colors.goldText },
  success: { bg: colors.successTint, fg: colors.successText },
};

const PILL_HEIGHT = 36;
const PILL_ICON = 18;

interface PillProps {
  tone: Tone;
  icon?: IconName;
  label: string;
  /** The pill bumps whenever this changes, but not on mount. */
  bumpKey?: string | number;
  accessibilityLabel?: string;
}

export function Pill({ tone, icon, label, bumpKey, accessibilityLabel }: PillProps) {
  const { bg, fg } = TONE_COLORS[tone];
  const { style, bump } = useFeedbackMotion();
  const lastKey = useRef(bumpKey);

  useEffect(() => {
    if (lastKey.current === bumpKey) return;
    lastKey.current = bumpKey;
    bump();
  }, [bumpKey, bump]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.pill, { backgroundColor: bg }, style]}
    >
      {icon ? <Icon name={icon} size={PILL_ICON} color={fg} /> : null}
      <AppText variant="label" color={fg}>
        {label}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
});
