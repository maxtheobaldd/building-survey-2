import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/graphics';
import { Header, Icon, Pill, Row, Screen, T } from '@/components/ui';
import { go } from '@/lib/nav';
import { groupAnswers, isAnswered, photosFor, selectedOptions, visibleQuestions, worstTone } from '@/survey/engine';
import { groupsForSection, SECTIONS } from '@/survey/schema';
import type { Tone } from '@/survey/types';
import { useInspection } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

export default function SectionScreen() {
  const { id, section } = useLocalSearchParams<{ id: string; section: string }>();
  const inspection = useInspection(id);
  if (!inspection) return null;
  const def = SECTIONS.find((s) => s.id === section);
  const groups = groupsForSection(section);

  return (
    <Screen header={<Header eyebrow="Survey section" title={def?.title ?? 'Section'} />}>
      <T v="small" style={{ marginBottom: S.md }}>{def?.blurb}</T>
      {groups.map((g) => {
        const a = groupAnswers(inspection, g.id);
        const qs = visibleQuestions(g.questions, a, inspection.sector);
        const done = qs.filter((q) => isAnswered(a[q.id])).length;
        const photos = photosFor(inspection, { kind: 'group', id: g.id }).length;
        const tones = qs.flatMap((q) => selectedOptions(q, a[q.id]).map((o) => o.tone ?? 'neutral')) as Tone[];
        const worst = worstTone(tones);
        const cond = qs.find((q) => q.type === 'condition');
        const condLabel = cond ? selectedOptions(cond, a[cond.id])[0]?.label : undefined;
        return (
          <Pressable
            key={g.id}
            onPress={() => go(inspection.id, `group/${g.id}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
            <ProgressRing value={qs.length ? done / qs.length : 0} size={40} stroke={3.5} />
            <View style={{ flex: 1, gap: 3 }}>
              <Row gap={6}>
                <Icon name={g.icon} size={14} color={C.brand} />
                <T v="heading" style={{ flex: 1 }}>{g.title}</T>
              </Row>
              <Row gap={6}>
                <Text style={styles.meta}>
                  {done}/{qs.length} answered · {photos} photo{photos === 1 ? '' : 's'}
                </Text>
                {condLabel ? (
                  <Pill label={condLabel} tone={worst === 'neutral' ? 'neutral' : worst} />
                ) : worst === 'bad' || worst === 'poor' ? (
                  <Pill label="Defects noted" tone={worst} />
                ) : null}
              </Row>
            </View>
            <Icon name="chevron.right" size={13} color={C.faint} weight="semibold" />
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  meta: { fontFamily: F.medium, fontSize: 12.5, color: C.muted },
});
