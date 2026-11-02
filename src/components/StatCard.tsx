import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { TONE_COLORS, type Tone } from './Pill';

const ICON_CIRCLE = 36;
const BORDER_WIDTH = 2;

interface StatCardProps {
  icon: IconName;
  tone: Tone;
  value: string;
  label: string;
}

export function StatCard({ icon, tone, value, label }: StatCardProps) {
  const { bg, fg } = TONE_COLORS[tone];

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Icon name={icon} color={fg} />
      </View>
      <View>
        <AppText variant="h1">{value}</AppText>
        <AppText variant="caption" color={colors.textSec} numberOfLines={2}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
