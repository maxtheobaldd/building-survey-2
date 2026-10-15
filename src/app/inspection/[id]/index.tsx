import { router, useLocalSearchParams } from 'expo-router';
import { ActionSheetIOS, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing, TierMedallion } from '@/components/graphics';
import { Button, Card, Empty, Header, Icon, IconButton, Pill, Row, Screen, SectionTitle, T } from '@/components/ui';
import { go } from '@/lib/nav';
import {
  canRate,
  findings,
  overallProgress,
  propertyDescription,
  RATING_LABEL,
  sectionProgress,
  suggestedRating,
} from '@/survey/engine';
import { PRIORITIES, SECTIONS, TIER_ORDER, TIERS } from '@/survey/schema';
import type { Priority, SectionId, Tier } from '@/survey/types';
import { useInspection, useStore } from '@/store/inspections';
import { C, F, R, S, TONE } from '@/theme/tokens';

const ROUTES: Record<SectionId, string> = {
  details: 'details',
  roof: 'group/roof',
  external: 'section/external',
  outbuildings: 'outbuildings',
  rooms: 'rooms',
  internal: 'section/internal',
  assessment: 'assessment',
  findings: 'findings',
  summary: 'summary',
};

export default function Hub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const setTier = useStore((s) => s.setTier);
  const setComplete = useStore((s) => s.setComplete);
  const deleteInspection = useStore((s) => s.deleteInspection);

  if (!inspection) {
    return (
      <Screen header={<Header title="Inspection" />}>
        <Empty icon="questionmark.folder" title="Inspection not found" body="It may have been deleted." />
      </Screen>
    );
  }

  const i = inspection;
  const progress = overallProgress(i);
  const fs = findings(i);
  const desc = propertyDescription(i);
  const rating = i.summary.rating ?? suggestedRating(i);
  const counts = ([1, 2, 3, 4] as Priority[]).map((p) => fs.filter((f) => f.priority === p).length);

  const upgrade = (to: Tier) =>
    Alert.alert(
      `Upgrade to ${TIERS[to].name}?`,
      `${TIERS[to].strap}: ${TIERS[to].includes.slice(1).join(', ')}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: `Upgrade to ${TIERS[to].name}`, onPress: () => setTier(i.id, to) },
      ],
    );

  const menu = () => {
    const options = [
      i.status === 'complete' ? 'Reopen inspection' : 'Mark as complete',
      'Change survey level',
      'Delete inspection',
      'Cancel',
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, destructiveButtonIndex: 2, cancelButtonIndex: 3 },
      (idx) => {
        if (idx === 0) setComplete(i.id, i.status !== 'complete');
        if (idx === 1) {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: [...TIER_ORDER.map((t) => `${TIERS[t].name} — ${TIERS[t].strap}`), 'Cancel'],
              cancelButtonIndex: 3,
            },
            (t) => {
              if (t < 3) setTier(i.id, TIER_ORDER[t]);
            },
          );
        }
        if (idx === 2) {
          Alert.alert('Delete inspection?', 'This removes the inspection and all its photos from this device.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                router.back();
                deleteInspection(i.id);
              },
            },
          ]);
        }
      },
    );
  };

  return (
    <Screen
      header={
        <Header
          eyebrow={`${TIERS[i.tier].name} · ${i.sector === 'commercial' ? 'Commercial' : 'Domestic'} · ${i.ref}`}
          title={i.instruction.addressLine1 || 'New inspection'}
          right={<IconButton name="ellipsis" label="More" onPress={menu} />}>
          <T v="small" style={{ marginTop: 2 }}>
            {[i.instruction.postcode, i.instruction.policyholderName, i.instruction.claimNumber && `Claim ${i.instruction.claimNumber}`]
              .filter(Boolean)
              .join(' · ')}
          </T>
        </Header>
      }
      footer={
        <Button
          title="Preview & share report"
          icon="doc.richtext"
          onPress={() => go(i.id, 'report')}
        />
      }>
      <Card>
        <Row gap={S.lg}>
          <ProgressRing value={progress} size={72} stroke={6} label={`${Math.round(progress * 100)}%`} />
          <View style={{ flex: 1, gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="eyebrow">Suggested rating</T>
              <TierMedallion tier={i.tier} size={30} />
            </Row>
            <Text style={[styles.rating, !i.summary.rating && !canRate(i) && { color: C.faint }]}>
              {i.summary.rating || canRate(i) ? RATING_LABEL[rating] : 'Pending'}
            </Text>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {counts.every((c) => !c) ? (
                <Pill label="No matters flagged yet" tone="good" />
              ) : (
                counts.map((c, idx) =>
                  c ? (
                    <Pill
                      key={idx}
                      label={`${c} ${PRIORITIES[(idx + 1) as Priority].short.toLowerCase()}`}
                      tone={PRIORITIES[(idx + 1) as Priority].tone}
                    />
                  ) : null,
                )
              )}
            </Row>
          </View>
        </Row>
      </Card>

      <Pressable onPress={() => go(i.id, 'details')} style={styles.narrative}>
        <Row gap={6}>
          <Icon name="text.quote" size={13} color={C.brand} />
          <T v="eyebrow" style={{ color: C.brand }}>Report — property description</T>
        </Row>
        <Text style={[styles.narrativeText, !desc && { color: C.faint }]}>
          {desc ||
            'Choose the property type, storeys, construction and roof in Instruction & property — the description writes itself here as you go.'}
        </Text>
      </Pressable>

      <SectionTitle>Survey sections</SectionTitle>
      {SECTIONS.map((s, idx) => {
        const included = s.tiers.includes(i.tier);
        const p = included ? sectionProgress(i, s.id) : undefined;
        const done = p && p.total > 0 && p.done >= p.total;
        const minTier = TIER_ORDER.find((t) => s.tiers.includes(t))!;
        const count =
          s.id === 'findings'
            ? `${fs.length} item${fs.length === 1 ? '' : 's'}`
            : s.id === 'rooms'
              ? `${i.rooms.length} room${i.rooms.length === 1 ? '' : 's'}`
              : s.id === 'outbuildings' && i.outbuildings.length
                ? `${i.outbuildings.length} structure${i.outbuildings.length === 1 ? '' : 's'}`
                : p
                  ? `${p.done}/${p.total}`
                  : '';
        return (
          <Pressable
            key={s.id}
            onPress={() => (included ? go(i.id, ROUTES[s.id]) : upgrade(minTier))}
            style={({ pressed }) => [styles.section, !included && styles.locked, pressed && { opacity: 0.8 }]}>
            <View style={[styles.sectionIcon, done && { backgroundColor: TONE.good.bg }]}>
              {done && s.id !== 'findings' ? (
                <Icon name="checkmark" size={17} color={TONE.good.fg} weight="bold" />
              ) : (
                <Icon name={s.icon} size={18} color={included ? C.brand : C.faint} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Row gap={6}>
                <Text style={styles.sectionNo}>{idx + 1}</Text>
                <T v="heading" style={!included && { color: C.muted }}>{s.title}</T>
              </Row>
              <T v="small" numberOfLines={2}>
                {included ? s.blurb : `Included in ${TIERS[minTier].name} — tap to upgrade.`}
              </T>
            </View>
            {included ? (
              <Row gap={4}>
                <Text style={styles.count}>{count}</Text>
                <Icon name="chevron.right" size={13} color={C.faint} weight="semibold" />
              </Row>
            ) : (
              <TierMedallion tier={minTier} size={26} />
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rating: { fontFamily: F.display, fontSize: 26, color: C.ink, lineHeight: 30 },
  narrative: {
    marginTop: S.md,
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    borderLeftWidth: 4,
    borderLeftColor: C.brand,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  narrativeText: { fontFamily: F.displayItalic, fontSize: 16, lineHeight: 23, color: C.ink, marginTop: 6 },
  section: {
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
  locked: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: C.lineStrong },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNo: { fontFamily: F.display, fontSize: 13, color: C.faint, width: 14 },
  count: { fontFamily: F.bold, fontSize: 13, color: C.muted },
});
