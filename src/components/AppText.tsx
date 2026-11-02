import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, type, type TypeVariant } from '@/theme';

interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  color = colors.text,
  align,
  maxFontSizeMultiplier = 1.3,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[type[variant], styles.base, { color, textAlign: align }, style]}
    />
  );
}

const styles = StyleSheet.create({
  // Android adds extra top and bottom space to custom fonts otherwise.
  base: { includeFontPadding: false },
});
