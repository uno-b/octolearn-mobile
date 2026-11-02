import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { colors, size } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size: iconSize = size.icon, color = colors.text }: IconProps) {
  return <Ionicons name={name} size={iconSize} color={color} />;
}
