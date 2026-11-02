import { useEventListener } from 'expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BottomBar } from '@/components/BottomBar';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StateView } from '@/components/StateView';
import { content } from '@/content';
import { WATCH_TICK_SEC } from '@/domain/constants';
import { getLessonLocation } from '@/domain/path';
import type { Lesson, LessonLocation } from '@/domain/types';
import { useNodeStatus } from '@/hooks/useProgress';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { mn } from '@/i18n/mn';
import { useFeedbackMotion } from '@/lib/feedbackMotion';
import { formatDuration } from '@/lib/format';
import * as haptics from '@/lib/haptics';
import { useProgressStore } from '@/store/progressStore';
import { colors, space } from '@/theme';

const VIDEO_ASPECT = 16 / 9;
const META_ICON = 16;

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const status = useNodeStatus(id);
  const location = getLessonLocation(content, id);

  if (!location) return <Unavailable title={mn.lesson.notFound} />;
  if (status === 'locked') {
    return <Unavailable title={mn.home.lockedToast} icon="lock-closed-outline" />;
  }
  return <LessonContent location={location} alreadyCompleted={status === 'completed'} />;
}

function Unavailable({ title, icon }: { title: string; icon?: IconName }) {
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <StateView
        kind="empty"
        title={title}
        icon={icon}
        actionLabel={mn.common.back}
        onAction={() => router.back()}
      />
    </SafeAreaView>
  );
}

function LessonContent({
  location,
  alreadyCompleted,
}: {
  location: LessonLocation;
  alreadyCompleted: boolean;
}) {
  const { lesson, unitNumber, lessonNumber, lessonCount } = location;
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const player = useVideoPlayer(lesson.videoUrl, (p) => {
    p.timeUpdateEventInterval = WATCH_TICK_SEC;
    p.play();
  });
  const { canFinish } = useWatchProgress(player, alreadyCompleted);
  const finished = useRef(false);

  const finish = () => {
    // A second tap would see 0 XP and go back, over the done screen the first tap opened.
    if (finished.current) return;
    finished.current = true;

    const summary = completeLesson(lesson.id);
    if (summary.xpGained > 0) {
      router.replace({
        pathname: '/lesson/[id]/done',
        params: {
          id: lesson.id,
          xp: String(summary.xpGained),
          next: summary.unlocked?.kind ?? 'none',
          level: summary.leveledUp ? String(summary.level) : '',
        },
      });
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScreenHeader
        left="back"
        onLeft={() => router.back()}
        title={mn.lesson.header(unitNumber, lessonNumber, lessonCount)}
      />
      <LessonVideo lesson={lesson} player={player} />
      <LessonInfo lesson={lesson} />
      <FinishBar canFinish={canFinish} onFinish={finish} />
    </SafeAreaView>
  );
}

/** What the box shows over the video, which is not the same as the player's status. */
type VideoPhase = 'loading' | 'ready' | 'error';

function LessonVideo({ lesson, player }: { lesson: Lesson; player: VideoPlayer }) {
  const [phase, setPhase] = useState<VideoPhase>('loading');
  const retries = useRef(0);

  // 'idle' and 'loading' do not change the phase: once playing, they only mean a buffering pause
  // or the end of the video, and the native controls already cover those.
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') setPhase('ready');
    if (status === 'error') setPhase('error');
  });

  const retry = () => {
    // The first retry repeats the main host, in case the failure was a passing one.
    const source =
      retries.current % 2 === 1 ? (lesson.fallbackUrl ?? lesson.videoUrl) : lesson.videoUrl;
    retries.current += 1;
    setPhase('loading');
    player
      .replaceAsync(source)
      .then(() => player.play())
      .catch(() => setPhase('error'));
  };

  return (
    // The error state is taller than 16:9 on a phone, so it sizes the box to keep retry reachable.
    <View style={[styles.video, phase !== 'error' && styles.videoAspect]}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true, orientation: 'landscape' }}
        style={StyleSheet.absoluteFill}
      />
      {phase === 'loading' ? (
        <View pointerEvents="none" style={styles.loading}>
          <StateView kind="loading" dark />
        </View>
      ) : null}
      {phase === 'error' ? (
        <View style={styles.error}>
          <StateView
            kind="error"
            dark
            icon="cloud-offline-outline"
            title={mn.lesson.errorTitle}
            message={mn.lesson.errorBody}
            actionLabel={mn.common.retry}
            onAction={retry}
          />
        </View>
      ) : null}
    </View>
  );
}

function LessonInfo({ lesson }: { lesson: Lesson }) {
  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <AppText variant="h1" accessibilityRole="header">
        {lesson.title}
      </AppText>
      <View style={styles.meta}>
        <Icon name="videocam-outline" size={META_ICON} color={colors.textSec} />
        <AppText variant="caption" color={colors.textSec}>
          {mn.lesson.meta(formatDuration(lesson.durationSec))}
        </AppText>
      </View>
      <AppText color={colors.textSec}>{lesson.description}</AppText>
    </ScrollView>
  );
}

function FinishBar({ canFinish, onFinish }: { canFinish: boolean; onFinish: () => void }) {
  const { style, bump } = useFeedbackMotion();
  const announced = useRef(canFinish);

  useEffect(() => {
    if (!canFinish || announced.current) return;
    announced.current = true;
    haptics.select();
    bump();
  }, [canFinish, bump]);

  return (
    <BottomBar hint={canFinish ? undefined : mn.lesson.finishHint}>
      <Animated.View style={style}>
        <Button label={mn.lesson.finish} onPress={onFinish} disabled={!canFinish} />
      </Animated.View>
    </BottomBar>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  video: { width: '100%', backgroundColor: colors.videoBg },
  videoAspect: { aspectRatio: VIDEO_ASPECT },
  loading: { ...StyleSheet.absoluteFill, backgroundColor: colors.videoBg },
  error: { backgroundColor: colors.videoBg },
  body: { flex: 1 },
  bodyContent: { gap: space.sm, padding: space.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
