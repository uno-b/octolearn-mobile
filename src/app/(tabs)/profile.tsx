import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { StatCard } from '@/components/StatCard';
import { WeeklyChart } from '@/components/WeeklyChart';
import type { Account, DayActivity, LevelInfo, ProfileStats } from '@/domain/types';
import { useStats } from '@/hooks/useProgress';
import { mn } from '@/i18n/mn';
import * as haptics from '@/lib/haptics';
import { useProgressStore } from '@/store/progressStore';
import { colors, radius, space } from '@/theme';

const LEVEL_BAR_HEIGHT = 10;
const LEVEL_BAR_MAX_WIDTH = 240;
const CARD_BORDER = 2;

export default function ProfileScreen() {
  const stats = useStats();
  const user = useProgressStore((s) => s.user);
  const reset = useProgressStore((s) => s.reset);

  // user is null for one render during reset, before the root layout guard leaves this screen.
  if (!user) return null;

  const confirmReset = () => {
    Alert.alert(mn.profile.resetTitle, mn.profile.resetBody, [
      { text: mn.common.cancel, style: 'cancel' },
      {
        text: mn.profile.resetConfirm,
        style: 'destructive',
        onPress: () => {
          reset();
          haptics.success();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header user={user} level={stats.level} />
        <StatGrid stats={stats} />
        <WeekSection days={stats.weekly} />
        <View style={styles.reset}>
          <Button variant="danger" icon="refresh" label={mn.profile.reset} onPress={confirmReset} />
          <AppText variant="caption" color={colors.textSec} align="center">
            {mn.profile.resetNote}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ user, level }: { user: Account; level: LevelInfo }) {
  // 'YYYY-MM-DD'. The month is shown without its leading zero.
  const [year, month] = user.joinedOn.split('-');

  return (
    <View style={styles.header}>
      <Avatar name={user.name} uri={user.avatarUrl} />
      <View style={styles.identity}>
        <AppText variant="title" align="center">
          {user.name}
        </AppText>
        <AppText variant="caption" color={colors.textSec} align="center">
          {mn.profile.levelSince(level.level, year, Number(month))}
        </AppText>
      </View>
      <View style={styles.levelProgress}>
        <ProgressBar value={level.progress} height={LEVEL_BAR_HEIGHT} />
        <AppText variant="caption" color={colors.textSec} align="center">
          {mn.profile.levelXp(level.xpIntoLevel, level.xpPerLevel)}
        </AppText>
      </View>
    </View>
  );
}

function StatGrid({ stats }: { stats: ProfileStats }) {
  const { course, streak, averageQuizPercent } = stats;

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard
          icon="flash"
          tone="primary"
          value={String(stats.totalXp)}
          label={mn.profile.totalXp}
        />
        <StatCard
          icon="flame"
          tone="coral"
          value={mn.profile.days(streak.count)}
          label={mn.profile.streak}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          icon="play-circle"
          tone="primary"
          value={mn.profile.fraction(course.completedLessons, course.totalLessons)}
          label={mn.profile.lessons}
        />
        <StatCard
          icon="trophy"
          tone="gold"
          value={mn.profile.fraction(course.quizzesPassed, course.totalQuizzes)}
          label={mn.profile.quizzesPassed}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          icon="star"
          tone="gold"
          value={
            averageQuizPercent === null ? mn.profile.none : mn.profile.percent(averageQuizPercent)
          }
          label={mn.profile.quizAvg}
        />
        <StatCard
          icon="pie-chart"
          tone="success"
          value={mn.profile.percent(course.percent)}
          label={mn.profile.courseProgress}
        />
      </View>
    </View>
  );
}

function WeekSection({ days }: { days: DayActivity[] }) {
  const isEmpty = days.every((d) => d.xp === 0);

  return (
    <View style={styles.week}>
      <AppText variant="headline">{mn.profile.weekTitle}</AppText>
      <View style={styles.weekCard}>
        <WeeklyChart days={days} />
        {isEmpty ? (
          <AppText variant="caption" color={colors.textSec} align="center">
            {mn.profile.weekEmpty}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  header: { alignItems: 'center', gap: space.md },
  identity: { alignItems: 'center', gap: space.xs },
  levelProgress: { width: '100%', maxWidth: LEVEL_BAR_MAX_WIDTH, gap: space.xs },
  grid: { gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
  week: { gap: space.md },
  weekCard: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    borderWidth: CARD_BORDER,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reset: { gap: space.sm },
});
