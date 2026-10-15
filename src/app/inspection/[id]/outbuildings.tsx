import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, Empty, Header, Icon, Pill, Row, Screen, SectionTitle, T } from '@/components/ui';
import { go } from '@/lib/nav';
import { photosFor, roomArea } from '@/survey/engine';
import { OUTBUILDING_TYPES } from '@/survey/schema';
import { OVERALL_CONDITIONS } from '@/survey/builders';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

export default function Outbuildings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const addOutbuilding = useStore((s) => s.addOutbuilding);
  const setAnswer = useStore((s) => s.setAnswer);
  if (!inspection) return null;

  const none = inspection.answers['outbuildings.none']?.value === 'yes';

  return (
    <Screen header={<Header eyebrow="Silver & Gold" title="Garage & outbuildings" />}>
      <Card>
        <T v="heading">Add a structure</T>
        <View style={styles.grid}>
          {OUTBUILDING_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                const oid = addOutbuilding(inspection.id, t);
                go(inspection.id, `outbuilding/${oid}`);
              }}
              style={({ pressed }) => [styles.type, pressed && { opacity: 0.7 }]}>
              <Icon name="plus" size={12} color={C.brand} weight="bold" />
              <Text style={styles.typeText}>{t}</Text>
            </Pressable>
          ))}
        </View>
        {inspection.outbuildings.length === 0 ? (
          <Row style={{ marginTop: S.lg, justifyContent: 'space-between' }}>
            <T v="label" style={{ flex: 1 }}>There are no outbuildings at this property</T>
            <Switch
              value={none}
              onValueChange={(v) => setAnswer(inspection.id, 'outbuildings.none', v ? { value: 'yes' } : null)}
              trackColor={{ true: C.brand }}
            />
          </Row>
        ) : null}
      </Card>

      {inspection.outbuildings.length === 0 ? (
        none ? null : (
          <Empty
            icon="car"
            title="No structures recorded"
            body="Add garages, summerhouses, garden rooms, sheds and workshops, or confirm there are none."
          />
        )
      ) : (
        <>
          <SectionTitle>{`${inspection.outbuildings.length} recorded`}</SectionTitle>
          {inspection.outbuildings.map((o) => {
            const cond = OVERALL_CONDITIONS.find((c) => c.id === o.condition);
            const area = roomArea(o);
            const photos = photosFor(inspection, { kind: 'outbuilding', id: o.id }).length;
            return (
              <Pressable
                key={o.id}
                onPress={() => go(inspection.id, `outbuilding/${o.id}`)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <T v="heading">{o.label || o.type}</T>
                  <Text style={styles.meta}>
                    {area ? `${area} m²` : 'No dimensions'} · {photos} photo{photos === 1 ? '' : 's'}
                  </Text>
                </View>
                {cond ? <Pill label={cond.label} tone={cond.tone} /> : <Pill label="To do" />}
                <Icon name="chevron.right" size={13} color={C.faint} weight="semibold" />
              </Pressable>
            );
          })}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.md },
  type: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: R.md,
    backgroundColor: C.brandTint,
  },
  typeText: { fontFamily: F.semibold, fontSize: 14, color: C.brandDeep },
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
