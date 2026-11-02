import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Celebration } from '@/components/Celebration';
import { Pill } from '@/components/Pill';
import { mn } from '@/i18n/mn';
import * as haptics from '@/lib/haptics';
import { colors } from '@/theme';

export default function LessonDoneScreen() {
  const { xp, next, level } = useLocalSearchParams<{ xp: string; next: string; level: string }>();

  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <Celebration
      icon="checkmark"
      iconBg={colors.primary}
      iconEdge={colors.primaryDark}
      iconColor={colors.onPrimary}
      title={mn.lesson.doneTitle}
      subtitle={next === 'quiz' ? mn.lesson.doneQuiz : mn.lesson.doneNext}
      xp={Number(xp)}
      confetti
      extra={level ? <Pill tone="gold" label={mn.common.levelUp(Number(level))} /> : undefined}
      primary={{ label: mn.common.continue, onPress: () => router.back() }}
    />
  );
}
