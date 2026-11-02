import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mn } from '@/i18n/mn';
import { colors, motion, radius, space } from '@/theme';

import { AppText } from './AppText';
import { BottomBar } from './BottomBar';
import { Button } from './Button';
import { ChunkyFace } from './ChunkyFace';
import { Confetti } from './Confetti';
import { Icon, type IconName } from './Icon';
import { Pill } from './Pill';

const CIRCLE = 128;
const CIRCLE_COMPACT = 96;
/** Below this window height the circle shrinks so the content fits above the buttons. */
const COMPACT_HEIGHT = 700;

interface ActionProps {
  label: string;
  onPress: () => void;
}

interface CelebrationProps {
  icon: IconName;
  iconBg: string;
  iconEdge: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  xp?: number;
  confetti?: boolean;
  primary: ActionProps;
  secondary?: ActionProps;
  /** Rendered below the XP pill. */
  extra?: ReactNode;
}

export function Celebration({
  icon,
  iconBg,
  iconEdge,
  iconColor,
  title,
  subtitle,
  xp = 0,
  confetti = false,
  primary,
  secondary,
  extra,
}: CelebrationProps) {
  const { height } = useWindowDimensions();
  const circle = height < COMPACT_HEIGHT ? CIRCLE_COMPACT : CIRCLE;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.springify()}>
          <ChunkyFace
            edgeColor={iconEdge}
            radius={radius.pill}
            style={[styles.circle, { width: circle, height: circle, backgroundColor: iconBg }]}
          >
            <Icon name={icon} size={circle / 2} color={iconColor} />
          </ChunkyFace>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(motion.base)} style={styles.text}>
          <AppText variant="display" align="center" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText color={colors.textSec} align="center">
              {subtitle}
            </AppText>
          ) : null}
        </Animated.View>
        {xp > 0 ? <Pill tone="primary" label={mn.common.xpGain(xp)} /> : null}
        {extra}
      </View>
      {confetti ? <Confetti /> : null}
      <BottomBar>
        {secondary ? (
          <Button label={secondary.label} onPress={secondary.onPress} variant="outline" />
        ) : null}
        <Button label={primary.label} onPress={primary.onPress} />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: space.xl,
  },
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { alignItems: 'center', gap: space.sm },
});
