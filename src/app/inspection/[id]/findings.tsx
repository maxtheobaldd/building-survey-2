import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, Empty, Field, Header, Icon, Pill, Row, Screen, SectionTitle, T, tap } from '@/components/ui';
import { FURTHER } from '@/survey/builders';
import { findings, type Finding } from '@/survey/engine';
import { PRIORITIES } from '@/survey/schema';
import type { Priority } from '@/survey/types';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S, TONE } from '@/theme/tokens';

const PRIOS: Priority[] = [1, 2, 3, 4];

export default function Findings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const setOverride = useStore((s) => s.setFindingOverride);
  const updateAction = useStore((s) => s.updateAction);
  const removeAction = useStore((s) => s.removeAction);
  const addAction = useStore((s) => s.addAction);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ area: '', action: '', priority: 3 as Priority });
  const [showDismissed, setShowDismissed] = useState(false);
  if (!inspection) return null;

  const all = findings(inspection, true);
  const live = all.filter((f) => !f.dismissed);
  const dismissed = all.filter((f) => f.dismissed);

  const setPriority = (f: Finding, p: Priority) => {
    if (f.auto) setOverride(inspection.id, f.key, { priority: p });
    else updateAction(inspection.id, f.key.replace('action.', ''), { priority: p });
  };

  return (
    <Screen header={<Header eyebrow="Policyholder action plan" title="Further investigation schedule" />}>
      <View style={styles.note}>
        <Icon name="info.circle" size={14} color={C.brandDeep} />
        <T v="small" style={{ flex: 1, color: C.brandDeep }}>
          Items are added automatically from adverse answers and room defects. Wording states what {FURTHER} — it never
          recommends, as required.
        </T>
      </View>

      {live.length === 0 ? (
        <Empty icon="checkmark.seal" title="Nothing flagged" body="No answers so far require further investigation." />
      ) : (
        PRIOS.map((p) => {
          const items = live.filter((f) => f.priority === p);
          if (!items.length) return null;
          return (
            <View key={p}>
              <SectionTitle>{`${PRIORITIES[p].label} · ${items.length}`}</SectionTitle>
              {items.map((f) => (
                <FindingCard
                  key={f.key}
                  f={f}
                  onPriority={(np) => setPriority(f, np)}
                  onDismiss={() =>
                    f.auto
                      ? setOverride(inspection.id, f.key, { dismissed: true })
                      : removeAction(inspection.id, f.key.replace('action.', ''))
                  }
                />
              ))}
            </View>
          );
        })
      )}

      <View style={{ height: S.lg }} />
      {adding ? (
        <Card>
          <T v="heading" style={{ marginBottom: S.md }}>Add an item</T>
          <Field label="Area / defect" value={draft.area} onChangeText={(t) => setDraft((d) => ({ ...d, area: t }))} placeholder="e.g. Rear garden wall" />
          <Field
            label="What would be required"
            multiline
            value={draft.action}
            onChangeText={(t) => setDraft((d) => ({ ...d, action: t }))}
            placeholder={`e.g. Leaning section of wall — ${FURTHER}.`}
          />
          <Row gap={6} style={{ flexWrap: 'wrap', marginBottom: S.md }}>
            {PRIOS.map((p) => (
              <Chip key={p} label={PRIORITIES[p].label} tone={PRIORITIES[p].tone} selected={draft.priority === p} onPress={() => setDraft((d) => ({ ...d, priority: p }))} />
            ))}
          </Row>
          <Row gap={S.sm}>
            <Button title="Cancel" kind="secondary" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Button
              title="Add"
              disabled={!draft.area.trim() || !draft.action.trim()}
              onPress={() => {
                addAction(inspection.id, { ...draft, evidence: '' });
                setDraft({ area: '', action: '', priority: 3 });
                setAdding(false);
              }}
              style={{ flex: 1 }}
            />
          </Row>
        </Card>
      ) : (
        <Button title="Add an item manually" icon="plus" kind="secondary" onPress={() => setAdding(true)} />
      )}

      {dismissed.length ? (
        <>
          <Pressable onPress={() => setShowDismissed((s) => !s)} style={{ marginTop: S.xl }}>
            <T v="eyebrow">{`${showDismissed ? 'Hide' : 'Show'} dismissed (${dismissed.length})`}</T>
          </Pressable>
          {showDismissed
            ? dismissed.map((f) => (
                <View key={f.key} style={[styles.card, { opacity: 0.6 }]}>
                  <T v="label">{f.area}</T>
                  <T v="small">{f.text}</T>
                  <Button title="Restore" kind="ghost" small style={{ alignSelf: 'flex-start' }} onPress={() => setOverride(inspection.id, f.key, { dismissed: false })} />
                </View>
              ))
            : null}
        </>
      ) : null}
    </Screen>
  );
}

function FindingCard({ f, onPriority, onDismiss }: { f: Finding; onPriority: (p: Priority) => void; onDismiss: () => void }) {
  const tone = TONE[PRIORITIES[f.priority].tone];
  return (
    <View style={[styles.card, { borderLeftColor: tone.dot }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={6} style={{ flex: 1 }}>
          <T v="eyebrow" style={{ color: tone.fg }} numberOfLines={1}>{f.area}</T>
          {f.storm ? <Pill label="Storm" tone="neutral" icon="wind" /> : null}
        </Row>
        <Pressable hitSlop={10} onPress={onDismiss} accessibilityLabel={f.auto ? 'Dismiss' : 'Delete'}>
          <Icon name="xmark" size={14} color={C.faint} weight="semibold" />
        </Pressable>
      </Row>
      <Text style={styles.text}>{f.text}</Text>
      {f.evidence ? <T v="small" style={{ marginTop: 4 }}>Evidence: {f.evidence}</T> : null}
      <Row gap={6} style={{ marginTop: S.sm }}>
        {PRIOS.map((p) => (
          <Pressable
            key={p}
            onPress={() => {
              tap();
              onPriority(p);
            }}
            style={[styles.prio, f.priority === p && { backgroundColor: TONE[PRIORITIES[p].tone].bg, borderColor: TONE[PRIORITIES[p].tone].dot }]}>
            <Text style={[styles.prioText, f.priority === p && { color: TONE[PRIORITIES[p].tone].fg }]}>
              {p} {PRIORITIES[p].short}
            </Text>
          </Pressable>
        ))}
        {!f.auto ? <Pill label="Manual" /> : f.priority !== f.defaultPriority ? <Pill label="Edited" /> : null}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: 8,
    padding: S.md,
    borderRadius: R.md,
    backgroundColor: C.brandTint,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.sm,
    borderLeftWidth: 4,
    borderLeftColor: C.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  text: { fontFamily: F.medium, fontSize: 15, lineHeight: 21, color: C.ink, marginTop: 4 },
  prio: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.line,
  },
  prioText: { fontFamily: F.semibold, fontSize: 11.5, color: C.muted },
});
