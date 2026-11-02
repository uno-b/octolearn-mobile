import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, radius, space } from '@/theme';

const DEFAULT_HEIGHT = 14;
const HIGHLIGHT_OPACITY = 0.3;

interface ProgressBarProps {
  /** 0..1, clamped. */
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({
  value,
  color = colors.primary,
  height = DEFAULT_HEIGHT,
}: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const target = Math.min(1, Math.max(0, value));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(reduceMotion ? target : withTiming(target, { duration: motion.slow }));
  }, [progress, reduceMotion, target]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
      style={[styles.track, { height }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]}>
        <View style={[styles.highlight, { top: height / 4, height: height / 4 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  // A soft shine along the top of the fill.
  highlight: {
    position: 'absolute',
    left: space.sm,
    right: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    opacity: HIGHLIGHT_OPACITY,
  },
});
