import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PhotoStrip } from '@/components/PhotoStrip';
import { QuestionCard } from '@/components/QuestionCard';
import { ScanPanel } from '@/components/ScanPanel';
import { Button, Field, Header, Screen, SectionTitle, T } from '@/components/ui';
import { go } from '@/lib/nav';
import { groupAnswers, groupWording, key, visibleQuestions } from '@/survey/engine';
import { EXTERNAL, groupById, INTERNAL, ROOF } from '@/survey/schema';
import type { Answers, Group } from '@/survey/types';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

function siblings(groupId: string): Group[] {
  if (EXTERNAL.some((g) => g.id === groupId)) return EXTERNAL;
  if (INTERNAL.some((g) => g.id === groupId)) return INTERNAL;
  return [];
}

/** Engine-derived suggestions (e.g. height > 11 m → "Over 11 metres? Yes"). */
function suggestionFor(group: Group, qid: string, a: Answers) {
  if (group.id === ROOF.id && qid === 'over11m' && typeof a.height?.value === 'number') {
    const h = a.height.value;
    return { optionId: h > 11 ? 'yes' : 'no', why: `ridge height entered as ${h} m` };
  }
  return undefined;
}

export default function GroupScreen() {
  const { id, group: groupId } = useLocalSearchParams<{ id: string; group: string }>();
  const inspection = useInspection(id);
  const setAnswer = useStore((s) => s.setAnswer);
  const setGroupNote = useStore((s) => s.setGroupNote);
  const setGroupObservations = useStore((s) => s.setGroupObservations);
  const group = groupById(groupId);
  if (!inspection || !group) return null;

  const answers = groupAnswers(inspection, group.id);
  const qs = visibleQuestions(group.questions, answers, inspection.sector);
  const paragraph = groupWording(group, answers, inspection.sector);
  const sibs = siblings(group.id);
  const idx = sibs.findIndex((g) => g.id === group.id);
  const next = idx >= 0 ? sibs[idx + 1] : undefined;
  const observations = inspection.groupObservations[group.id] ?? '';
  const scannable = qs.some((q) => q.ai);

  return (
    <Screen
      header={
        <Header
          eyebrow={group.id === ROOF.id ? 'Bronze · Roof survey' : idx >= 0 ? `${idx + 1} of ${sibs.length}` : undefined}
          title={group.title}
        />
      }
      footer={
        next ? (
          <Button
            title={`Next: ${next.title}`}
            icon="arrow.right"
            kind="secondary"
            onPress={() => {
              router.back();
              go(inspection.id, `group/${next.id}`);
            }}
          />
        ) : (
          <Button title="Done" icon="checkmark" onPress={() => router.back()} />
        )
      }>
      {group.intro ? <T v="small" style={{ marginBottom: S.md }}>{group.intro}</T> : null}

      <PhotoStrip
        inspection={inspection}
        owner={{ kind: 'group', id: group.id }}
        prompt={group.photoPrompt}
        defaultCaption={group.title}
        minPhotos={group.minPhotos}
      />

      {scannable ? (
        <ScanPanel
          inspection={inspection}
          kind="element"
          subject={group.title}
          owner={{ kind: 'group', id: group.id }}
          questions={qs}
          answers={answers}
          setAnswer={(qid, patch) => setAnswer(inspection.id, key(group.id, qid), patch)}
          observations={observations}
          onObservations={(t) => setGroupObservations(inspection.id, group.id, t)}
        />
      ) : null}

      <SectionTitle>Questions</SectionTitle>
      {qs.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answer={answers[q.id]}
          subject={group.subject}
          sector={inspection.sector}
          suggestion={suggestionFor(group, q.id, answers)}
          onChange={(patch) => setAnswer(inspection.id, key(group.id, q.id), patch)}
        />
      ))}

      <Field
        label="Further comments"
        multiline
        defaultValue={inspection.groupNotes[group.id] ?? ''}
        onChangeText={(t) => setGroupNote(inspection.id, group.id, t)}
        placeholder="Anything else to record for this element"
      />

      {paragraph ? (
        <View style={styles.preview}>
          <T v="eyebrow" style={{ color: C.brandDeep }}>How this reads in the report</T>
          <Text style={styles.previewText}>{paragraph}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: C.brandTint,
    borderRadius: R.lg,
    padding: S.lg,
    marginTop: S.sm,
  },
  previewText: { fontFamily: F.displayItalic, fontSize: 15, lineHeight: 22, color: C.ink, marginTop: 6 },
});
