import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme';

const BUMP_SCALE = 1.15;
const SHAKE_DISTANCE = 6;
const SHAKE_STEP_MS = 50;

/**
 * One transform style with two one-shot effects: `bump` pops the scale, `shake` wobbles sideways.
 * Both are skipped under reduced motion, since they only decorate feedback shown elsewhere.
 */
export function useFeedbackMotion() {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const shiftX = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shiftX.get() }, { scale: scale.get() }],
  }));

  const bump = useCallback(() => {
    if (reduceMotion) return;
    scale.set(
      withSequence(withTiming(BUMP_SCALE, { duration: motion.fast }), withSpring(1, motion.spring)),
    );
  }, [reduceMotion, scale]);

  const shake = useCallback(() => {
    if (reduceMotion) return;
    const step = { duration: SHAKE_STEP_MS };
    shiftX.set(
      withSequence(
        withTiming(-SHAKE_DISTANCE, step),
        withTiming(SHAKE_DISTANCE, step),
        withTiming(-SHAKE_DISTANCE, step),
        withTiming(SHAKE_DISTANCE, step),
        withTiming(0, step),
      ),
    );
  }, [reduceMotion, shiftX]);

  return { style, bump, shake };
}
