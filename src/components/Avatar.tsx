import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { getInitial } from '@/domain/stats';
import { colors, motion, radius, size } from '@/theme';

import { AppText } from './AppText';

interface AvatarProps {
  name: string;
  uri?: string | null;
}

export function Avatar({ name, uri }: AvatarProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={name} style={styles.circle}>
      <AppText variant="display" color={colors.primaryDark}>
        {getInitial(name)}
      </AppText>
      {/* Drawn over the initial, which stays visible while loading or if the image fails. */}
      {uri ? (
        <Image
          source={{ uri }}
          contentFit="cover"
          transition={motion.fast}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: size.avatar,
    height: size.avatar,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
