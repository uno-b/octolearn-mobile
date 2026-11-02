import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors } from '@/theme';

const PALETTE = [colors.primary, colors.coral, colors.gold, colors.success];
const DEFAULT_COUNT = 26;
const DURATION_MS = 2400;
/** Constant downward acceleration, in px per unit of progress squared. */
const GRAVITY = 700;
/** Pieces start fully opaque and fade out over the last quarter. */
const FADE_START = 0.75;
/** Distance below the top edge where the burst starts, so the upward arc is visible. */
const ORIGIN_Y = 80;
const MAX_VX = 190;
const VY_RANGE = { min: -380, max: 120 };
const MAX_SPIN_DEG = 720;
const PIECE_SIZE = { min: 8, max: 14 };

interface Piece {
  color: string;
  vx: number;
  vy: number;
  spinDeg: number;
  width: number;
  height: number;
}

const between = (min: number, max: number) => min + Math.random() * (max - min);

function createPieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const width = between(PIECE_SIZE.min, PIECE_SIZE.max);
    return {
      color: PALETTE[i % PALETTE.length],
      vx: between(-MAX_VX, MAX_VX),
      vy: between(VY_RANGE.min, VY_RANGE.max),
      spinDeg: between(-MAX_SPIN_DEG, MAX_SPIN_DEG),
      width,
      height: width * 0.6,
    };
  });
}

interface ConfettiProps {
  count?: number;
}

/** One burst from the top centre on mount. Decorative, so it renders nothing under reduced motion. */
export function Confetti({ count = DEFAULT_COUNT }: ConfettiProps) {
  const reduceMotion = useReducedMotion();
  // Random values are drawn once, not on every render.
  const [pieces] = useState(() => createPieces(count));
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.set(withTiming(1, { duration: DURATION_MS, easing: Easing.linear }));
  }, [progress, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} progress={progress} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, progress }: { piece: Piece; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const s = progress.get();
    return {
      opacity: s < FADE_START ? 1 : (1 - s) / (1 - FADE_START),
      transform: [
        { translateX: piece.vx * s },
        { translateY: piece.vy * s + GRAVITY * s * s },
        { rotate: `${piece.spinDeg * s}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { width: piece.width, height: piece.height, backgroundColor: piece.color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: ORIGIN_Y, left: '50%' },
});
