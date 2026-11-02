import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { getInitial } from '@/domain/stats';
import { colors, motion, radius, size } from '@/theme';

import { AppText } from './AppText';

/** From this diameter up the initial uses the display type, below it the headline type. */
const LARGE_AVATAR = 64;

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size: diameter = size.avatar }: AvatarProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[styles.circle, { width: diameter, height: diameter }]}
    >
      <AppText
        variant={diameter >= LARGE_AVATAR ? 'display' : 'headline'}
        color={colors.primaryDark}
      >
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
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
