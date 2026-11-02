import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useFeedbackMotion } from '@/lib/feedbackMotion';
import { colors, radius, space } from '@/theme';

import { AppText } from './AppText';
import { ChunkyFace } from './ChunkyFace';
import { Icon, type IconName } from './Icon';

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

interface OptionCardProps {
  label: string;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
}

interface Look {
  face: string;
  /** Border and edge share one colour. */
  edge: string;
  text: string;
  icon?: IconName;
}

const IDLE: Look = { face: colors.surface, edge: colors.borderStrong, text: colors.text };

const LOOKS: Record<OptionState, Look> = {
  idle: IDLE,
  dim: IDLE,
  selected: { face: colors.primaryTint, edge: colors.primary, text: colors.primaryDark },
  correct: {
    face: colors.successTint,
    edge: colors.success,
    text: colors.successText,
    icon: 'checkmark-circle',
  },
  wrong: {
    face: colors.dangerTint,
    edge: colors.danger,
    text: colors.dangerDark,
    icon: 'close-circle',
  },
};

const MIN_HEIGHT = 56;
const BORDER_WIDTH = 2;
const DIM_OPACITY = 0.5;

export function OptionCard({ label, state, onPress, disabled = false }: OptionCardProps) {
  const look = LOOKS[state];
  const { style, bump, shake } = useFeedbackMotion();

  useEffect(() => {
    if (state === 'correct') bump();
    else if (state === 'wrong') shake();
  }, [state, bump, shake]);

  return (
    <Animated.View style={[state === 'dim' && styles.dim, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: state === 'selected' }}
      >
        {({ pressed }) => (
          <ChunkyFace
            pressed={pressed}
            edgeColor={look.edge}
            radius={radius.btn}
            style={[styles.face, { backgroundColor: look.face, borderColor: look.edge }]}
          >
            <AppText variant="bodyStrong" color={look.text} style={styles.label}>
              {label}
            </AppText>
            {look.icon ? <Icon name={look.icon} color={look.text} /> : null}
          </ChunkyFace>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dim: { opacity: DIM_OPACITY },
  face: {
    minHeight: MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: BORDER_WIDTH,
  },
  label: { flex: 1 },
});
