import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar, TierMedallion } from '@/components/graphics';
import { Button, Card, Empty, Icon, IconButton, Pill, Row, Screen, T, tap } from '@/components/ui';
import { findings, formatDate, overallProgress } from '@/survey/engine';
import { BRAND, TIERS } from '@/survey/schema';
import type { Inspection } from '@/survey/types';
import { useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';

type Filter = 'active' | 'complete' | 'all';

export default function Home() {
  const insets = useSafeAreaInsets();
  const inspections = useStore((s) => s.inspections);
  const deleteInspection = useStore((s) => s.deleteInspection);
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');

  // Light status bar over the navy hero; other screens use dark.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  const all = useMemo(() => Object.values(inspections).sort((a, b) => b.updatedAt - a.updatedAt), [inspections]);
  const active = all.filter((i) => i.status === 'in_progress');
  const complete = all.filter((i) => i.status === 'complete');

  const list = (filter === 'active' ? active : filter === 'complete' ? complete : all).filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const ins = i.instruction;
    return [ins.addressLine1, ins.postcode, ins.town, ins.claimNumber, ins.policyNumber, ins.policyholderName, i.ref]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const confirmDelete = (i: Inspection) =>
    Alert.alert('Delete inspection?', `${i.instruction.addressLine1 || i.ref} and all its photos will be removed from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteInspection(i.id) },
    ]);

  return (
    <Screen
      header={
        <View style={[styles.hero, { paddingTop: insets.top + S.md }]}>
          <View style={styles.heroInner}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="eyebrow" style={{ color: '#9FB8D1' }}>{BRAND.name}</T>
              <IconButton
                name="gearshape"
                label="Settings"
                color={C.white}
                bg="rgba(255,255,255,0.08)"
                onPress={() => router.push('/settings')}
              />
            </Row>
            <Text style={styles.heroTitle}>Home MOT</Text>
            <Text style={styles.heroStrap}>{BRAND.strap}</Text>
            <Row gap={S.lg} style={{ marginTop: S.lg }}>
              <Stat n={active.length} label="In progress" />
              <View style={styles.statRule} />
              <Stat n={complete.length} label="Completed" />
              <View style={styles.statRule} />
              <Stat
                n={active.reduce((acc, i) => acc + findings(i).filter((f) => f.priority <= 2).length, 0)}
                label="Urgent items open"
              />
            </Row>
          </View>
        </View>
      }>
      <Card onPress={() => router.push('/new')} style={styles.newCard}>
        <Row gap={S.md}>
          <View style={{ flexDirection: 'row' }}>
            {(['bronze', 'silver', 'gold'] as const).map((t, i) => (
              <View key={t} style={{ marginLeft: i ? -14 : 0 }}>
                <TierMedallion tier={t} size={40} />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <T v="heading">New inspection</T>
            <T v="small">Bronze roof · Silver external · Gold full</T>
          </View>
          <View style={styles.plus}>
            <Icon name="plus" size={18} color={C.white} weight="bold" />
          </View>
        </Row>
      </Card>

      <View style={styles.searchRow}>
        <Icon name="magnifyingglass" size={16} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search address, postcode, claim or policy no."
          placeholderTextColor={C.faint}
          style={styles.search}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['active', `In progress · ${active.length}`],
            ['complete', `Completed · ${complete.length}`],
            ['all', 'All'],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <Pressable
            key={k}
            onPress={() => {
              tap();
              setFilter(k);
            }}
            style={[styles.tab, filter === k && styles.tabOn]}>
            <Text style={[styles.tabText, filter === k && { color: C.ink }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {list.length === 0 ? (
        <Empty
          icon={all.length ? 'tray' : 'house'}
          title={all.length ? 'Nothing here' : 'No inspections yet'}
          body={
            all.length
              ? 'No inspections match this filter.'
              : 'Start a Bronze, Silver or Gold Home MOT. Everything is saved on this device as you go, so it works without signal.'
          }
          action={
            all.length ? undefined : <Button title="Start an inspection" icon="plus" onPress={() => router.push('/new')} />
          }
        />
      ) : (
        list.map((i) => <InspectionRow key={i.id} inspection={i} onLongPress={() => confirmDelete(i)} />)
      )}
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InspectionRow({ inspection: i, onLongPress }: { inspection: Inspection; onLongPress: () => void }) {
  const progress = overallProgress(i);
  const fs = findings(i);
  const urgent = fs.filter((f) => f.priority <= 2).length;
  const ins = i.instruction;
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push({ pathname: '/inspection/[id]', params: { id: i.id } });
      }}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <TierMedallion tier={i.tier} size={46} />
      <View style={{ flex: 1, gap: 3 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="eyebrow" style={{ fontSize: 10 }}>
            {TIERS[i.tier].name} · {i.sector === 'commercial' ? 'Commercial' : 'Domestic'} · {i.ref}
          </T>
          {i.status === 'complete' ? <Pill label="Signed off" tone="good" icon="checkmark" /> : null}
        </Row>
        <T v="heading" numberOfLines={1}>
          {ins.addressLine1 || 'Address not entered'}
          {ins.postcode ? <Text style={{ color: C.muted, fontFamily: F.medium }}>  {ins.postcode}</Text> : null}
        </T>
        <T v="small" numberOfLines={1}>
          {[ins.policyholderName, ins.claimNumber && `Claim ${ins.claimNumber}`, formatDate(ins.inspectionDate)]
            .filter(Boolean)
            .join(' · ')}
        </T>
        <Row style={{ marginTop: 6 }} gap={S.sm}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={progress} />
          </View>
          <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
          {urgent ? <Pill label={`${urgent} urgent`} tone="poor" /> : fs.length ? <Pill label={`${fs.length} items`} tone="fair" /> : null}
        </Row>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: C.ink, paddingHorizontal: S.lg, paddingBottom: S.xl },
  heroInner: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  heroTitle: { fontFamily: F.displayBold, fontSize: 44, lineHeight: 50, color: C.white, marginTop: S.sm, letterSpacing: -1 },
  heroStrap: { fontFamily: F.displayItalic, fontSize: 16, color: '#BFD3E6', marginTop: 2 },
  statN: { fontFamily: F.display, fontSize: 26, color: C.white },
  statLabel: { fontFamily: F.medium, fontSize: 12, color: '#9FB8D1' },
  statRule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.2)' },
  newCard: { marginTop: -4, borderColor: C.lineStrong },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginTop: S.lg,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    borderWidth: 1,
    borderColor: C.line,
  },
  search: { flex: 1, paddingVertical: 11, fontFamily: F.medium, fontSize: 15, color: C.ink },
  tabs: {
    flexDirection: 'row',
    marginTop: S.md,
    marginBottom: S.sm,
    backgroundColor: '#E8E4DA',
    borderRadius: R.md,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: R.sm, alignItems: 'center' },
  tabOn: { backgroundColor: C.card },
  tabText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
  row: {
    flexDirection: 'row',
    gap: S.md,
    alignItems: 'center',
    backgroundColor: C.card,
    padding: S.md,
    borderRadius: R.lg,
    marginTop: S.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  pct: { fontFamily: F.bold, fontSize: 12, color: C.muted, minWidth: 32, textAlign: 'right' },
});
