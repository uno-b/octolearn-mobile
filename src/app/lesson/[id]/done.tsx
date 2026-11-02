import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

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

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

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
      extra={
        level ? (
          // Pill aligns itself to flex-start, so a shrink-wrapped parent is what centres it here.
          <View>
            <Pill tone="gold" label={mn.lesson.doneLevel(Number(level))} />
          </View>
        ) : undefined
      }
      primary={{ label: mn.common.continue, onPress: leave }}
    />
  );
}
