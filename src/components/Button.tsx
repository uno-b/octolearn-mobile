import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import { ChunkyFace } from './ChunkyFace';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'outline' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: IconName;
}

interface Look {
  face: string;
  /** The disabled look has no edge and does not sink. */
  edge?: string;
  border?: string;
  label: string;
}

const BORDER_WIDTH = 2;

const LOOKS: Record<Variant, Look> = {
  primary: { face: colors.primary, edge: colors.primaryDark, label: colors.onPrimary },
  outline: {
    face: colors.surface,
    edge: colors.borderStrong,
    border: colors.borderStrong,
    label: colors.primaryDark,
  },
  danger: {
    face: colors.surface,
    edge: colors.borderStrong,
    border: colors.borderStrong,
    label: colors.dangerDark,
  },
};

const DISABLED_LOOK: Look = { face: colors.locked, label: colors.textMuted };

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
}: ButtonProps) {
  const look = disabled ? DISABLED_LOOK : LOOKS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={styles.root}
    >
      {({ pressed }) => (
        <ChunkyFace
          pressed={pressed}
          edgeColor={look.edge}
          radius={radius.btn}
          style={[
            styles.face,
            { backgroundColor: look.face },
            look.border !== undefined && { borderWidth: BORDER_WIDTH, borderColor: look.border },
          ]}
        >
          <View style={styles.content}>
            {icon ? <Icon name={icon} color={look.label} /> : null}
            <AppText
              variant="headline"
              color={look.label}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.label}
            >
              {label}
            </AppText>
          </View>
        </ChunkyFace>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  face: {
    height: size.btn,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  // Lets adjustsFontSizeToFit shrink the label instead of pushing it out of the row.
  label: { flexShrink: 1 },
});
