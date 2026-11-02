import { router, useIsFocused } from 'expo-router';
import { Fragment, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PathNode } from '@/components/PathNode';
import { Pill } from '@/components/Pill';
import { ProgressBar } from '@/components/ProgressBar';
import { Toast } from '@/components/Toast';
import { UnitHeader } from '@/components/UnitHeader';
import type { PathNode as PathNodeData } from '@/domain/types';
import { useFocusedValue } from '@/hooks/useFocusedValue';
import { usePath, useStats } from '@/hooks/useProgress';
import { useScrollToActive } from '@/hooks/useScrollToActive';
import { useUnlockedId } from '@/hooks/useUnlockedId';
import { mn } from '@/i18n/mn';
import * as haptics from '@/lib/haptics';
import { colors, radius, space } from '@/theme';

const ROW_HEIGHT = 100;
/** Sideways position of each node in a unit, as a fraction of the amplitude. */
const WAVE = [0, 0.6, 1, 0.6, 0, -0.6];
const AMPLITUDE_RATIO = 0.22;
const AMPLITUDE_MIN = 56;
const AMPLITUDE_MAX = 96;

export default function PathwayScreen() {
  const path = usePath();
  const activeId = useFocusedValue(path.active?.id ?? null);
  const unlockedId = useUnlockedId(activeId);
  const { scrollRef, onViewportLayout, onRowLayout } = useScrollToActive(activeId);
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const [toast, setToast] = useState({ message: '', key: 0 });

  const amplitude = Math.min(AMPLITUDE_MAX, Math.max(AMPLITUDE_MIN, width * AMPLITUDE_RATIO));

  const openNode = (node: PathNodeData) => {
    // A fast double tap would stack two copies, and Continue would then land on the first one.
    if (!isFocused) return;
    router.push({
      pathname: node.kind === 'lesson' ? '/lesson/[id]' : '/quiz/[id]',
      params: { id: node.id },
    });
  };

  const showLockedToast = (node: PathNodeData) => {
    haptics.warn();
    const message = node.kind === 'quiz' ? mn.home.lockedQuizToast : mn.home.lockedToast;
    setToast(({ key }) => ({ message, key: key + 1 }));
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <PathHeader />
      <ScrollView
        ref={scrollRef}
        onLayout={onViewportLayout}
        contentContainerStyle={styles.content}
      >
        {activeId === null ? <CourseDoneCard /> : null}
        {path.units.map((unit) => (
          <Fragment key={unit.id}>
            <View style={styles.unitHeader}>
              <UnitHeader
                index={unit.index + 1}
                title={unit.title}
                locked={unit.status === 'locked'}
              />
            </View>
            {unit.nodes.map((node) => (
              <NodeRow
                key={node.id}
                node={node}
                offset={zigzagOffset(node, amplitude)}
                celebrate={node.id === unlockedId}
                onLayout={(event) => onRowLayout(node.id, event)}
                onPress={() => openNode(node)}
                onLockedPress={() => showLockedToast(node)}
              />
            ))}
          </Fragment>
        ))}
      </ScrollView>
      <Toast message={toast.message} showKey={toast.key} />
    </SafeAreaView>
  );
}

function zigzagOffset(node: PathNodeData, amplitude: number): number {
  const mirror = node.unitIndex % 2 === 1 ? -1 : 1;
  return WAVE[node.indexInUnit] * amplitude * mirror;
}

function nodeLabel(node: PathNodeData): string {
  const label = `${node.title}, ${mn.a11y[node.status]}`;
  return node.kind === 'quiz' ? `${mn.a11y.quiz}, ${label}` : label;
}

function PathHeader() {
  const { totalXp, streak, course } = useFocusedValue(useStats());

  return (
    <View style={styles.header}>
      <View style={styles.pills}>
        <Pill
          tone="coral"
          icon="flame"
          label={String(streak.count)}
          accessibilityLabel={mn.a11y.streak(streak.count)}
        />
        <Pill
          tone="primary"
          icon="flash"
          label={mn.common.xp(totalXp)}
          bumpKey={totalXp}
          accessibilityLabel={mn.a11y.xp(totalXp)}
        />
      </View>
      <ProgressBar value={course.percent / 100} />
      <AppText variant="caption" color={colors.textSec}>
        {mn.home.progress(course.completedLessons, course.totalLessons, course.percent)}
      </AppText>
    </View>
  );
}

function CourseDoneCard() {
  return (
    <View style={styles.doneCard}>
      <AppText variant="title" color={colors.goldText} align="center">
        {mn.home.courseDoneTitle}
      </AppText>
      <AppText color={colors.textSec} align="center">
        {mn.home.courseDoneSub}
      </AppText>
    </View>
  );
}

interface NodeRowProps {
  node: PathNodeData;
  offset: number;
  celebrate: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: () => void;
  onLockedPress: () => void;
}

function NodeRow({ node, offset, celebrate, onLayout, onPress, onLockedPress }: NodeRowProps) {
  // The bubble takes the side facing the screen centre, where there is room for it.
  const facingCentre = offset > 0 ? 'left' : 'right';

  return (
    <View style={styles.row} onLayout={onLayout}>
      <View style={{ transform: [{ translateX: offset }] }}>
        <PathNode
          status={node.status}
          kind={node.kind}
          bubbleSide={node.status === 'active' ? facingCentre : undefined}
          celebrate={celebrate}
          onPress={onPress}
          onLockedPress={onLockedPress}
          accessibilityLabel={nodeLabel(node)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pills: { flexDirection: 'row', justifyContent: 'space-between' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  unitHeader: { marginTop: space.lg },
  doneCard: {
    gap: space.xs,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.goldTint,
  },
  row: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
});
