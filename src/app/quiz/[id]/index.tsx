import { router, useLocalSearchParams } from 'expo-router';
import { type ComponentProps, useEffect, useReducer, useRef } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, SlideInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BottomBar } from '@/components/BottomBar';
import { Button } from '@/components/Button';
import { OptionCard } from '@/components/OptionCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StateView } from '@/components/StateView';
import { content } from '@/content';
import { findQuiz } from '@/domain/path';
import { initialQuizSession, quizSessionReducer } from '@/domain/quizSession';
import type { Question, QuizSession } from '@/domain/types';
import { useNodeStatus } from '@/hooks/useProgress';
import { mn } from '@/i18n/mn';
import * as haptics from '@/lib/haptics';
import { useProgressStore } from '@/store/progressStore';
import { colors, radius, space } from '@/theme';

type OptionState = ComponentProps<typeof OptionCard>['state'];

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const status = useNodeStatus(id);
  const questions = findQuiz(content, id)?.quiz.questions;

  if (!questions?.length) {
    return (
      <Notice
        title={mn.quiz.empty}
        actionLabel={mn.common.goHome}
        onAction={() => router.replace('/')}
      />
    );
  }

  if (status === 'locked') {
    return (
      <Notice
        title={mn.home.lockedQuizToast}
        actionLabel={mn.common.back}
        onAction={() => router.back()}
      />
    );
  }

  return <QuizPlayer quizId={id} questions={questions} />;
}

function Notice({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <StateView kind="empty" title={title} actionLabel={actionLabel} onAction={onAction} />
    </SafeAreaView>
  );
}

function QuizPlayer({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const submitQuiz = useProgressStore((s) => s.submitQuiz);
  const [session, dispatch] = useReducer(quizSessionReducer, initialQuizSession);
  const submitted = useRef(false);

  const total = questions.length;
  const question = questions[session.index];
  const isLast = session.index === total - 1;
  // Each check appends exactly one answer, so this is also the number of checked questions.
  const answered = session.answers.length;

  const select = (option: number) => {
    haptics.select();
    dispatch({ type: 'select', option });
  };

  const check = () => {
    if (session.selected === null) return;
    dispatch({ type: 'check' });
    if (session.selected === question.answerIndex) haptics.success();
    else haptics.error();
  };

  const seeResult = () => {
    if (submitted.current) return;
    submitted.current = true;
    const r = submitQuiz(quizId, session.answers);
    router.replace({
      pathname: '/quiz/[id]/result',
      params: {
        id: quizId,
        correct: String(r.correct),
        total: String(r.total),
        percent: String(r.percent),
        passed: r.passed ? '1' : '0',
        xp: String(r.xpGained),
        unlockedUnit: r.unlocked ? String(r.unlocked.unitNumber) : '',
        level: r.leveledUp ? String(r.level) : '',
        courseCompleted: r.courseCompleted ? '1' : '0',
      },
    });
  };

  const close = () => {
    if (answered === 0) {
      router.back();
      return;
    }
    Alert.alert(mn.quiz.exitTitle, mn.quiz.exitBody, [
      { text: mn.common.cancel, style: 'cancel' },
      { text: mn.quiz.exitConfirm, style: 'destructive', onPress: () => router.back() },
    ]);
  };

  // Android's back button gets the same confirmation as the close button.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => subscription.remove();
  });

  const action = !session.checked
    ? { label: mn.quiz.check, onPress: check }
    : isLast
      ? { label: mn.quiz.seeResult, onPress: seeResult }
      : { label: mn.quiz.next, onPress: () => dispatch({ type: 'next' }) };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScreenHeader left="close" onLeft={close}>
        <ProgressBar value={answered / total} color={colors.success} />
      </ScreenHeader>
      <AppText variant="caption" color={colors.textSec} align="right" style={styles.counter}>
        {mn.quiz.progress(session.index + 1, total)}
      </AppText>
      <Animated.View key={session.index} entering={FadeInRight} style={styles.body}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="h1" accessibilityRole="header">
            {question.text}
          </AppText>
          <View style={styles.options}>
            {question.options.map((label, option) => (
              <OptionCard
                key={option}
                label={label}
                state={optionState(option, session, question.answerIndex)}
                onPress={() => select(option)}
                disabled={session.checked}
              />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
      <BottomBar>
        {session.checked ? (
          <FeedbackStrip
            correct={session.selected === question.answerIndex}
            answer={question.options[question.answerIndex]}
          />
        ) : null}
        <Button
          label={action.label}
          onPress={action.onPress}
          disabled={!session.checked && session.selected === null}
        />
      </BottomBar>
    </SafeAreaView>
  );
}

function optionState(option: number, session: QuizSession, answerIndex: number): OptionState {
  if (!session.checked) return option === session.selected ? 'selected' : 'idle';
  if (option === answerIndex) return 'correct';
  return option === session.selected ? 'wrong' : 'dim';
}

function FeedbackStrip({ correct, answer }: { correct: boolean; answer: string }) {
  return (
    <Animated.View
      entering={SlideInDown.springify()}
      accessibilityLiveRegion="polite"
      style={[styles.strip, { backgroundColor: correct ? colors.successTint : colors.dangerTint }]}
    >
      <AppText variant="headline" color={correct ? colors.successText : colors.dangerDark}>
        {correct ? mn.quiz.correct : mn.quiz.wrong}
      </AppText>
      {correct ? null : <AppText color={colors.dangerDark}>{mn.quiz.answerIs(answer)}</AppText>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  counter: { paddingHorizontal: space.lg },
  body: { flex: 1 },
  content: { gap: space.xl, padding: space.lg },
  options: { gap: space.md },
  strip: { gap: space.xs, padding: space.lg, borderRadius: radius.btn },
});
