import { router, useLocalSearchParams } from 'expo-router';

import { QuestionCard } from '@/components/QuestionCard';
import { Button, Header, Screen, T } from '@/components/ui';
import { findings, groupAnswers, key, suggestedAssessment } from '@/survey/engine';
import { ASSESSMENT } from '@/survey/schema';
import { useInspection, useStore } from '@/store/inspections';
import { S } from '@/theme/tokens';

export default function Assessment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const setAnswer = useStore((s) => s.setAnswer);
  if (!inspection) return null;

  const answers = groupAnswers(inspection, ASSESSMENT.id);
  const suggested = suggestedAssessment(inspection);
  const fs = findings(inspection);
  const storm = fs.filter((f) => f.storm).length;
  const why: Record<string, string> = {
    storm: `${storm} storm-related item${storm === 1 ? '' : 's'} flagged`,
    defects: `${fs.length} item${fs.length === 1 ? '' : 's'} on the schedule`,
    priority: fs.length ? `highest priority flagged is ${Math.min(...fs.map((f) => f.priority))}` : 'nothing flagged',
    maintenance: `${fs.length} item${fs.length === 1 ? '' : 's'} flagged`,
    ingress: 'from damp, leak and roof-space answers',
  };

  return (
    <Screen
      header={<Header eyebrow="Assessment" title="Defects & storm vulnerability" />}
      footer={<Button title="Done" icon="checkmark" onPress={() => router.back()} />}>
      <T v="small" style={{ marginBottom: S.md }}>
        Suggestions are worked out from your answers so far — tap one to accept it, or choose your own.
      </T>
      {ASSESSMENT.questions.map((q) => {
        const sug = suggested[q.id];
        return (
          <QuestionCard
            key={q.id}
            question={q}
            answer={answers[q.id]}
            subject="property"
            sector={inspection.sector}
            suggestion={sug ? { optionId: sug, why: why[q.id] } : undefined}
            onChange={(patch) => setAnswer(inspection.id, key(ASSESSMENT.id, q.id), patch)}
          />
        );
      })}
    </Screen>
  );
}
