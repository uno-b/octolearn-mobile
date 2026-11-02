import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, ScrollViewInstance } from 'react-native';

const SCROLL_DELAY_MS = 250;
/** Where the active row settles, as a fraction of the viewport height from the top. */
const SCROLL_ANCHOR = 0.35;

/**
 * Scrolls to the row of `activeId` when it changes and after the first layout, or to the top when it
 * is null. Rows must be direct children of the scroll content, so each layout y is a scroll offset.
 */
export function useScrollToActive(activeId: string | null) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const rowY = useRef(new Map<string, number>());
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (viewportHeight === 0) return;
    // The row is read when the timer fires because an unlocked unit header moves the rows below it.
    const timer = setTimeout(() => {
      const y = activeId === null ? 0 : rowY.current.get(activeId);
      if (y === undefined) return;
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - viewportHeight * SCROLL_ANCHOR),
        animated: true,
      });
    }, SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [activeId, viewportHeight]);

  return {
    scrollRef,
    onViewportLayout: (event: LayoutChangeEvent) =>
      setViewportHeight(event.nativeEvent.layout.height),
    onRowLayout: (id: string, event: LayoutChangeEvent) => {
      rowY.current.set(id, event.nativeEvent.layout.y);
    },
  };
}
