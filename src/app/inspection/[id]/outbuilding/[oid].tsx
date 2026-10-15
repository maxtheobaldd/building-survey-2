import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { PhotoStrip } from '@/components/PhotoStrip';
import { Button, Card, Chip, Field, Header, IconButton, NumberField, Row, Screen, SectionTitle, T } from '@/components/ui';
import { ELEMENT_CONDITIONS, OVERALL_CONDITIONS } from '@/survey/builders';
import { roomArea } from '@/survey/engine';
import { OUTBUILDING_TYPES, OUTBUILDING_WORDING } from '@/survey/schema';
import type { ElementCondition, OverallCondition } from '@/survey/types';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

export default function OutbuildingScreen() {
  const { id, oid } = useLocalSearchParams<{ id: string; oid: string }>();
  const inspection = useInspection(id);
  const updateOutbuilding = useStore((s) => s.updateOutbuilding);
  const removeOutbuilding = useStore((s) => s.removeOutbuilding);
  const o = inspection?.outbuildings.find((x) => x.id === oid);
  if (!inspection || !o) return null;

  const update = (p: Parameters<typeof updateOutbuilding>[2]) => updateOutbuilding(inspection.id, o.id, p);
  const area = roomArea(o);

  return (
    <Screen
      header={
        <Header
          eyebrow="Outbuilding"
          title={o.label || o.type}
          right={
            <IconButton
              name="trash"
              label="Delete"
              color={C.danger}
              onPress={() =>
                Alert.alert(`Delete ${o.label}?`, undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      router.back();
                      removeOutbuilding(inspection.id, o.id);
                    },
                  },
                ])
              }
            />
          }
        />
      }
      footer={<Button title="Done" icon="checkmark" onPress={() => router.back()} />}>
      <Card>
        <Row gap={6} style={{ flexWrap: 'wrap', marginBottom: S.md }}>
          {OUTBUILDING_TYPES.map((t) => (
            <Chip key={t} label={t} selected={o.type === t} onPress={() => update({ type: t })} />
          ))}
        </Row>
        <Field label="Name / description" defaultValue={o.label} onChangeText={(t) => update({ label: t })} />
        <Row gap={S.sm} style={{ alignItems: 'flex-end' }}>
          <NumberField label="Length" unit="m" value={o.length} onChange={(n) => update({ length: n })} />
          <Text style={styles.times}>×</Text>
          <NumberField label="Width" unit="m" value={o.width} onChange={(n) => update({ width: n })} />
          <Text style={styles.times}>×</Text>
          <NumberField label="Height" unit="m" value={o.height} onChange={(n) => update({ height: n })} />
        </Row>
        <Row style={{ marginTop: S.md, justifyContent: 'space-between' }}>
          <T v="small">Area</T>
          <Text style={styles.area}>{area ? `${area} m²` : '—'}</Text>
        </Row>
      </Card>

      <View style={{ height: S.md }} />
      <PhotoStrip
        inspection={inspection}
        owner={{ kind: 'outbuilding', id: o.id }}
        prompt="Photograph the structure, roof and any defects"
        defaultCaption={o.label || o.type}
      />

      <SectionTitle>Roof</SectionTitle>
      <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
        {ELEMENT_CONDITIONS.map((c) => (
          <Chip key={c.id} label={c.label} tone={c.tone} selected={o.roof === c.id} onPress={() => update({ roof: o.roof === c.id ? undefined : (c.id as ElementCondition) })} />
        ))}
      </Row>
      <SectionTitle>Walls</SectionTitle>
      <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
        {ELEMENT_CONDITIONS.map((c) => (
          <Chip key={c.id} label={c.label} tone={c.tone} selected={o.walls === c.id} onPress={() => update({ walls: o.walls === c.id ? undefined : (c.id as ElementCondition) })} />
        ))}
      </Row>
      <SectionTitle>Overall condition</SectionTitle>
      <Row gap={S.sm} style={{ flexWrap: 'wrap', marginBottom: S.lg }}>
        {OVERALL_CONDITIONS.map((c) => (
          <Chip key={c.id} label={c.label} tone={c.tone} selected={o.condition === c.id} onPress={() => update({ condition: o.condition === c.id ? undefined : (c.id as OverallCondition) })} />
        ))}
      </Row>

      <Field
        label="Description / defects"
        multiline
        defaultValue={o.description}
        onChangeText={(t) => update({ description: t })}
        placeholder="e.g. Single garage, brick walls, flat felt roof with ponding at rear"
      />

      <View style={styles.preview}>
        <T v="eyebrow" style={{ color: C.brandDeep }}>Report wording</T>
        <Text style={styles.previewText}>{OUTBUILDING_WORDING}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  times: { fontFamily: F.display, fontSize: 18, color: C.faint, paddingBottom: 12 },
  area: { fontFamily: F.display, fontSize: 20, color: C.ink },
  preview: { backgroundColor: C.brandTint, borderRadius: R.lg, padding: S.lg, marginTop: S.sm },
  previewText: { fontFamily: F.displayItalic, fontSize: 15, lineHeight: 22, color: C.ink, marginTop: 6 },
});
