import { StyleSheet, View } from 'react-native';

import type { DayActivity } from '@/domain/types';
import { mn } from '@/i18n/mn';
import { colors, fonts, radius, space } from '@/theme';

import { AppText } from './AppText';

const CHART_HEIGHT = 120;
const MIN_BAR_HEIGHT = 4;
const BAR_WIDTH = 24;

interface WeeklyChartProps {
  /** Seven days, oldest first. */
  days: DayActivity[];
}

export function WeeklyChart({ days }: WeeklyChartProps) {
  // Floor of 1 keeps an all-zero week from dividing by zero: every bar is then a stub.
  const maxXp = Math.max(1, ...days.map((d) => d.xp));

  return (
    <View style={styles.row}>
      {days.map((d) => {
        const weekday = mn.profile.weekdays[d.weekdayIndex];
        const barHeight = Math.max(MIN_BAR_HEIGHT, (d.xp / maxXp) * CHART_HEIGHT);

        return (
          <View
            key={d.day}
            accessible
            accessibilityLabel={`${weekday}: ${mn.common.xp(d.xp)}`}
            style={styles.column}
          >
            <View style={styles.barSlot}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: d.isToday ? colors.primary : colors.primaryTint,
                  },
                ]}
              />
            </View>
            <AppText
              variant="caption"
              color={d.isToday ? colors.primaryDark : colors.textSec}
              style={d.isToday && styles.todayLabel}
            >
              {weekday}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  column: { flex: 1, alignItems: 'center', gap: space.sm },
  barSlot: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: BAR_WIDTH, borderRadius: radius.sm },
  todayLabel: { fontFamily: fonts.bold },
});
