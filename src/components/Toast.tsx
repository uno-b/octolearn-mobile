import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { colors, radius, shadow, space } from '@/theme';

import { AppText } from './AppText';

const DURATION_MS = 2200;

interface ToastProps {
  message: string;
  /** Show the toast by changing this to a new non-zero value. 0 keeps it hidden. */
  showKey: number;
}

export function Toast({ message, showKey }: ToastProps) {
  // The key whose timer has run out. A new showKey differs from it, so the toast shows again.
  const [dismissedKey, setDismissedKey] = useState(0);

  useEffect(() => {
    if (showKey === 0) return;
    const timer = setTimeout(() => setDismissedKey(showKey), DURATION_MS);
    return () => clearTimeout(timer);
  }, [showKey]);

  if (showKey === 0 || showKey === dismissedKey) return null;

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.toast}
    >
      <AppText variant="label" color={colors.surface} align="center">
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: space.xl,
    left: space.lg,
    right: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    ...shadow.sm,
  },
});
