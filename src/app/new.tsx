import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TierMedallion } from '@/components/graphics';
import { InstructionForm } from '@/components/InstructionForm';
import { Button, Header, Icon, Row, Screen, SectionTitle, T, tap } from '@/components/ui';
import { TIER_ORDER, TIERS } from '@/survey/schema';
import type { Instruction, Sector, Tier } from '@/survey/types';
import { emptyInstruction, useStore } from '@/store/inspections';
import { C, F, R, S, SHADOW } from '@/theme/tokens';

export default function NewInspection() {
  const profile = useStore((s) => s.profile);
  const createInspection = useStore((s) => s.createInspection);
  const [tier, setTier] = useState<Tier>('gold');
  const [sector, setSector] = useState<Sector>('domestic');
  const [instruction, setInstruction] = useState<Instruction>(() => emptyInstruction(profile.name));

  const create = () => {
    if (!instruction.addressLine1.trim()) {
      Alert.alert('Address needed', 'Enter at least the first line of the property address.');
      return;
    }
    const id = createInspection({ tier, sector, instruction });
    router.dismissTo({ pathname: '/inspection/[id]', params: { id } });
  };

  return (
    <Screen
      header={<Header modal eyebrow="Home MOT" title="New inspection" />}
      footer={<Button title={`Start ${TIERS[tier].name} inspection`} icon="arrow.right" onPress={create} />}>
      <SectionTitle>Survey level</SectionTitle>
      {TIER_ORDER.map((t) => {
        const on = tier === t;
        const info = TIERS[t];
        return (
          <Pressable
            key={t}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              setTier(t);
            }}
            style={[styles.tier, on && { borderColor: info.colors[1], borderWidth: 2 }]}>
            <TierMedallion tier={t} size={58} />
            <View style={{ flex: 1 }}>
              <Row gap={6}>
                <Text style={styles.tierName}>{info.name}</Text>
                <Text style={styles.tierStrap}>{info.strap}</Text>
              </Row>
              {info.includes.map((line) => (
                <Row key={line} gap={6} style={{ marginTop: 3, alignItems: 'flex-start' }}>
                  <Icon name="checkmark" size={11} color={info.colors[2]} weight="bold" />
                  <T v="small" style={{ flex: 1, color: C.ink2 }}>{line}</T>
                </Row>
              ))}
            </View>
            <View style={[styles.radio, on && { borderColor: info.colors[1] }]}>
              {on ? <View style={[styles.radioDot, { backgroundColor: info.colors[1] }]} /> : null}
            </View>
          </Pressable>
        );
      })}

      <SectionTitle>Property sector</SectionTitle>
      <View style={styles.seg}>
        {(['domestic', 'commercial'] as Sector[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              tap();
              setSector(s);
            }}
            style={[styles.segBtn, sector === s && styles.segOn]}>
            <Icon name={s === 'domestic' ? 'house' : 'building.2'} size={16} color={sector === s ? C.white : C.ink2} />
            <Text style={[styles.segText, sector === s && { color: C.white }]}>
              {s === 'domestic' ? 'Domestic' : 'Commercial'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: S.xl }} />
      <InstructionForm value={instruction} onChange={(p) => setInstruction((i) => ({ ...i, ...p }))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tier: {
    flexDirection: 'row',
    gap: S.md,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.sm,
    borderWidth: 1,
    borderColor: C.line,
    ...SHADOW,
  },
  tierName: { fontFamily: F.display, fontSize: 20, color: C.ink },
  tierStrap: { fontFamily: F.semibold, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  seg: { flexDirection: 'row', gap: S.sm },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: R.md,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  segOn: { backgroundColor: C.ink, borderColor: C.ink },
  segText: { fontFamily: F.semibold, fontSize: 15, color: C.ink2 },
});
