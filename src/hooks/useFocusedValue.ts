import { useIsFocused } from 'expo-router';
import { useState } from 'react';

/**
 * Returns `value` while the screen is focused and the last focused value otherwise, so a change made
 * on a screen above this one only reaches this screen's animations when the learner comes back.
 */
export function useFocusedValue<T>(value: T): T {
  const isFocused = useIsFocused();
  const [focusedValue, setFocusedValue] = useState(value);

  // Adjusting state during render: React restarts this render at once, without committing it.
  if (isFocused && value !== focusedValue) setFocusedValue(value);

  return isFocused ? value : focusedValue;
}
