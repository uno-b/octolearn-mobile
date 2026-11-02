import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { mn } from '@/i18n/mn';
import { colors, radius, space } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const HEADER_HEIGHT = 56;
const BUTTON_SIZE = 44;
/** Grows the 44 px button to the 48 px minimum tap target. */
const BUTTON_HIT_SLOP = 2;

const LEFT: Record<'back' | 'close', { icon: IconName; label: string }> = {
  back: { icon: 'chevron-back', label: mn.common.back },
  close: { icon: 'close', label: mn.common.close },
};

interface ScreenHeaderProps {
  left: 'back' | 'close';
  onLeft: () => void;
  title?: string;
  /** Replaces the title, e.g. a progress bar. */
  children?: ReactNode;
}

export function ScreenHeader({ left, onLeft, title, children }: ScreenHeaderProps) {
  const { icon, label } = LEFT[left];

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onLeft}
        hitSlop={BUTTON_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Icon name={icon} />
      </Pressable>
      <View style={styles.center}>
        {children ??
          (title ? (
            <AppText variant="headline" numberOfLines={1} accessibilityRole="header">
              {title}
            </AppText>
          ) : null)}
      </View>
      {/* Mirrors the button so the centre stays centred. */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: colors.border },
  spacer: { width: BUTTON_SIZE },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
