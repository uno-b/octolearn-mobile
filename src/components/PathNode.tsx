import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { NodeKind, NodeStatus } from '@/domain/types';
import { mn } from '@/i18n/mn';
import { useFeedbackMotion } from '@/lib/feedbackMotion';
import { colors, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import { ChunkyFace } from './ChunkyFace';
import { Icon, type IconName } from './Icon';

type Side = 'left' | 'right';

interface PathNodeProps {
  status: NodeStatus;
  kind: NodeKind;
  /** Side the "start" bubble sits on. Only an active node with a side shows the bubble. */
  bubbleSide?: Side;
  /** Pops the node when it turns true. */
  celebrate?: boolean;
  onPress: () => void;
  onLockedPress: () => void;
  accessibilityLabel: string;
}

interface Look {
  face: string;
  edge: string;
  ring?: string;
  icon: IconName;
  iconColor: string;
}

const LOCKED: Look = {
  face: colors.locked,
  edge: colors.lockedDark,
  icon: 'lock-closed',
  iconColor: colors.lockedIcon,
};

const LOOKS: Record<NodeKind, Record<NodeStatus, Look>> = {
  lesson: {
    completed: {
      face: colors.primary,
      edge: colors.primaryDark,
      icon: 'checkmark',
      iconColor: colors.onPrimary,
    },
    active: {
      face: colors.surface,
      edge: colors.primaryDark,
      ring: colors.primary,
      icon: 'play',
      iconColor: colors.primary,
    },
    locked: LOCKED,
  },
  quiz: {
    completed: {
      face: colors.gold,
      edge: colors.goldDark,
      icon: 'star',
      iconColor: colors.surface,
    },
    active: {
      face: colors.goldTint,
      edge: colors.goldDark,
      ring: colors.gold,
      icon: 'star',
      iconColor: colors.goldDark,
    },
    locked: LOCKED,
  },
};

const RING_WIDTH = 4;
const ICON_SIZE = 32;
const HALO_SCALE = 1.35;
const HALO_OPACITY = 0.45;
const HALO_PERIOD_MS = 1400;
const BUBBLE_GAP = 12;
const BUBBLE_CHEVRON = 16;
const ARROW_SIZE = 10;

export function PathNode({
  status,
  kind,
  bubbleSide,
  celebrate = false,
  onPress,
  onLockedPress,
  accessibilityLabel,
}: PathNodeProps) {
  const look = LOOKS[kind][status];
  const diameter = kind === 'quiz' ? size.quizNode : size.node;
  const { style, bump, shake } = useFeedbackMotion();
  const isActive = status === 'active';

  useEffect(() => {
    if (celebrate) bump();
  }, [celebrate, bump]);

  const handlePress = () => {
    if (status === 'locked') {
      shake();
      onLockedPress();
    } else {
      onPress();
    }
  };

  return (
    <Animated.View style={[{ width: diameter }, style]}>
      {isActive ? <Halo diameter={diameter} color={look.ring} /> : null}
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {({ pressed }) => (
          <ChunkyFace
            pressed={pressed}
            edgeColor={look.edge}
            radius={radius.pill}
            style={[
              styles.coin,
              {
                width: diameter,
                height: diameter,
                backgroundColor: look.face,
                borderWidth: look.ring ? RING_WIDTH : 0,
                borderColor: look.ring,
              },
            ]}
          >
            <Icon name={look.icon} size={ICON_SIZE} color={look.iconColor} />
          </ChunkyFace>
        )}
      </Pressable>
      {isActive && bubbleSide ? (
        <StartBubble diameter={diameter} side={bubbleSide} onPress={handlePress} />
      ) : null}
    </Animated.View>
  );
}

/** Pulsing disc behind the active coin. Decorative and looping, so off under reduced motion. */
function Halo({ diameter, color }: { diameter: number; color?: string }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.set(withRepeat(withTiming(1, { duration: HALO_PERIOD_MS }), -1, false));
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: HALO_OPACITY * (1 - pulse.get()),
    transform: [{ scale: 1 + (HALO_SCALE - 1) * pulse.get() }],
  }));

  if (reduceMotion) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.halo, { width: diameter, height: diameter, backgroundColor: color }, style]}
    />
  );
}

interface StartBubbleProps {
  diameter: number;
  side: Side;
  onPress: () => void;
}

/**
 * Speech bubble beside the node. It is out of flow and duplicates the node's own button, so it is
 * hidden from screen readers.
 */
function StartBubble({ diameter, side, onPress }: StartBubbleProps) {
  const isRight = side === 'right';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.bubbleSlot,
        { height: diameter },
        isRight ? { left: diameter + BUBBLE_GAP } : { right: diameter + BUBBLE_GAP },
      ]}
    >
      <Pressable onPress={onPress} hitSlop={space.sm} style={styles.bubble}>
        <View
          style={[styles.arrow, isRight ? { left: -ARROW_SIZE / 2 } : { right: -ARROW_SIZE / 2 }]}
        />
        <AppText variant="label" color={colors.surface} numberOfLines={1}>
          {mn.home.start}
        </AppText>
        <Icon name="chevron-forward" size={BUBBLE_CHEVRON} color={colors.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  coin: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', top: 0, left: 0, borderRadius: radius.pill },
  bubbleSlot: { position: 'absolute', top: 0, justifyContent: 'center' },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    marginTop: -ARROW_SIZE / 2,
    backgroundColor: colors.ink,
    transform: [{ rotate: '45deg' }],
  },
});
