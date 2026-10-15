import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PhotoStrip } from '@/components/PhotoStrip';
import { QuestionCard } from '@/components/QuestionCard';
import { ScanPanel } from '@/components/ScanPanel';
import { Button, Card, Chip, Field, Header, Icon, IconButton, NumberField, Pill, Row, Screen, SectionTitle, T, tap } from '@/components/ui';
import { roomArea, roomWording, visibleQuestions } from '@/survey/engine';
import { LEVELS, ROOM_QUESTIONS } from '@/survey/schema';
import type { Severity } from '@/survey/types';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

const SEVERITY_TONE = { minor: 'fair', moderate: 'poor', significant: 'bad' } as const;
const NEXT_SEVERITY: Record<Severity, Severity> = { minor: 'moderate', moderate: 'significant', significant: 'minor' };

export default function RoomScreen() {
  const { id, room: roomId } = useLocalSearchParams<{ id: string; room: string }>();
  const inspection = useInspection(id);
  const s = useStore();
  const room = inspection?.rooms.find((r) => r.id === roomId);
  if (!inspection || !room) return null;

  const qs = visibleQuestions(ROOM_QUESTIONS, room.answers, inspection.sector);
  const area = roomArea(room);
  const paragraph = roomWording(room, inspection.sector);
  const update = (p: Parameters<typeof s.updateRoom>[2]) => s.updateRoom(inspection.id, room.id, p);

  const remove = () =>
    Alert.alert(`Delete ${room.name}?`, 'Its photos and answers will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          s.removeRoom(inspection.id, room.id);
        },
      },
    ]);

  return (
    <Screen
      header={
        <Header
          eyebrow={`${room.level} · Room`}
          title={room.name}
          right={<IconButton name="trash" label="Delete room" color={C.danger} onPress={remove} />}
        />
      }
      footer={<Button title="Done" icon="checkmark" onPress={() => router.back()} />}>
      <Card>
        <Field label="Room name" defaultValue={room.name} onChangeText={(t) => update({ name: t })} />
        <Row gap={6} style={{ flexWrap: 'wrap', marginBottom: S.md }}>
          {LEVELS.map((l) => (
            <Chip key={l} label={l} selected={room.level === l} onPress={() => update({ level: l })} />
          ))}
        </Row>
        <Row gap={S.sm} style={{ alignItems: 'flex-end' }}>
          <NumberField label="Length" unit="m" value={room.length} onChange={(n) => update({ length: n })} />
          <Text style={styles.times}>×</Text>
          <NumberField label="Width" unit="m" value={room.width} onChange={(n) => update({ width: n })} />
          <Text style={styles.times}>×</Text>
          <NumberField label="Height" unit="m" value={room.height} onChange={(n) => update({ height: n })} />
        </Row>
        <Row style={{ marginTop: S.md, justifyContent: 'space-between' }}>
          <T v="small">Floor area (L × W)</T>
          <Text style={styles.area}>{area ? `${area} m²` : '—'}</Text>
        </Row>
      </Card>

      <View style={{ height: S.md }} />
      <PhotoStrip
        inspection={inspection}
        owner={{ kind: 'room', id: room.id }}
        prompt="Take 2–4 photos: each wall, the ceiling and the floor"
        defaultCaption={room.name}
        minPhotos={2}
      />

      <ScanPanel
        inspection={inspection}
        kind="room"
        subject={room.name}
        owner={{ kind: 'room', id: room.id }}
        questions={qs}
        answers={room.answers}
        setAnswer={(qid, patch) => s.setRoomAnswer(inspection.id, room.id, qid, patch)}
        observations={room.observations}
        onObservations={(t) => update({ observations: t })}
        scannedAt={room.aiScannedAt}
        warning={room.aiWarning}
        onResult={(r) => {
          const manual = room.defects.filter((d) => d.source === 'manual');
          update({
            aiScannedAt: Date.now(),
            aiWarning: r.imageWarning,
            defects: [
              ...manual,
              ...r.defects.map((d, i) => ({ ...d, id: `ai-${Date.now()}-${i}`, source: 'ai' as const })),
            ],
          });
        }}
      />

      <SectionTitle>Finishes & condition</SectionTitle>
      {qs.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answer={room.answers[q.id]}
          subject={room.name.toLowerCase()}
          sector={inspection.sector}
          onChange={(patch) => s.setRoomAnswer(inspection.id, room.id, q.id, patch)}
        />
      ))}

      <SectionTitle
        right={
          <Button
            title="Add defect"
            icon="plus"
            kind="ghost"
            small
            onPress={() =>
              s.addDefect(inspection.id, room.id, { description: '', location: '', severity: 'moderate', source: 'manual' })
            }
          />
        }>
        {`Defects · ${room.defects.length}`}
      </SectionTitle>
      {room.defects.length === 0 ? (
        <T v="small" style={{ marginBottom: S.md }}>
          No defects recorded. The AI scan adds any it can see; you can add your own.
        </T>
      ) : (
        room.defects.map((d) => (
          <View key={d.id} style={styles.defect}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <Pressable
                onPress={() => {
                  tap();
                  s.updateDefect(inspection.id, room.id, d.id, { severity: NEXT_SEVERITY[d.severity] });
                }}>
                <Pill label={`${d.severity} ▾`} tone={SEVERITY_TONE[d.severity]} />
              </Pressable>
              <Row gap={S.sm}>
                {d.source === 'ai' ? <Icon name="sparkles" size={13} color={C.ai} /> : null}
                <Pressable hitSlop={10} onPress={() => s.removeDefect(inspection.id, room.id, d.id)}>
                  <Icon name="xmark.circle.fill" size={18} color={C.faint} />
                </Pressable>
              </Row>
            </Row>
            <TextInput
              defaultValue={d.description}
              onChangeText={(t) => s.updateDefect(inspection.id, room.id, d.id, { description: t })}
              placeholder="Describe the defect, e.g. hole to plaster beside the door"
              placeholderTextColor={C.faint}
              multiline
              style={styles.defectText}
            />
            <TextInput
              defaultValue={d.location}
              onChangeText={(t) => s.updateDefect(inspection.id, room.id, d.id, { location: t })}
              placeholder="Location"
              placeholderTextColor={C.faint}
              style={styles.defectLoc}
            />
          </View>
        ))
      )}

      {paragraph || room.observations ? (
        <View style={styles.preview}>
          <T v="eyebrow" style={{ color: C.brandDeep }}>How this reads in the report</T>
          <Text style={styles.previewText}>{[room.observations, paragraph].filter(Boolean).join(' ')}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  times: { fontFamily: F.display, fontSize: 18, color: C.faint, paddingBottom: 12 },
  area: { fontFamily: F.display, fontSize: 20, color: C.ink },
  defect: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  defectText: { fontFamily: F.medium, fontSize: 15, color: C.ink, lineHeight: 20 },
  defectLoc: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 4 },
  preview: { backgroundColor: C.brandTint, borderRadius: R.lg, padding: S.lg, marginTop: S.md },
  previewText: { fontFamily: F.displayItalic, fontSize: 15, lineHeight: 22, color: C.ink, marginTop: 6 },
});
