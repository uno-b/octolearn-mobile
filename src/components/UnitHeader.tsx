import { StyleSheet, View } from 'react-native';

import { mn } from '@/i18n/mn';
import { colors, radius, space } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

const BORDER_WIDTH = 2;

interface UnitHeaderProps {
  /** 1-based unit number. */
  index: number;
  title: string;
  locked?: boolean;
}

export function UnitHeader({ index, title, locked = false }: UnitHeaderProps) {
  const eyebrow = mn.home.unitEyebrow(index);

  if (locked) {
    return (
      <View accessible accessibilityRole="header" style={[styles.banner, styles.lockedBanner]}>
        <View style={styles.text}>
          <AppText variant="micro" color={colors.textMuted}>
            {eyebrow}
          </AppText>
          <AppText variant="headline" color={colors.textMuted}>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.textSec} style={styles.caption}>
            {mn.home.unitLocked}
          </AppText>
        </View>
        <Icon name="lock-closed" color={colors.lockedIcon} />
      </View>
    );
  }

  return (
    <View accessible accessibilityRole="header" style={[styles.banner, styles.unlockedBanner]}>
      <View style={styles.text}>
        <AppText variant="micro" color={colors.onPrimary}>
          {eyebrow}
        </AppText>
        <AppText variant="headline" color={colors.onPrimary}>
          {title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
  },
  unlockedBanner: { backgroundColor: colors.primary },
  lockedBanner: {
    backgroundColor: colors.surface,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.border,
  },
  text: { flex: 1 },
  caption: { marginTop: space.xs },
});
