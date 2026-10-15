import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, Empty, Header, Icon, Pill, Row, Screen, SectionTitle, T } from '@/components/ui';
import { go } from '@/lib/nav';
import { inSector, photosFor, roomArea, selectedOptions } from '@/survey/engine';
import { LEVELS, ROOM_QUESTIONS, ROOM_TYPES } from '@/survey/schema';
import type { Room } from '@/survey/types';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

const conditionQ = ROOM_QUESTIONS.find((q) => q.id === 'condition')!;

export default function Rooms() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const addRoom = useStore((s) => s.addRoom);
  const [level, setLevel] = useState('Ground floor');
  if (!inspection) return null;

  const types = ROOM_TYPES.filter((t) => inSector(t, inspection.sector));

  const add = (typeId: string) => {
    const t = ROOM_TYPES.find((x) => x.id === typeId)!;
    const same = inspection.rooms.filter((r) => r.type === typeId).length;
    const numbered = ['bedroom', 'office', 'store', 'wc', 'meeting'].includes(typeId);
    const name = numbered ? `${t.label} ${same + 1}` : same ? `${t.label} ${same + 1}` : t.label;
    const roomId = addRoom(inspection.id, { name, type: typeId, level });
    go(inspection.id, `room/${roomId}`);
  };

  const byLevel = LEVELS.map((l) => ({ level: l, rooms: inspection.rooms.filter((r) => r.level === l) })).filter(
    (g) => g.rooms.length,
  );
  const totalArea = inspection.rooms.reduce((acc, r) => acc + (roomArea(r) ?? 0), 0);

  return (
    <Screen header={<Header eyebrow={`Gold · ${inspection.rooms.length} room${inspection.rooms.length === 1 ? "" : "s"}`} title="Internal rooms" />}>
      <Card>
        <T v="heading">Add a room</T>
        <T v="small" style={{ marginTop: 2 }}>Pick the floor, then tap the room type.</T>
        <Row gap={6} style={{ flexWrap: 'wrap', marginTop: S.md }}>
          {LEVELS.map((l) => (
            <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
          ))}
        </Row>
        <View style={styles.typeGrid}>
          {types.map((t) => (
            <Pressable key={t.id} onPress={() => add(t.id)} style={({ pressed }) => [styles.type, pressed && { opacity: 0.7 }]}>
              <Icon name="plus" size={12} color={C.brand} weight="bold" />
              <Text style={styles.typeText}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {inspection.rooms.length === 0 ? (
        <Empty
          icon="square.split.bottomrightquarter"
          title="No rooms yet"
          body="Add every room. Take 2–4 photos in each and let the AI scan describe the ceiling, walls, floor, features and any defects."
        />
      ) : (
        <>
          <SectionTitle right={<T v="small">{totalArea ? `${totalArea.toFixed(1)} m² recorded` : ''}</T>}>
            {`${inspection.rooms.length} room${inspection.rooms.length === 1 ? '' : 's'}`}
          </SectionTitle>
          {byLevel.map((g) => (
            <View key={g.level} style={{ marginBottom: S.sm }}>
              <T v="label" style={{ marginBottom: 6, color: C.muted }}>{g.level}</T>
              {g.rooms.map((r) => (
                <RoomRow key={r.id} room={r} photos={photosFor(inspection, { kind: 'room', id: r.id }).length} onPress={() => go(inspection.id, `room/${r.id}`)} />
              ))}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

function RoomRow({ room, photos, onPress }: { room: Room; photos: number; onPress: () => void }) {
  const area = roomArea(room);
  const cond = selectedOptions(conditionQ, room.answers.condition)[0];
  const dims = [room.length, room.width, room.height].every((x) => x)
    ? `${room.length} × ${room.width} × ${room.height} m`
    : 'Dimensions not recorded';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Row gap={6}>
          <T v="heading">{room.name}</T>
          {room.aiScannedAt ? <Icon name="sparkles" size={12} color={C.ai} /> : null}
        </Row>
        <Text style={styles.meta}>
          {dims}
          {area ? ` · ${area} m²` : ''} · {photos} photo{photos === 1 ? '' : 's'}
          {room.defects.length ? ` · ${room.defects.length} defect${room.defects.length === 1 ? '' : 's'}` : ''}
        </Text>
      </View>
      {cond ? <Pill label={cond.label} tone={cond.tone} /> : <Pill label="To do" tone="neutral" />}
      <Icon name="chevron.right" size={13} color={C.faint} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.md },
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
