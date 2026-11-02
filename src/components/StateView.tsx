import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { mn } from '@/i18n/mn';
import { colors, space } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

const ICON_SIZE = 48;
const ACTION_MAX_WIDTH = 280;

const DEFAULT_ICON: Record<'error' | 'empty', IconName> = {
  error: 'alert-circle-outline',
  empty: 'file-tray-outline',
};

interface StateViewProps {
  kind: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Light-on-dark colours, for use inside the black video box. */
  dark?: boolean;
  icon?: IconName;
}

export function StateView({
  kind,
  title,
  message,
  actionLabel,
  onAction,
  dark = false,
  icon,
}: StateViewProps) {
  const titleColor = dark ? colors.surface : colors.text;
  const bodyColor = dark ? colors.locked : colors.textSec;

  return (
    <View style={styles.root}>
      {kind === 'loading' ? (
        <ActivityIndicator
          size="large"
          color={dark ? colors.surface : colors.primary}
          accessibilityLabel={mn.common.loading}
        />
      ) : (
        <Icon name={icon ?? DEFAULT_ICON[kind]} size={ICON_SIZE} color={bodyColor} />
      )}
      {title ? (
        <AppText variant="headline" color={titleColor} align="center">
          {title}
        </AppText>
      ) : null}
      {message ? (
        <AppText color={bodyColor} align="center">
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant={dark ? 'outline' : 'primary'} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  action: { width: '100%', maxWidth: ACTION_MAX_WIDTH, marginTop: space.sm },
});
