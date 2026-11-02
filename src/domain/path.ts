import type {
  CourseContent,
  CoursePath,
  LessonLocation,
  NodeKind,
  NodeStatus,
  PathNode,
  Progress,
  QuizLocation,
} from './types';

export function listNodes(content: CourseContent): Omit<PathNode, 'status'>[] {
  return content.units.flatMap((unit, unitIndex) => [
    ...unit.lessons.map((lesson, indexInUnit) => ({
      kind: 'lesson' as const,
      id: lesson.id,
      title: lesson.title,
      unitIndex,
      indexInUnit,
    })),
    // Quizzes have no title of their own in the content, so the node carries the unit's.
    {
      kind: 'quiz' as const,
      id: unit.quiz.id,
      title: unit.title,
      unitIndex,
      indexInUnit: unit.lessons.length,
    },
  ]);
}

export function isNodeDone(progress: Progress, node: { kind: NodeKind; id: string }): boolean {
  return node.kind === 'lesson'
    ? progress.completedLessons[node.id] !== undefined
    : Boolean(progress.quizResults[node.id]?.passedOn);
}

function getUnitStatus(nodes: PathNode[]): NodeStatus {
  if (nodes.every((node) => node.status === 'completed')) return 'completed';
  return nodes.some((node) => node.status === 'active') ? 'active' : 'locked';
}

export function buildPath(content: CourseContent, progress: Progress): CoursePath {
  const allNodes = listNodes(content);
  const activeId = allNodes.find((node) => !isNodeDone(progress, node))?.id;
  const nodes: PathNode[] = allNodes.map((node) => {
    if (isNodeDone(progress, node)) return { ...node, status: 'completed' };
    return { ...node, status: node.id === activeId ? 'active' : 'locked' };
  });

  return {
    units: content.units.map((unit, index) => {
      const unitNodes = nodes.filter((node) => node.unitIndex === index);
      return {
        id: unit.id,
        title: unit.title,
        index,
        status: getUnitStatus(unitNodes),
        nodes: unitNodes,
      };
    }),
    active: nodes.find((node) => node.status === 'active') ?? null,
  };
}

export function getNodeStatus(
  content: CourseContent,
  progress: Progress,
  nodeId: string,
): NodeStatus | null {
  const nodes = buildPath(content, progress).units.flatMap((unit) => unit.nodes);
  return nodes.find((node) => node.id === nodeId)?.status ?? null;
}

export function getLessonLocation(content: CourseContent, lessonId: string): LessonLocation | null {
  for (const [unitIndex, unit] of content.units.entries()) {
    const lessonIndex = unit.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex !== -1) {
      return {
        unit,
        unitNumber: unitIndex + 1,
        lesson: unit.lessons[lessonIndex],
        lessonNumber: lessonIndex + 1,
        lessonCount: unit.lessons.length,
      };
    }
  }
  return null;
}

export function findQuiz(content: CourseContent, quizId: string): QuizLocation | null {
  const unitIndex = content.units.findIndex((unit) => unit.quiz.id === quizId);
  if (unitIndex === -1) return null;
  const unit = content.units[unitIndex];
  return { unit, unitNumber: unitIndex + 1, quiz: unit.quiz };
}
