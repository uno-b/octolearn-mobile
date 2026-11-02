import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celebration } from '@/components/Celebration';
import { StateView } from '@/components/StateView';
import { content } from '@/content';
import { findQuiz } from '@/domain/path';
import { mn } from '@/i18n/mn';
import * as haptics from '@/lib/haptics';
import { colors } from '@/theme';

type ResultParams = {
  id: string;
  correct: string;
  total: string;
  percent: string;
  passed: string;
  xp: string;
  unlockedUnit: string;
  courseCompleted: string;
};

export default function QuizResultScreen() {
  const params = useLocalSearchParams<ResultParams>();
  const router = useRouter();
  const location = findQuiz(content, params.id);

  if (!location) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
        <StateView
          kind="empty"
          title={mn.quiz.empty}
          actionLabel={mn.common.goHome}
          onAction={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  return (
    <Result
      quizId={params.id}
      unitNumber={location.unitNumber}
      passPercent={location.quiz.passPercent}
      correct={Number(params.correct)}
      total={Number(params.total)}
      percent={Number(params.percent)}
      passed={params.passed === '1'}
      xp={Number(params.xp)}
      // An empty param means nothing was unlocked, e.g. a retake of a passed quiz.
      unlockedUnit={params.unlockedUnit ? Number(params.unlockedUnit) : null}
      courseCompleted={params.courseCompleted === '1'}
    />
  );
}

interface ResultProps {
  quizId: string;
  unitNumber: number;
  passPercent: number;
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  xp: number;
  unlockedUnit: number | null;
  courseCompleted: boolean;
}

function Result({
  quizId,
  unitNumber,
  passPercent,
  correct,
  total,
  percent,
  passed,
  xp,
  unlockedUnit,
  courseCompleted,
}: ResultProps) {
  const router = useRouter();

  useEffect(() => {
    if (passed) haptics.success();
    else haptics.error();
  }, [passed]);

  const goOn = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const retake = () => router.replace({ pathname: '/quiz/[id]', params: { id: quizId } });
  const continueAction = { label: mn.common.continue, onPress: goOn };
  const retakeAction = { label: mn.quiz.retake, onPress: retake };

  if (!passed) {
    return (
      <Celebration
        icon="refresh"
        iconBg={colors.dangerTint}
        iconEdge={colors.dangerDark}
        iconColor={colors.dangerDark}
        title={mn.quiz.fail(correct, total)}
        subtitle={mn.quiz.failSub(percent, passPercent)}
        primary={retakeAction}
        secondary={continueAction}
      />
    );
  }

  let subtitle = mn.quiz.passSubRetake(percent);
  if (courseCompleted) subtitle = mn.quiz.passSubLast(percent);
  else if (unlockedUnit !== null && unlockedUnit !== unitNumber) {
    subtitle = mn.quiz.passSub(percent, unlockedUnit);
  }

  return (
    <Celebration
      icon="star"
      iconBg={colors.gold}
      iconEdge={colors.goldDark}
      iconColor={colors.surface}
      title={mn.quiz.pass(correct, total)}
      subtitle={subtitle}
      xp={xp}
      confetti
      primary={continueAction}
      secondary={retakeAction}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
