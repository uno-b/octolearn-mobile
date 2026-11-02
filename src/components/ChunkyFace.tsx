import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { size } from '@/theme';

interface ChunkyFaceProps {
  pressed?: boolean;
  /** Colour of the darker bottom edge. Without it the face is flat and does not sink. */
  edgeColor?: string;
  radius: number;
  /** Face styling: fill, border, size. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * The chunky look shared by Button, OptionCard and PathNode: a face over a darker edge. The wrapper
 * always reserves the edge height, so pressing sinks the face over the edge without moving layout.
 */
export function ChunkyFace({
  pressed = false,
  edgeColor,
  radius,
  style,
  children,
}: ChunkyFaceProps) {
  const sunk = pressed && edgeColor !== undefined;
  return (
    <View style={styles.wrap}>
      {edgeColor ? (
        <View style={[styles.edge, { backgroundColor: edgeColor, borderRadius: radius }]} />
      ) : null}
      <View
        style={[{ borderRadius: radius, transform: [{ translateY: sunk ? size.edge : 0 }] }, style]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: size.edge },
  edge: { position: 'absolute', top: size.edge, right: 0, bottom: 0, left: 0 },
});
