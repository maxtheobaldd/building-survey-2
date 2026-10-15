import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { InstructionForm } from '@/components/InstructionForm';
import { QuestionCard } from '@/components/QuestionCard';
import { Header, Icon, Row, Screen, SectionTitle, T } from '@/components/ui';
import { groupAnswers, key, propertyDescription, visibleQuestions } from '@/survey/engine';
import { PROFILE } from '@/survey/schema';
import { useInspection, useStore } from '@/store/inspections';
import { C, F } from '@/theme/tokens';

export default function Details() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const updateInstruction = useStore((s) => s.updateInstruction);
  const setAnswer = useStore((s) => s.setAnswer);
  if (!inspection) return null;

  const answers = groupAnswers(inspection, PROFILE.id);
  const qs = visibleQuestions(PROFILE.questions, answers, inspection.sector);
  const desc = propertyDescription(inspection);

  return (
    <Screen
      header={<Header eyebrow={inspection.ref} title="Instruction & property" />}
      footer={
        <View>
          <Row gap={6}>
            <Icon name="text.quote" size={12} color={C.brand} />
            <T v="eyebrow" style={{ color: C.brand, fontSize: 10 }}>Writing the report as you choose</T>
          </Row>
          <ScrollView style={{ maxHeight: 92, marginTop: 4 }}>
            <Text style={[styles.live, !desc && { color: C.faint }]}>
              {desc || 'The subject property is a …'}
            </Text>
          </ScrollView>
        </View>
      }>
      <InstructionForm
        value={inspection.instruction}
        onChange={(p) => updateInstruction(inspection.id, p)}
      />

      <SectionTitle>Property profile</SectionTitle>
      {qs.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answer={answers[q.id]}
          subject={PROFILE.subject}
          sector={inspection.sector}
          hideWording
          onChange={(patch) => setAnswer(inspection.id, key(PROFILE.id, q.id), patch)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  live: { fontFamily: F.displayItalic, fontSize: 14.5, lineHeight: 20, color: C.ink },
});

