import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { SignaturePad } from '@/components/SignaturePad';
import { Button, Card, Chip, Field, Header, Pill, Row, Screen, SectionTitle, T } from '@/components/ui';
import { draftSummary, formatDate, RATING_LABEL, suggestedRating } from '@/survey/engine';
import { CLIENT_STATEMENT } from '@/survey/schema';
import type { Rating, Summary } from '@/survey/types';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

const RATINGS: { id: Rating; tone: 'good' | 'fair' | 'poor' | 'bad' }[] = [
  { id: 'excellent', tone: 'good' },
  { id: 'good', tone: 'good' },
  { id: 'fair', tone: 'fair' },
  { id: 'poor', tone: 'poor' },
  { id: 'unsatisfactory', tone: 'bad' },
];

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const updateSummary = useStore((s) => s.updateSummary);
  const setComplete = useStore((s) => s.setComplete);
  const profile = useStore((s) => s.profile);
  const [signing, setSigning] = useState(false);
  const [today] = useState(() => formatDate(Date.now()));
  if (!inspection) return null;

  const sum = inspection.summary;
  const draft = draftSummary(inspection);
  const suggested = suggestedRating(inspection);
  const set = (p: Partial<Summary>) => updateSummary(inspection.id, p);
  const signedBy = sum.signedBy ?? (inspection.instruction.inspector || profile.name);

  const block = (k: 'keyVulnerabilities' | 'priorityActions' | 'inspectorSummary', label: string, lines = 5) => {
    const edited = sum[k] !== undefined;
    return (
      <View style={{ marginBottom: S.lg }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <T v="label">{label}</T>
          {edited ? (
            <Button title="Use drafted wording" kind="ghost" small onPress={() => set({ [k]: undefined })} />
          ) : (
            <Pill label="Auto-drafted" tone="neutral" icon="wand.and.stars" />
          )}
        </Row>
        <TextInput
          key={`${k}-${edited ? 'e' : draft[k].length}`}
          defaultValue={sum[k] ?? draft[k]}
          onChangeText={(t) => set({ [k]: t })}
          multiline
          style={[styles.area, { minHeight: lines * 20, maxHeight: 240 }]}
        />
      </View>
    );
  };

  const signOff = () => {
    if (!sum.signature) {
      Alert.alert('Signature needed', 'Sign in the box to complete the inspection.');
      return;
    }
    set({
      signedBy,
      signedAt: Date.now(),
      rating: sum.rating ?? suggested,
      // Freeze the drafted wording at sign-off.
      keyVulnerabilities: sum.keyVulnerabilities ?? draft.keyVulnerabilities,
      priorityActions: sum.priorityActions ?? draft.priorityActions,
      inspectorSummary: sum.inspectorSummary ?? draft.inspectorSummary,
    });
    setComplete(inspection.id, true);
    router.back();
  };

  return (
    <Screen
      scrollEnabled={!signing}
      header={<Header eyebrow="Final section" title="Summary & sign-off" />}
      footer={
        inspection.status === 'complete' ? (
          <Button title="Reopen for editing" kind="secondary" icon="lock.open" onPress={() => setComplete(inspection.id, false)} />
        ) : (
          <Button title="Sign off & complete" icon="checkmark.seal" onPress={signOff} />
        )
      }>
      <SectionTitle>Overall Home MOT rating</SectionTitle>
      <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
        {RATINGS.map((r) => (
          <Chip
            key={r.id}
            label={`${RATING_LABEL[r.id]}${r.id === suggested ? ' ✦' : ''}`}
            tone={r.tone}
            selected={(sum.rating ?? suggested) === r.id}
            onPress={() => set({ rating: r.id })}
          />
        ))}
      </Row>
      <T v="small" style={{ marginTop: 6 }}>
        ✦ Suggested from the findings. {sum.rating ? '' : 'The suggestion is used unless you pick one.'}
      </T>

      <View style={{ height: S.xl }} />
      {block('keyVulnerabilities', 'Key storm vulnerabilities')}
      {block('priorityActions', 'Priority matters')}
      {block('inspectorSummary', 'Inspector summary', 9)}

      <Card style={{ backgroundColor: C.brandTint, borderColor: '#BCD6EE' }}>
        <T v="eyebrow" style={{ color: C.brandDeep }}>Included in every report</T>
        <ScrollView style={{ maxHeight: 80 }}>
          <T v="small" style={{ color: C.brandDeep, marginTop: 4 }}>{CLIENT_STATEMENT}</T>
        </ScrollView>
      </Card>

      <SectionTitle>Sign-off</SectionTitle>
      <Field label="Inspector" defaultValue={signedBy} onChangeText={(t) => set({ signedBy: t })} />
      <SignaturePad value={sum.signature} onChange={(p) => set({ signature: p })} onActive={setSigning} />
      <T v="small" style={{ marginTop: S.sm }}>
        {sum.signedAt ? `Signed ${formatDate(sum.signedAt)}` : `Date: ${today}`}
        {profile.qualifications ? ` · ${profile.qualifications}` : ''}
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  area: {
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: 12,
    fontFamily: F.body,
    fontSize: 14.5,
    lineHeight: 20,
    color: C.ink,
    textAlignVertical: 'top',
  },
});
