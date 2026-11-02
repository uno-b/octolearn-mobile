import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/theme';

import { AppText } from './AppText';

interface BottomBarProps {
  children: ReactNode;
  /** Short caption above the actions. */
  hint?: string;
}

/** Sticky action area. Left and right insets are the screen's SafeAreaView job. */
export function BottomBar({ children, hint }: BottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      {hint ? (
        <AppText variant="caption" color={colors.textSec} align="center">
          {hint}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: space.md,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
