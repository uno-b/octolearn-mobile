import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { colors, size } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Loaded with the app fonts, so icons never flash in on first render. */
export const iconFonts = Ionicons.font;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size: iconSize = size.icon, color = colors.text }: IconProps) {
  return <Ionicons name={name} size={iconSize} color={color} />;
}
