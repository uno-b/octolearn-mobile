import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Fire-and-forget feedback. Android uses the system haptic constants because they need no
 * VIBRATE permission. A device without a haptic engine rejects, which is not worth surfacing.
 */
function play(ios: () => Promise<void>, android: Haptics.AndroidHaptics) {
  const run = Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(android) : ios();
  run.catch(() => {});
}

export const tap = () =>
  play(
    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    Haptics.AndroidHaptics.Virtual_Key,
  );

export const select = () =>
  play(() => Haptics.selectionAsync(), Haptics.AndroidHaptics.Segment_Tick);

export const success = () =>
  play(
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    Haptics.AndroidHaptics.Confirm,
  );

export const error = () =>
  play(
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    Haptics.AndroidHaptics.Reject,
  );

export const warn = () =>
  play(
    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    Haptics.AndroidHaptics.Long_Press,
  );
