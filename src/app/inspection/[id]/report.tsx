import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Button, Header, Icon, Row, Screen, T } from '@/components/ui';
import { photoBase64 } from '@/lib/photos';
import { buildReportHtml, reportFileName } from '@/report/html';
import { sectionProgress, sectionsFor } from '@/survey/engine';
import { useInspection, useStore } from '@/store/inspections';
import { C, R, S } from '@/theme/tokens';

const A4 = { width: 595, height: 842 };
const MARGINS = { top: 36, bottom: 40, left: 34, right: 34 };

export default function Report() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inspection = useInspection(id);
  const profile = useStore((s) => s.profile);
  const [busy, setBusy] = useState<'pdf' | 'print' | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  // Building the HTML base64-encodes every photo, so do it after first paint.
  useEffect(() => {
    if (!inspection) return;
    const t = setTimeout(() => {
      setHtml(buildReportHtml(inspection, { photoData: photoBase64, inspector: profile }));
    }, 50);
    return () => clearTimeout(t);
  }, [inspection, profile]);

  const gaps = useMemo(() => {
    if (!inspection) return [];
    return sectionsFor(inspection.tier)
      .filter((s) => s.id !== 'findings')
      .map((s) => ({ s, p: sectionProgress(inspection, s.id) }))
      .filter(({ p }) => p.done < p.total);
  }, [inspection]);

  if (!inspection) return null;

  const pdf = async () => {
    if (!html) return;
    setBusy('pdf');
    try {
      const { uri } = await Print.printToFileAsync({ html, ...A4, margins: MARGINS });
      const named = new File(Paths.cache, reportFileName(inspection));
      if (named.exists) named.delete();
      new File(uri).moveSync(named);
      await Sharing.shareAsync(named.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Share Home MOT report',
      });
    } catch (e) {
      Alert.alert('Could not create the PDF', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const print = async () => {
    if (!html) return;
    setBusy('print');
    try {
      await Print.printAsync({ html, ...A4, margins: MARGINS });
    } catch {
      // Cancelled.
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen
      scroll={false}
      header={<Header eyebrow={inspection.ref} title="Report" />}
      footer={
        <Row gap={S.sm}>
          <Button title="Print" icon="printer" kind="secondary" onPress={print} loading={busy === 'print'} disabled={!html} style={{ flex: 1 }} />
          <Button title="Share PDF" icon="square.and.arrow.up" onPress={pdf} loading={busy === 'pdf'} disabled={!html} style={{ flex: 2 }} />
        </Row>
      }>
      {gaps.length ? (
        <View style={styles.warn}>
          <Icon name="exclamationmark.circle" size={15} color="#8A5A00" />
          <T v="small" style={{ flex: 1, color: '#8A5A00' }}>
            Still to complete: {gaps.map(({ s, p }) => `${s.short} (${p.done}/${p.total})`).join(', ')}.
          </T>
        </View>
      ) : null}
      <View style={styles.paper}>
        {html ? (
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            style={{ backgroundColor: C.white }}
            showsVerticalScrollIndicator
            setSupportMultipleWindows={false}
          />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={C.brand} />
            <T v="small" style={{ marginTop: S.sm }}>Assembling report…</T>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: S.lg,
    marginTop: S.md,
    padding: S.sm,
    paddingLeft: S.md,
    borderRadius: R.md,
    backgroundColor: '#FBF0D9',
  },
  paper: {
    flex: 1,
    margin: S.md,
    borderRadius: R.md,
    overflow: 'hidden',
    backgroundColor: C.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.lineStrong,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
